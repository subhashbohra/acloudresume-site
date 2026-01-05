# aCloudResume Updates Backend (SAM)

This folder contains an AWS SAM app that:
- pulls the **What's New with AWS** RSS feed,
- categorizes items (Serverless / AI / Agents / DevOps etc.),
- generates **AI summaries** (Bedrock Titan Text Express),
- generates **AI images** (Bedrock Titan Image Generator),
- stores everything in DynamoDB,
- saves generated images into your **existing website S3 bucket** under `assets/generated/`,
- exposes an API (API Gateway) used by `aws-updates.html`,
- provides a visitor counter API.

## Deploy (once)

Prereqs:
- AWS CLI configured
- AWS SAM CLI installed

```bash
cd backend
sam build
sam deploy --guided
```

During guided deploy:
- **SiteBucketName**: `acloudresume`
- **SiteBaseUrl**: `https://acloudresume.com`
- Keep default RSS feed URL
- Keep default Bedrock model IDs (or change if your region needs different IDs)

After deploy, copy the **ApiBaseUrl** output and paste it into:
`/data/site-config.json` -> `apiBaseUrl`

Then commit + push.

## Notes

- You must enable model access in Amazon Bedrock console for:
  - `amazon.titan-text-express-v1`
  - `amazon.titan-image-generator-v1`