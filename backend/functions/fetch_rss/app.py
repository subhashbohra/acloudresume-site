import os, json, hashlib, urllib.request, email.utils, datetime
import boto3
from xml.etree import ElementTree as ET

ddb = boto3.resource("dynamodb")
bedrock = boto3.client("bedrock-runtime")

UPDATES_TABLE = os.environ["UPDATES_TABLE"]
RSS_FEED_URL = os.environ["RSS_FEED_URL"]
SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://acloudresume.com").rstrip("/")
TEXT_MODEL_ID = os.environ.get("TEXT_MODEL_ID", "amazon.titan-text-express-v1")
GENERATE_SUMMARY = os.environ.get("GENERATE_SUMMARY", "true").lower() == "true"

def iso_week_key(dt: datetime.datetime) -> str:
    year, week, _ = dt.isocalendar()
    return f"{year}-W{week:02d}"

def classify(title: str, categories: list[str]) -> str:
    t = (title or "").lower()
    c = " ".join(categories or []).lower()
    hay = f"{t} {c}"
    if any(k in hay for k in ["lambda","serverless","api gateway","apigateway","eventbridge","step functions","sns","sqs","dynamodb streams"]):
        return "Serverless"
    if any(k in hay for k in ["bedrock","genai","generative","llm","amazon q","nova","sagemaker","claude","titan","prompt","rag"]):
        return "AI & GenAI"
    if any(k in hay for k in ["agent","agents","agentic","tool use","function calling","workflow"]):
        return "AI Agents"
    if any(k in hay for k in ["cloudwatch","x-ray","opentelemetry","observability","grafana","prometheus","new relic","datadog","devops","codepipeline","codebuild","codeartifact","codedeploy"]):
        return "DevOps & Observability"
    if any(k in hay for k in ["eks","kubernetes","ecs","fargate","ecr","container"]):
        return "Containers & Kubernetes"
    if any(k in hay for k in ["iam","kms","security","guardduty","inspector","waf","shield","secrets manager"]):
        return "Security"
    if any(k in hay for k in ["athena","glue","lake formation","redshift","emr","kinesis","msk","quicksight","data"]):
        return "Data & Analytics"
    if any(k in hay for k in ["rds","aurora","dynamodb","documentdb","neptune","timestream","keyspaces","database"]):
        return "Databases"
    if any(k in hay for k in ["s3","efs","fsx","storage","backup"]):
        return "Storage"
    if any(k in hay for k in ["vpc","route 53","cloudfront","elb","alb","nlb","network","direct connect"]):
        return "Networking"
    return "Other"

def summarize_with_titan(title: str, link: str, category: str) -> str:
    prompt = f"""You are writing a short, accurate AWS What's New blurb for a weekly roundup.
Title: {title}
Category: {category}
Link: {link}

Write:
- 1 sentence (<= 25 words): what changed.
- 2 bullets: why it matters, who should care.

No speculation. Plain text."""
    body = json.dumps({
        "inputText": prompt,
        "textGenerationConfig": {
            "maxTokenCount": 220,
            "temperature": 0.2,
            "topP": 0.9
        }
    })
    resp = bedrock.invoke_model(
        modelId=TEXT_MODEL_ID,
        body=body,
        accept="application/json",
        contentType="application/json"
    )
    data = json.loads(resp["body"].read())
    return ((data.get("results") or [{}])[0].get("outputText","") or "").strip()

def parse_rss(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel") or root.find("{*}channel")
    if channel is None:
        return []

    items = []
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        cats = [c.text.strip() for c in item.findall("category") if c.text]
        guid = (item.findtext("guid") or link or title).strip()

        try:
            dt = email.utils.parsedate_to_datetime(pub)
        except Exception:
            dt = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

        update_id = hashlib.sha1(guid.encode("utf-8")).hexdigest()[:16]
        items.append({
            "updateId": update_id,
            "title": title,
            "link": link,
            "publishedAt": dt.astimezone(datetime.timezone.utc).isoformat(),
            "weekKey": iso_week_key(dt),
            "rawCategories": cats
        })
    return items

def lambda_handler(event, context):
    table = ddb.Table(UPDATES_TABLE)

    with urllib.request.urlopen(RSS_FEED_URL, timeout=15) as r:
        xml_bytes = r.read()

    items = parse_rss(xml_bytes)
    upserts = 0

    for it in items:
        week_key = it["weekKey"]
        update_id = it["updateId"]
        category = classify(it["title"], it.get("rawCategories", []))

        existing = table.get_item(Key={"weekKey": week_key, "updateId": update_id}).get("Item")
        summary = (existing or {}).get("summary", "")
        image_url = (existing or {}).get("imageUrl", "")

        if GENERATE_SUMMARY and not summary:
            try:
                summary = summarize_with_titan(it["title"], it["link"], category)
            except Exception as e:
                print(f"Summary generation failed: {e}")
                summary = ""

        table.put_item(Item={
            "weekKey": week_key,
            "updateId": update_id,
            "title": it["title"],
            "link": it["link"],
            "publishedAt": it["publishedAt"],
            "category": category,
            "tags": it.get("rawCategories", [])[:8],
            "summary": summary,
            "imageUrl": image_url or "",
            "source": "aws-whats-new-rss"
        })
        upserts += 1

    return {"statusCode": 200, "body": json.dumps({"count": upserts})}
