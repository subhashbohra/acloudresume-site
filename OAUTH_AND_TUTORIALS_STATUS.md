# OAuth & Tutorials - Current Status

## OAuth Implementation

### How It Works Now

When user clicks "Continue with Google/GitHub/LinkedIn":

1. **Frontend checks** if OAuth is configured (`enabled: true` in `OAUTH_CONFIG`)
2. **If NOT configured**: Shows alert with setup instructions
3. **If configured**: Redirects to provider's OAuth consent screen
4. **User approves**: Provider redirects to your callback URL with code
5. **Backend Lambda** exchanges code for access token
6. **Gets user info** from provider API
7. **Saves to DynamoDB**: email, name, picture, provider
8. **Redirects back** to website with success message

### Current Configuration Status

```javascript
OAUTH_CONFIG = {
  google: {
    enabled: false  // ❌ Not configured yet
  },
  github: {
    enabled: false  // ❌ Not configured yet
  },
  linkedin: {
    enabled: false  // ❌ Not configured yet
  }
}
```

### To Enable Each Provider

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://YOUR-API.execute-api.us-east-1.amazonaws.com/prod/auth/callback`
4. Copy Client ID and Secret
5. Update `register.js` line 10: `clientId: 'YOUR-ID'` and `enabled: true`
6. Deploy backend with credentials
7. Deploy frontend

#### GitHub OAuth
1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Create New OAuth App
3. Authorization callback URL: `https://YOUR-API.execute-api.us-east-1.amazonaws.com/prod/auth/callback`
4. Copy Client ID and Secret
5. Update `register.js` line 15: `clientId: 'YOUR-ID'` and `enabled: true`
6. Update backend Lambda to handle GitHub token exchange
7. Deploy

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create App
3. Add redirect URL: `https://YOUR-API.execute-api.us-east-1.amazonaws.com/prod/auth/callback`
4. Request access to "Sign In with LinkedIn" product
5. Copy Client ID and Secret
6. Update `register.js` line 20: `clientId: 'YOUR-ID'` and `enabled: true`
7. Update backend Lambda to handle LinkedIn token exchange
8. Deploy

### Backend Lambda Updates Needed

The current `backend/functions/auth/app.py` only handles Google. You need to add:

```python
def handle_github_oauth(code):
    # Exchange code for token with GitHub
    # Get user info from GitHub API
    # Return user data

def handle_linkedin_oauth(code):
    # Exchange code for token with LinkedIn
    # Get user info from LinkedIn API
    # Return user data

def handle_oauth_callback(event):
    provider = event['queryStringParameters'].get('state')
    
    if provider == 'google':
        return handle_google_oauth(code)
    elif provider == 'github':
        return handle_github_oauth(code)
    elif provider == 'linkedin':
        return handle_linkedin_oauth(code)
```

## Tutorials Status

### ✅ Complete Tutorials (2)
1. **Build REST API with Lambda + API Gateway**
   - Full content with architecture diagram
   - 4 detailed steps
   - Code examples with comments
   
2. **Build a Chatbot with Bedrock**
   - Full content with architecture diagram
   - 4 detailed steps
   - DynamoDB integration

### ⏳ Coming Soon (19 tutorials)
All other tutorials show "Tutorial Coming Soon" message.

### Quick Fix Options

**Option 1: Hide incomplete tutorials**
- Only show 2 complete tutorials
- Add more content gradually

**Option 2: Add basic content for all**
- Create simple 2-3 step tutorials
- Less detailed but functional

**Option 3: AI-generate content**
- Use Bedrock to generate tutorial content
- Review and publish

## Recommended Next Steps

### Priority 1: Fix Tutorials (Choose one)
- [ ] Add content for top 5 most important tutorials
- [ ] OR hide incomplete tutorials from list
- [ ] OR add "Coming Soon" badge to cards

### Priority 2: OAuth Setup (If needed)
- [ ] Decide which providers to enable
- [ ] Create OAuth apps in provider consoles
- [ ] Update backend Lambda for all providers
- [ ] Test OAuth flow end-to-end
- [ ] Deploy

### Priority 3: Analytics
- [ ] Track which tutorials are most viewed
- [ ] Track registration conversions
- [ ] Monitor user engagement

## Quick Deploy Commands

### Deploy Frontend Only
```bash
cd site
aws s3 cp js/register.js s3://acloudresume/js/register.js
aws cloudfront create-invalidation --distribution-id EQHRX4VP95YAB --paths "/js/register.js"
```

### Deploy Backend (after OAuth setup)
```bash
cd backend
sam build
sam deploy --parameter-overrides \
  GoogleClientId="YOUR-ID" \
  GoogleClientSecret="YOUR-SECRET" \
  GitHubClientId="YOUR-ID" \
  GitHubClientSecret="YOUR-SECRET" \
  LinkedInClientId="YOUR-ID" \
  LinkedInClientSecret="YOUR-SECRET"
```

## What Users See Now

### Registration Flow
1. Visit website
2. Popup appears after 3 seconds
3. Click "Continue with Google/GitHub/LinkedIn"
4. See alert: "OAuth is not configured yet" with instructions
5. Can click "Maybe later" to dismiss

### Tutorials
1. See 21 tutorial cards
2. Click "Start" on any tutorial
3. If tutorial ID is `lambda-api-gateway` or `bedrock-chatbot`: See full content
4. If any other tutorial: See "Tutorial Coming Soon"

## Cost Implications

### With OAuth Enabled
- Lambda invocations: ~$0.10/month
- DynamoDB storage: ~$0.25/month (1000 users)
- API Gateway: Free tier covers it

### Without OAuth
- No additional costs
- Can still show registration popup
- Just shows "not configured" message

## Decision Time

**Do you want to:**

A. **Enable OAuth now** (requires setup in Google/GitHub/LinkedIn consoles)
B. **Skip OAuth for now** (keep showing "not configured" message)
C. **Remove registration popup** (focus on tutorials only)

**For tutorials:**

A. **Add content for top 5 tutorials** (I can do this now)
B. **Hide incomplete tutorials** (show only 2 complete ones)
C. **Keep as-is** (add content gradually yourself)

Let me know your preference and I'll implement it!
