# OAuth Registration Setup Guide

## Overview
This guide will help you set up OAuth authentication with Google, GitHub, and LinkedIn for user registration on acloudresume.com.

## Step 1: Create OAuth Applications

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Application type: "Web application"
7. Authorized redirect URIs:
   - `https://acloudresume.com/auth/callback`
   - `https://www.acloudresume.com/auth/callback`
8. Save Client ID and Client Secret

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: aCloudResume
   - Homepage URL: `https://acloudresume.com`
   - Authorization callback URL: `https://acloudresume.com/auth/callback`
4. Save Client ID and Client Secret

### LinkedIn OAuth Setup
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in required details
4. In "Auth" tab, add redirect URLs:
   - `https://acloudresume.com/auth/callback`
5. Request "Sign In with LinkedIn" product
6. Save Client ID and Client Secret

## Step 2: Deploy OAuth Lambda

```bash
cd backend

# Deploy OAuth stack
sam build -t auth-template.yaml

sam deploy \
  --template-file auth-template.yaml \
  --stack-name acloudresume-auth \
  --parameter-overrides \
    GoogleClientId="YOUR_GOOGLE_CLIENT_ID" \
    GoogleClientSecret="YOUR_GOOGLE_CLIENT_SECRET" \
    GitHubClientId="YOUR_GITHUB_CLIENT_ID" \
    GitHubClientSecret="YOUR_GITHUB_CLIENT_SECRET" \
    LinkedInClientId="YOUR_LINKEDIN_CLIENT_ID" \
    LinkedInClientSecret="YOUR_LINKEDIN_CLIENT_SECRET" \
    SiteBaseUrl="https://acloudresume.com" \
  --capabilities CAPABILITY_IAM \
  --guided
```

## Step 3: Get API URL

```bash
# Get the OAuth API URL
aws cloudformation describe-stacks \
  --stack-name acloudresume-auth \
  --query 'Stacks[0].Outputs[?OutputKey==`AuthApiUrl`].OutputValue' \
  --output text
```

## Step 4: Update Frontend Configuration

Update `site/data/site-config.json`:

```json
{
  "auth": {
    "apiUrl": "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com",
    "google": {
      "clientId": "YOUR_GOOGLE_CLIENT_ID",
      "enabled": true
    },
    "github": {
      "clientId": "YOUR_GITHUB_CLIENT_ID",
      "enabled": true
    },
    "linkedin": {
      "clientId": "YOUR_LINKEDIN_CLIENT_ID",
      "enabled": true
    }
  }
}
```

## Step 5: Update register.js

The register.js file needs the OAuth API URL. Update line with:

```javascript
const AUTH_API = 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com';
```

## Step 6: Deploy Frontend

```bash
cd site
aws s3 cp data/site-config.json s3://acloudresume/data/site-config.json
aws s3 cp js/register.js s3://acloudresume/js/register.js
aws cloudfront create-invalidation --distribution-id EQHRX4VP95YAB --paths "/data/*" "/js/*"
```

## Testing

1. Visit https://acloudresume.com
2. Click "Register" button in footer
3. Try signing in with Google/GitHub/LinkedIn
4. Verify redirect back to homepage with success message
5. Check DynamoDB table for user record

## Troubleshooting

### "Redirect URI mismatch" error
- Verify redirect URIs in OAuth app settings match exactly
- Include both www and non-www versions

### "Client ID not found" error
- Check environment variables in Lambda function
- Verify SAM deployment completed successfully

### Users not saving
- Check Lambda CloudWatch logs
- Verify DynamoDB table permissions
- Check IAM role has DynamoDBCrudPolicy

## Monitoring

View registered users count:
```bash
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/auth/count
```

View Lambda logs:
```bash
sam logs --stack-name acloudresume-auth --tail
```

## Security Notes

- Client secrets are stored as NoEcho parameters (encrypted)
- HTTPS only for all OAuth flows
- User data stored in DynamoDB with encryption at rest
- No sensitive data exposed to frontend
