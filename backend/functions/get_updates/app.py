import os, json
import boto3
from boto3.dynamodb.conditions import Key

ddb = boto3.resource("dynamodb")
UPDATES_TABLE = os.environ["UPDATES_TABLE"]
ALLOW_ORIGIN = os.environ.get("ALLOW_ORIGIN", "https://acloudresume.com")

def _resp(obj, status=200):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOW_ORIGIN,
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(obj, default=str)
    }

def _get_method(event):
    return (event.get("requestContext", {}).get("http", {}).get("method")
            or event.get("httpMethod", "GET"))

def _get_path(event):
    return (event.get("rawPath") or event.get("path") or "")

def _get_qs(event):
    return event.get("queryStringParameters") or {}

def list_weeks(table):
    scan = table.scan(ProjectionExpression="weekKey")
    weeks = sorted({i["weekKey"] for i in scan.get("Items", []) if "weekKey" in i}, reverse=True)
    return weeks

def query_week(table, week):
    out = []
    last = None
    while True:
        kwargs = {"KeyConditionExpression": Key("weekKey").eq(week)}
        if last:
            kwargs["ExclusiveStartKey"] = last
        resp = table.query(**kwargs)
        out.extend(resp.get("Items", []))
        last = resp.get("LastEvaluatedKey")
        if not last:
            break

    out.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
    return [{
        "updateId": i.get("updateId", ""),
        "title": i.get("title", ""),
        "link": i.get("link", ""),
        "publishedAt": i.get("publishedAt", ""),
        "weekKey": i.get("weekKey", week),
        "category": i.get("category", "Other"),
        "tags": i.get("tags", []),
        "summary": i.get("summary", ""),
        "imageUrl": i.get("imageUrl", ""),
    } for i in out]

def lambda_handler(event, context):
    method = _get_method(event)
    if method == "OPTIONS":
        return _resp({}, 200)

    path = _get_path(event)
    qs = _get_qs(event)
    table = ddb.Table(UPDATES_TABLE)

    # /weeks endpoint
    if path.endswith("/weeks"):
        return _resp(list_weeks(table))

    # /updates endpoint
    week = (qs.get("week") or "").strip()
    if not week:
        weeks = list_weeks(table)
        if not weeks:
            return _resp([])
        week = weeks[0]  # ✅ latest available

    items = query_week(table, week)
    return _resp(items)
