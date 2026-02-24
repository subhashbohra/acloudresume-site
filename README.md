# acloudresume-site

🚀 **AWS Weekly Updates Platform** - A serverless web application that automatically fetches, categorizes, and displays AWS What's New updates with AI-generated summaries.

## 🌟 Features

- **Automated RSS Ingestion**: Hourly fetch from AWS What's New RSS feed
- **AI-Powered Summaries**: Amazon Bedrock (Titan) generates concise summaries
- **Smart Categorization**: Auto-categorizes updates into Serverless, AI/GenAI, DevOps, etc.
- **Weekly Grouping**: Updates organized by ISO week for easy browsing
- **LinkedIn Post Generator**: One-click generation of weekly roundup posts
- **Responsive UI**: Modern, mobile-friendly interface with Tailwind CSS
- **Visitor Counter**: Track page visits with DynamoDB

## 🏗️ Architecture

### Frontend
- **Static Site**: HTML + Vanilla JavaScript + Tailwind CSS
- **Hosting**: AWS S3 + CloudFront
- **Data Source**: REST API (API Gateway + Lambda)

### Backend (AWS SAM)
- **API Gateway**: REST API endpoints
- **Lambda Functions**:
  - `FetchRssFunction`: Fetches RSS, generates summaries (runs hourly)
  - `GetUpdatesFunction`: Serves updates via API
  - `VisitorFunction`: Tracks page visits
- **DynamoDB Tables**:
  - `AwsUpdatesTable`: Stores updates (PK: weekKey, SK: updateId)
  - `VisitorTable`: Stores visitor counts
- **Amazon Bedrock**: AI text generation for summaries

## 📁 Project Structure

```
acloudresume-site/
├── backend/
│   ├── functions/
│   │   ├── fetch_rss/app.py      # RSS fetcher + AI summarizer
│   │   ├── get_updates/app.py    # API endpoint for updates
│   │   └── visitor/app.py        # Visitor counter
│   ├── template.yaml             # SAM infrastructure template
│   └── samconfig.toml            # SAM deployment config
├── site/
│   ├── assets/
│   │   └── aws-updates.js        # Main frontend logic
│   ├── data/
│   │   └── site-config.json      # API URLs configuration
│   ├── aws-updates.html          # Main updates page
│   └── index.html                # Homepage
└── README.md
```

## 🚀 Deployment

### Prerequisites
- AWS CLI configured
- AWS SAM CLI installed
- Python 3.13+
- S3 bucket for website hosting

### Backend Deployment

1. Navigate to backend directory:
```bash
cd backend
```

2. Build the SAM application:
```bash
sam build
```

3. Deploy to AWS:
```bash
sam deploy --guided
```

4. Note the API Gateway URL from outputs:
```
Outputs:
  ApiBaseUrl: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Frontend Deployment

1. Update `site/data/site-config.json` with your API URLs:
```json
{
  "awsUpdates": {
    "apiUrl": "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/updates",
    "weeksUrl": "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/weeks",
    "siteBaseUrl": "https://yourdomain.com"
  }
}
```

2. Deploy to S3:
```bash
aws s3 sync site/ s3://your-bucket-name/ --delete
```

3. Invalidate CloudFront cache (if using):
```bash
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

## 🔧 Configuration

### Backend Environment Variables (SAM template)
- `UPDATES_TABLE`: DynamoDB table for updates
- `RSS_FEED_URL`: AWS What's New RSS feed URL
- `SITE_BASE_URL`: Your website URL
- `TEXT_MODEL_ID`: Bedrock model ID (default: amazon.titan-text-express-v1)
- `GENERATE_SUMMARY`: Enable/disable AI summaries (true/false)

### Frontend Configuration (site-config.json)
- `apiUrl`: Backend API endpoint for updates
- `weeksUrl`: Backend API endpoint for available weeks
- `siteBaseUrl`: Your website base URL for sharing

## 📊 API Endpoints

### GET /updates
Fetch updates for a specific week or latest week.

