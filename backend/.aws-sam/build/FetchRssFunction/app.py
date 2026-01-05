import os, json, hashlib, base64, urllib.request, email.utils, datetime
import boto3
from xml.etree import ElementTree as ET

ddb = boto3.resource("dynamodb")
s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime")

UPDATES_TABLE = os.environ["UPDATES_TABLE"]
RSS_FEED_URL = os.environ["RSS_FEED_URL"]
SITE_BUCKET = os.environ["SITE_BUCKET"]
SITE_BASE_URL = os.environ.get("SITE_BASE_URL","https://acloudresume.com").rstrip("/")
TEXT_MODEL_ID = os.environ.get("TEXT_MODEL_ID","amazon.titan-text-express-v1")
IMAGE_MODEL_ID = os.environ.get("IMAGE_MODEL_ID","amazon.titan-image-generator-v1")
GENERATED_PREFIX = os.environ.get("GENERATED_PREFIX","assets/generated/")

def iso_week_key(dt: datetime.datetime) -> str:
    # ISO week key: YYYY-Www
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
    if any(k in hay for k in ["cloudwatch","x-ray","opentelemetry","observability","grafana","prometheus","new relic","datadog","devops","codepipeline","codebuild","codeartifact","codecommit","codedeploy"]):
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
    if any(k in hay for k in ["vpc","route 53","cloudfront","elb","alb","nlb","network","gateway load balancer","direct connect"]):
        return "Networking"
    return "Other"

def summarize_with_titan(title: str, link: str, category: str) -> str:
    prompt = f"""You are writing a *short, accurate* AWS What's New blurb for a weekly roundup page.
Title: {title}
Category: {category}
Link: {link}

Write:
- 1 crisp sentence (<= 25 words) explaining what changed.
- 2 bullets: why it matters (benefit) and who should care (persona).

No speculation. No marketing fluff. Output plain text."""

    body = json.dumps({
        "inputText": prompt,
        "textGenerationConfig": {
            "maxTokenCount": 220,
            "temperature": 0.2,
            "topP": 0.9,
            "stopSequences": []
        }
    })
    resp = bedrock.invoke_model(
        modelId=TEXT_MODEL_ID,
        body=body,
        accept="application/json",
        contentType="application/json"
    )
    data = json.loads(resp["body"].read())
    out = (data.get("results") or [{}])[0].get("outputText","").strip()
    return out

def generate_image_bytes(title: str, category: str) -> bytes:
    # A consistent "AWS-ish" image prompt without using AWS trademarks/logos.
    prompt = f"""A clean modern tech illustration representing an AWS update in the category '{category}'.
Subject inspired by: {title}.
Style: flat vector, subtle gradients, dark blue background with orange accents, minimal, no text, no logos."""

    body = json.dumps({
        "taskType": "TEXT_IMAGE",
        "textToImageParams": {"text": prompt},
        "imageGenerationConfig": {
            "quality": "standard",
            "numberOfImages": 1,
            "height": 512,
            "width": 1024,
            "cfgScale": 7.0,
            "seed": 0
        }
    })
    resp = bedrock.invoke_model(
        modelId=IMAGE_MODEL_ID,
        body=body,
        accept="application/json",
        contentType="application/json"
    )
    data = json.loads(resp["body"].read())
    images = data.get("images") or []
    if not images:
        raise RuntimeError("No image returned from Bedrock.")
    return base64.b64decode(images[0])

def parse_rss(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    # RSS 2.0 -> channel -> item
    channel = root.find("channel")
    if channel is None:
        # Some feeds are namespaced; try fallback
        channel = root.find("{*}channel")
    if channel is None:
        return []
    items = []
    for item in channel.findall("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        cats = [c.text.strip() for c in item.findall("category") if c.text]
        guid = (item.findtext("guid") or link or title).strip()
        # Parse pubDate
        dt = None
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

    # Fetch RSS
    with urllib.request.urlopen(RSS_FEED_URL, timeout=15) as r:
        xml_bytes = r.read()

    items = parse_rss(xml_bytes)
    upserts = 0
    for it in items:
        category = classify(it["title"], it.get("rawCategories",[]))
        week_key = it["weekKey"]
        update_id = it["updateId"]

        # Check if exists
        existing = table.get_item(Key={"weekKey": week_key, "updateId": update_id}).get("Item")

        summary = existing.get("summary") if existing else None
        image_url = existing.get("imageUrl") if existing else None

        if not summary:
            try:
                summary = summarize_with_titan(it["title"], it["link"], category)
            except Exception as e:
                summary = ""  # fail open

        if not image_url:
            try:
                img_bytes = generate_image_bytes(it["title"], category)
                key = f"{GENERATED_PREFIX}{week_key}/{update_id}.png"
                s3.put_object(
                    Bucket=SITE_BUCKET,
                    Key=key,
                    Body=img_bytes,
                    ContentType="image/png",
                    CacheControl="public, max-age=31536000, immutable"
                )
                image_url = f"{SITE_BASE_URL}/{key}"
            except Exception:
                image_url = ""

        # Store item
        table.put_item(Item={
            "weekKey": week_key,
            "updateId": update_id,
            "title": it["title"],
            "link": it["link"],
            "publishedAt": it["publishedAt"],
            "category": category,
            "tags": it.get("rawCategories",[])[:8],
            "summary": summary,
            "imageUrl": image_url,
        })
        upserts += 1

    return {"statusCode": 200, "body": json.dumps({"count": upserts})}