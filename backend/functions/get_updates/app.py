import os, json
import boto3
from boto3.dynamodb.conditions import Key

ddb = boto3.resource("dynamodb")
UPDATES_TABLE = os.environ["UPDATES_TABLE"]

def _resp(obj, status=200):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(obj, default=str)
    }

def lambda_handler(event, context):
    path = (event.get("path") or "")
    qs = event.get("queryStringParameters") or {}
    table = ddb.Table(UPDATES_TABLE)

    if path.endswith("/weeks"):
        # Return weeks present (latest first)
        scan = table.scan(ProjectionExpression="weekKey")
        weeks = sorted({i["weekKey"] for i in scan.get("Items",[])}, reverse=True)
        return _resp({"weeks": weeks})

    # /updates
    week = (qs.get("week") or "").strip()
    if not week:
        return _resp({"error":"Missing week query param (e.g., ?week=2026-W02)"}, 400)

    out=[]
    last=None
    while True:
        resp = table.query(
            KeyConditionExpression=Key("weekKey").eq(week),
            ExclusiveStartKey=last if last else None
        ) if last else table.query(KeyConditionExpression=Key("weekKey").eq(week))
        out.extend(resp.get("Items",[]))
        last = resp.get("LastEvaluatedKey")
        if not last: break

    # Sort by publishedAt desc
    out.sort(key=lambda x: x.get("publishedAt",""), reverse=True)

    # Frontend normalize() expects: updateId,title,link,publishedAt,weekKey,category,tags,summary,imageUrl
    items=[{
        "updateId": i.get("updateId",""),
        "title": i.get("title",""),
        "link": i.get("link",""),
        "publishedAt": i.get("publishedAt",""),
        "weekKey": i.get("weekKey",""),
        "category": i.get("category","Other"),
        "tags": i.get("tags",[]),
        "summary": i.get("summary",""),
        "imageUrl": i.get("imageUrl",""),
    } for i in out]

    return _resp(items)