**Query Parameters:**
- `week` (optional): ISO week key (e.g., "2025-W03")

**Response:**
```json
[
  {
    "updateId": "abc123",
    "title": "AWS Lambda now supports...",
    "link": "https://aws.amazon.com/...",
    "publishedAt": "2025-01-15T10:00:00Z",
    "weekKey": "2025-W03",
    "category": "Serverless",
    "tags": ["Lambda", "Compute"],
    "summary": "AI-generated summary...",
    "imageUrl": ""
  }
]
```

### GET /weeks
List all available weeks with updates.

**Response:**
```json
["2025-W03", "2025-W02", "2025-W01"]
```

## 🎨 Categories

- **Serverless**: Lambda, API Gateway, EventBridge, Step Functions
- **AI & GenAI**: Bedrock, SageMaker, Amazon Q
- **AI Agents**: Agent frameworks, tool use
- **DevOps & Observability**: CloudWatch, X-Ray, CodePipeline
- **Containers & Kubernetes**: EKS, ECS, Fargate
- **Security**: IAM, KMS, GuardDuty
- **Data & Analytics**: Athena, Glue, Redshift
- **Databases**: RDS, DynamoDB, Aurora
- **Storage**: S3, EFS
- **Networking**: VPC, CloudFront, Route 53
- **Other**: Everything else

## 🔄 How It Works

1. **Hourly Fetch**: EventBridge triggers `FetchRssFunction` every hour
2. **Parse RSS**: Lambda fetches AWS What's New RSS feed
3. **Categorize**: AI categorizes each update based on title/tags
4. **Summarize**: Bedrock generates concise summaries
5. **Store**: Updates saved to DynamoDB with weekKey partition
6. **Serve**: Frontend fetches via API and renders cards
7. **Share**: Users can generate LinkedIn posts and share individual updates

## 🛠️ Development

### Local Testing

1. Test Lambda functions locally:
```bash
sam local invoke FetchRssFunction
```

2. Start local API:
```bash
sam local start-api
```

3. Serve frontend locally:
```bash
cd site
python -m http.server 8000
```

### Manual Trigger RSS Fetch

Invoke the function manually:
```bash
aws lambda invoke --function-name acloudresume-updates-FetchRssFunction-XXXXX output.json
```

## 📝 Troubleshooting

### Cards Not Showing
1. Check browser console for JavaScript errors
2. Verify API URLs in `site-config.json`
3. Test API endpoints directly:
   ```bash
   curl https://YOUR-API.execute-api.us-east-1.amazonaws.com/prod/updates
   ```
4. Check Lambda logs in CloudWatch
5. Verify DynamoDB table has data

### CORS Issues
- Ensure API Gateway CORS is configured (already in template)
- Check `Access-Control-Allow-Origin` headers in Lambda responses

### No Summaries Generated
- Verify Bedrock model access in your AWS account
- Check Lambda IAM permissions for `bedrock:InvokeModel`
- Review CloudWatch logs for Bedrock errors

## 💰 Cost Estimate

**Monthly costs (assuming moderate traffic):**
- Lambda: ~$1-2 (hourly fetches + API calls)
- DynamoDB: ~$1-2 (on-demand pricing)
- API Gateway: ~$1 (first 1M requests free)
- Bedrock: ~$2-5 (Titan text generation)
- S3 + CloudFront: ~$1-2

**Total: ~$6-12/month**

## 🔐 Security Best Practices

- ✅ API Gateway with CORS restrictions
- ✅ Lambda functions with least-privilege IAM roles
- ✅ DynamoDB encryption at rest (default)
- ✅ CloudFront with HTTPS only
- ✅ No hardcoded credentials

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Contact

- Website: [acloudresume.com](https://acloudresume.com)
- LinkedIn: [Subhash Bohra](https://www.linkedin.com/in/subhashbohra)
- GitHub: [@subhashbohra](https://github.com/subhashbohra)

---

**Built with ❤️ using AWS Serverless**
