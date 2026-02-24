# OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "aCloudResume Registration"
   
5. Add Authorized redirect URIs:
   ```
   https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/auth/callback
   ```
   
6. Save and copy:
   - Client ID
   - Client Secret

## Step 2: Deploy Backend

1. Update `backend/samconfig.toml`:
```toml
parameter_overrides = "SiteBucketName=\"acloudresume\" SiteBaseUrl=\"https://acloudresume.com\" GoogleClientId=\"YOUR-CLIENT-ID\" GoogleClientSecret=\"YOUR-CLIENT-SECRET\""
```

2. Deploy:
```bash
cd backend
sam build
sam deploy
```

3. Note the `AuthCallbackUrl` from outputs

## Step 3: Update Frontend

1. Edit `site/js/register.js` line 115:
```javascript
const clientId = 'YOUR-GOOGLE-CLIENT-ID.apps.googleusercontent.com';
```

2. Update API_BASE if needed (line 4):
```javascript
const API_BASE = 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod';
```

3. Deploy:
```bash
cd site
aws s3 cp js/register.js s3://acloudresume/js/register.js
aws cloudfront create-invalidation --distribution-id EQHRX4VP95YAB --paths "/js/register.js"
```

## Step 4: Test OAuth Flow

1. Visit https://acloudresume.com/
2. Wait 3 seconds for popup
3. Click "Continue with Google"
4. Google consent screen appears
5. Select account and click "Allow"
6. Redirected back with success message
7. User data saved in DynamoDB

## What Gets Stored in DynamoDB

```json
{
  "userId": "google_1234567890",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "provider": "google",
  "registeredAt": 1708704000,
  "lastVisit": 1708704000,
  "visitCount": 1
}
```

## API Endpoints

### GET /auth/callback
- Handles OAuth callback from Google
- Exchanges code for token
- Gets user info
- Saves to DynamoDB
- Redirects to site with success

### GET /auth/stats
- Returns total registered users count
- Used to display "X developers registered"

## Security Notes

- Client Secret stored as SAM parameter (encrypted)
- HTTPS only
- State parameter prevents CSRF
- User data encrypted at rest in DynamoDB

## Cost Estimate

- Lambda: ~$0.10/month (minimal invocations)
- DynamoDB: ~$0.25/month (on-demand)
- API Gateway: Free tier

## Troubleshooting

### "redirect_uri_mismatch" error
- Check Google Console redirect URI matches exactly
- Must include `/prod/auth/callback`

### "invalid_client" error
- Check Client ID and Secret are correct
- Verify they're set in SAM parameters

### User not saved
- Check Lambda logs in CloudWatch
- Verify DynamoDB table exists
- Check IAM permissions

## Future Enhancements

- Add GitHub OAuth
- Add LinkedIn OAuth
- Email verification
- User dashboard
- Analytics tracking
