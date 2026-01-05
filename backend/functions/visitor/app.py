import os, json
import boto3
from boto3.dynamodb.conditions import Key

ddb = boto3.resource("dynamodb")
VISITOR_TABLE = os.environ["VISITOR_TABLE"]

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
    qs = event.get("queryStringParameters") or {}
    path = (qs.get("path") or "/").strip()[:200]
    table = ddb.Table(VISITOR_TABLE)

    # Atomic increment
    resp = table.update_item(
        Key={"path": path},
        UpdateExpression="ADD #c :inc",
        ExpressionAttributeNames={"#c":"count"},
        ExpressionAttributeValues={":inc": 1},
        ReturnValues="ALL_NEW"
    )
    count = int(resp["Attributes"].get("count",0))
    return _resp({"path": path, "count": count})