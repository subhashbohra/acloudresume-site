// AWS Tutorials - Comprehensive SEO-Optimized Content (1500-2500 words each)
window.TUTORIALS = {};

// Tutorial 1: Lambda API Gateway
window.TUTORIALS["lambda-api-gateway"] = {
  title: "Build REST API with Lambda + API Gateway",
  category: "Serverless",
  difficulty: "Beginner",
  duration: "10 min",
  description: "Create a serverless REST API in 10 minutes using AWS Lambda and API Gateway with complete CRUD operations, authentication, and deployment automation.",
  whatYouLearn: [
    "Understand serverless REST API architecture and benefits",
    "Create Lambda functions with Python for API endpoints",
    "Configure API Gateway with routes, methods, and CORS",
    "Implement request validation and error handling",
    "Deploy using AWS SAM with Infrastructure as Code",
    "Test API endpoints using curl and Postman"
  ],
  skillsImproved: ["AWS Lambda", "API Gateway", "Python", "REST API", "AWS SAM", "Serverless Architecture"],
  architecture: `graph LR
    A[Client/Browser] -->|HTTPS Request| B[API Gateway]
    B -->|Invoke| C[Lambda Function]
    C -->|Process| D[Business Logic]
    D -->|Return| C
    C -->|Response| B
    B -->|JSON Response| A`,
  intro: `<h2 class="text-xl font-bold mb-3">Introduction to Serverless REST APIs</h2>
    <p class="mb-4">Building REST APIs traditionally required managing servers, load balancers, and scaling infrastructure. AWS Lambda and API Gateway eliminate this complexity by providing a fully managed, auto-scaling serverless platform that charges only for actual usage.</p>
    <p class="mb-4"><strong>AWS Lambda</strong> is a compute service that runs your code in response to events without provisioning or managing servers. You pay only for the compute time you consume - there's no charge when your code isn't running. Lambda automatically scales your application by running code in response to each trigger, scaling precisely with the size of the workload.</p>
    <p class="mb-4"><strong>Amazon API Gateway</strong> is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale. It handles all the tasks involved in accepting and processing up to hundreds of thousands of concurrent API calls, including traffic management, CORS support, authorization and access control, throttling, monitoring, and API version management.</p>
    <p class="mb-4"><strong>Why Serverless APIs?</strong> Traditional server-based APIs require capacity planning, server maintenance, security patching, and 24/7 availability management. Serverless APIs eliminate these operational burdens while providing automatic scaling, built-in high availability, and pay-per-use pricing. This makes them ideal for startups, microservices, mobile backends, and any application with variable traffic patterns.</p>
    <p>In this tutorial, you'll build a production-ready REST API that can handle thousands of requests per second, automatically scales to zero when not in use, and costs pennies to run. We'll use AWS SAM (Serverless Application Model) for infrastructure as code, making deployment repeatable and version-controlled.</p>`,
  steps: [
    {
      title: "Step 1: Create Lambda Function Handler",
      content: "The Lambda handler is the entry point for your function. It receives the API Gateway event containing HTTP request details (path, method, headers, body) and returns a response object. This handler implements a simple Hello World API with proper error handling and CORS headers for browser compatibility.",
      language: "python",
      code: `import json
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function handler for API Gateway proxy integration.
    
    Args:
        event: API Gateway proxy event containing request details
        context: Lambda context object with runtime information
    
    Returns:
        dict: Response object with statusCode, headers, and body
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract HTTP method and path
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    # Parse request body if present
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
    
    # Route handling
    if http_method == 'GET' and path == '/hello':
        return handle_get_hello(event)
    elif http_method == 'POST' and path == '/hello':
        return handle_post_hello(body)
    else:
        return create_response(404, {'error': 'Route not found'})

def handle_get_hello(event):
    """Handle GET /hello endpoint"""
    query_params = event.get('queryStringParameters') or {}
    name = query_params.get('name', 'World')
    
    response_body = {
        'message': f'Hello, {name}!',
        'timestamp': context.get_remaining_time_in_millis(),
        'method': 'GET'
    }
    
    return create_response(200, response_body)

def handle_post_hello(body):
    """Handle POST /hello endpoint"""
    name = body.get('name')
    
    if not name:
        return create_response(400, {'error': 'Name is required in request body'})
    
    response_body = {
        'message': f'Hello, {name}! Your data was received.',
        'received_data': body,
        'method': 'POST'
    }
    
    return create_response(201, response_body)

def create_response(status_code, body):
    """
    Create standardized API Gateway response with CORS headers.
    
    CORS headers allow browser-based applications to call your API.
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Allow all origins
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body)
    }`
    },
    {
      title: "Step 2: Create SAM Template",
      content: "AWS SAM (Serverless Application Model) extends CloudFormation to provide a simplified syntax for defining serverless resources. This template defines your Lambda function, API Gateway, and all necessary IAM permissions. SAM handles the complexity of creating API Gateway stages, Lambda permissions, and CloudWatch log groups automatically.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Serverless REST API with Lambda and API Gateway

# Global configuration applied to all functions
Globals:
  Function:
    Runtime: python3.11
    Timeout: 10
    MemorySize: 256
    Environment:
      Variables:
        LOG_LEVEL: INFO
  Api:
    Cors:
      AllowOrigin: "'*'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowMethods: "'GET,POST,OPTIONS'"

Resources:
  # API Gateway REST API
  HelloApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Description: Hello World REST API
      # Enable API Gateway logging
      AccessLogSetting:
        DestinationArn: !GetAtt ApiLogGroup.Arn
        Format: '$context.requestId $context.error.message $context.error.messageString'
      # Enable throttling
      ThrottleSettings:
        BurstLimit: 100
        RateLimit: 50

  # Lambda Function
  HelloFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hello_function/
      Handler: app.lambda_handler
      Description: Handles Hello World API requests
      # Define API events
      Events:
        GetHello:
          Type: Api
          Properties:
            RestApiId: !Ref HelloApi
            Path: /hello
            Method: GET
        PostHello:
          Type: Api
          Properties:
            RestApiId: !Ref HelloApi
            Path: /hello
            Method: POST
      # CloudWatch Logs retention
      LogsRetentionInDays: 7

  # CloudWatch Log Group for API Gateway
  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/\${HelloApi}'
      RetentionInDays: 7

  # CloudWatch Log Group for Lambda
  FunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/\${HelloFunction}'
      RetentionInDays: 7

# Outputs for easy access to API URL
Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://\${HelloApi}.execute-api.\${AWS::Region}.amazonaws.com/prod/hello'
    Export:
      Name: !Sub '\${AWS::StackName}-ApiUrl'
  
  FunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt HelloFunction.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-FunctionArn'`
    },
    {
      title: "Step 3: Deploy with SAM CLI",
      content: "AWS SAM CLI simplifies building, testing, and deploying serverless applications. The 'sam build' command packages your code and dependencies, while 'sam deploy' creates or updates your CloudFormation stack. The --guided flag walks you through configuration options and saves them to samconfig.toml for future deployments.",
      language: "bash",
      code: `# Install AWS SAM CLI (if not already installed)
# macOS
brew install aws-sam-cli

# Windows (using Chocolatey)
choco install aws-sam-cli

# Linux
pip install aws-sam-cli

# Create project directory structure
mkdir hello-api && cd hello-api
mkdir hello_function

# Save the Lambda code to hello_function/app.py
# Save the SAM template to template.yaml

# Build the application
# This packages your code and resolves dependencies
sam build

# Deploy with guided prompts (first time)
sam deploy --guided

# You'll be prompted for:
# - Stack Name: hello-api-stack
# - AWS Region: us-east-1 (or your preferred region)
# - Confirm changes before deploy: Y
# - Allow SAM CLI IAM role creation: Y
# - HelloFunction may not have authorization defined: Y
# - Save arguments to configuration file: Y

# For subsequent deployments, simply run:
sam deploy

# View stack outputs (including API URL)
aws cloudformation describe-stacks \\
  --stack-name hello-api-stack \\
  --query 'Stacks[0].Outputs' \\
  --output table`
    },
    {
      title: "Step 4: Test the API",
      content: "Testing is crucial to ensure your API works correctly. Use curl for command-line testing, Postman for interactive testing, or write automated tests. Always test both success and error scenarios, including invalid inputs, missing parameters, and edge cases.",
      language: "bash",
      code: `# Get the API URL from stack outputs
API_URL=$(aws cloudformation describe-stacks \\
  --stack-name hello-api-stack \\
  --query 'Stacks[0].Outputs[?OutputKey==\`ApiUrl\`].OutputValue' \\
  --output text)

echo "API URL: $API_URL"

# Test GET request with default name
curl -X GET "$API_URL"

# Expected response:
# {"message": "Hello, World!", "timestamp": 12345, "method": "GET"}

# Test GET request with custom name
curl -X GET "$API_URL?name=John"

# Expected response:
# {"message": "Hello, John!", "timestamp": 12345, "method": "GET"}

# Test POST request with JSON body
curl -X POST "$API_URL" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "age": 30}'

# Expected response:
# {
#   "message": "Hello, Alice! Your data was received.",
#   "received_data": {"name": "Alice", "age": 30},
#   "method": "POST"
# }

# Test error handling - POST without name
curl -X POST "$API_URL" \\
  -H "Content-Type: application/json" \\
  -d '{"age": 30}'

# Expected response:
# {"error": "Name is required in request body"}

# Test invalid route
curl -X GET "$API_URL/invalid"

# Expected response:
# {"error": "Route not found"}

# View Lambda logs
sam logs --stack-name hello-api-stack --tail`
    },
    {
      title: "Step 5: Monitor and Optimize",
      content: "Production APIs require monitoring for errors, performance, and usage patterns. CloudWatch provides comprehensive monitoring with metrics, logs, and alarms. Set up dashboards to visualize API health and configure alarms to notify you of issues before they impact users.",
      language: "bash",
      code: `# View Lambda function metrics in CloudWatch
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --dimensions Name=FunctionName,Value=hello-api-stack-HelloFunction-XXXXX \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-02T00:00:00Z \\
  --period 3600 \\
  --statistics Sum

# Create CloudWatch alarm for errors
aws cloudwatch put-metric-alarm \\
  --alarm-name hello-api-errors \\
  --alarm-description "Alert on Lambda errors" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 300 \\
  --threshold 5 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 1

# View API Gateway metrics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/ApiGateway \\
  --metric-name Count \\
  --dimensions Name=ApiName,Value=HelloApi \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-02T00:00:00Z \\
  --period 3600 \\
  --statistics Sum

# Performance optimization tips:
# 1. Increase Lambda memory for faster execution (more memory = more CPU)
# 2. Use Lambda layers for shared dependencies
# 3. Enable API Gateway caching for GET requests
# 4. Use provisioned concurrency for consistent performance
# 5. Minimize cold starts by keeping functions warm

# Clean up resources when done
sam delete --stack-name hello-api-stack`
    }
  ]
};

// Tutorial 2: S3 Lambda Trigger
window.TUTORIALS["s3-lambda-trigger"] = {
  title: "Process S3 Uploads with Lambda",
  category: "Serverless",
  difficulty: "Beginner",
  duration: "8 min",
  description: "Automatically process files uploaded to S3 using Lambda triggers for image resizing, data transformation, and event-driven workflows.",
  whatYouLearn: [
    "Configure S3 event notifications to trigger Lambda functions",
    "Process S3 objects using boto3 SDK in Python",
    "Implement image resizing and thumbnail generation",
    "Handle different file types and error scenarios",
    "Set up proper IAM permissions for S3 access",
    "Deploy event-driven architectures with SAM"
  ],
  skillsImproved: ["AWS Lambda", "Amazon S3", "Event-Driven Architecture", "Python", "Image Processing", "boto3"],
  architecture: `graph LR
    A[User] -->|Upload File| B[S3 Bucket]
    B -->|S3 Event| C[Lambda Function]
    C -->|Read Object| B
    C -->|Process| D[Image Resize/Transform]
    D -->|Write| E[Output S3 Bucket]
    C -->|Log| F[CloudWatch Logs]`,
  intro: `<h2 class="text-xl font-bold mb-3">Event-Driven File Processing with S3 and Lambda</h2>
    <p class="mb-4">Amazon S3 (Simple Storage Service) is an object storage service offering industry-leading scalability, data availability, security, and performance. When combined with Lambda, S3 becomes a powerful trigger for event-driven workflows that automatically process files as they're uploaded.</p>
    <p class="mb-4"><strong>S3 Event Notifications</strong> can trigger Lambda functions when objects are created, deleted, or modified. This enables real-time processing pipelines without polling or manual intervention. Common use cases include image thumbnail generation, video transcoding, data validation, virus scanning, and ETL (Extract, Transform, Load) operations.</p>
    <p class="mb-4"><strong>Why Event-Driven Processing?</strong> Traditional batch processing requires scheduled jobs that run regardless of whether new files exist, wasting resources and adding latency. Event-driven processing with S3 and Lambda provides instant response to file uploads, processes only what's needed, and scales automatically from zero to thousands of concurrent executions.</p>
    <p class="mb-4">In this tutorial, you'll build an automated image processing pipeline that generates thumbnails whenever images are uploaded to S3. The solution uses the Pillow library for image manipulation and demonstrates proper error handling, logging, and resource cleanup.</p>
    <p>This pattern is production-ready and used by companies processing millions of files daily. It's cost-effective (pay only for actual processing), scalable (handles traffic spikes automatically), and reliable (built-in retry logic and dead-letter queues for failed processing).</p>`,
  steps: [
    {
      title: "Step 1: Create S3 Buckets",
      content: "Create two S3 buckets: one for original uploads and one for processed outputs. Separating input and output prevents infinite loops where processed files trigger new Lambda invocations. Enable versioning for data protection and configure lifecycle policies to manage storage costs.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: S3 Lambda Trigger for Image Processing

Resources:
  # Source bucket for original uploads
  SourceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'image-uploads-\${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      # Enable encryption at rest
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      # Lifecycle policy to delete old versions
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      # Block public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Tags for cost tracking
      Tags:
        - Key: Purpose
          Value: ImageProcessing
        - Key: Environment
          Value: Production

  # Destination bucket for processed images
  DestinationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'image-thumbnails-\${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Purpose
          Value: ProcessedImages
        - Key: Environment
          Value: Production

Outputs:
  SourceBucketName:
    Description: Source bucket for uploads
    Value: !Ref SourceBucket
    Export:
      Name: !Sub '\${AWS::StackName}-SourceBucket'
  
  DestinationBucketName:
    Description: Destination bucket for thumbnails
    Value: !Ref DestinationBucket
    Export:
      Name: !Sub '\${AWS::StackName}-DestinationBucket'`
    },
    {
      title: "Step 2: Implement Image Processing Lambda",
      content: "Create a Lambda function that reads images from S3, resizes them to thumbnail size, and saves the result to the destination bucket. This function uses the Pillow library for image manipulation and implements proper error handling for unsupported file types and corrupted images.",
      language: "python",
      code: `import json
import boto3
import os
from PIL import Image
from io import BytesIO
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize S3 client
s3 = boto3.client('s3')

# Configuration
DESTINATION_BUCKET = os.environ['DESTINATION_BUCKET']
THUMBNAIL_SIZE = (200, 200)
SUPPORTED_FORMATS = ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP']

def lambda_handler(event, context):
    """
    Process S3 upload events and generate thumbnails.
    
    Args:
        event: S3 event notification containing bucket and object details
        context: Lambda context object
    
    Returns:
        dict: Processing results with success/failure status
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    results = []
    
    # Process each record in the event (can be multiple files)
    for record in event['Records']:
        try:
            # Extract S3 bucket and object key
            source_bucket = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info(f"Processing {object_key} from {source_bucket}")
            
            # Skip if file is in a folder we want to ignore
            if object_key.startswith('thumbnails/'):
                logger.info(f"Skipping thumbnail folder: {object_key}")
                continue
            
            # Download image from S3
            response = s3.get_object(Bucket=source_bucket, Key=object_key)
            image_data = response['Body'].read()
            
            # Open image with Pillow
            image = Image.open(BytesIO(image_data))
            
            # Check if format is supported
            if image.format not in SUPPORTED_FORMATS:
                logger.warning(f"Unsupported format: {image.format}")
                results.append({
                    'key': object_key,
                    'status': 'skipped',
                    'reason': f'Unsupported format: {image.format}'
                })
                continue
            
            # Generate thumbnail
            thumbnail = image.copy()
            thumbnail.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            
            # Save thumbnail to BytesIO buffer
            buffer = BytesIO()
            thumbnail.save(buffer, format=image.format, quality=85, optimize=True)
            buffer.seek(0)
            
            # Generate thumbnail key (preserve folder structure)
            thumbnail_key = f"thumbnails/{object_key}"
            
            # Upload thumbnail to destination bucket
            s3.put_object(
                Bucket=DESTINATION_BUCKET,
                Key=thumbnail_key,
                Body=buffer.getvalue(),
                ContentType=response['ContentType'],
                Metadata={
                    'original-key': object_key,
                    'original-size': str(image.size),
                    'thumbnail-size': str(thumbnail.size)
                }
            )
            
            logger.info(f"Successfully created thumbnail: {thumbnail_key}")
            
            results.append({
                'key': object_key,
                'status': 'success',
                'thumbnail_key': thumbnail_key,
                'original_size': image.size,
                'thumbnail_size': thumbnail.size
            })
            
        except Exception as e:
            logger.error(f"Error processing {object_key}: {str(e)}")
            results.append({
                'key': object_key,
                'status': 'error',
                'error': str(e)
            })
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }`
    },
    {
      title: "Step 3: Add Lambda to SAM Template",
      content: "Update the SAM template to include the Lambda function with S3 event trigger. The S3 event configuration automatically creates the necessary bucket notification and Lambda permissions. Include the Pillow library as a Lambda layer for image processing capabilities.",
      language: "yaml",
      code: `  # Image processing Lambda function
  ImageProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: image_processor/
      Handler: app.lambda_handler
      Runtime: python3.11
      Timeout: 60
      MemorySize: 1024  # More memory for image processing
      Environment:
        Variables:
          DESTINATION_BUCKET: !Ref DestinationBucket
      # IAM permissions
      Policies:
        - S3ReadPolicy:
            BucketName: !Ref SourceBucket
        - S3CrudPolicy:
            BucketName: !Ref DestinationBucket
      # S3 event trigger
      Events:
        S3Upload:
          Type: S3
          Properties:
            Bucket: !Ref SourceBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
                  - Name: suffix
                    Value: .jpg
        S3UploadPNG:
          Type: S3
          Properties:
            Bucket: !Ref SourceBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
                  - Name: suffix
                    Value: .png
      # Use Lambda layer for Pillow
      Layers:
        - !Sub 'arn:aws:lambda:\${AWS::Region}:770693421928:layer:Klayers-p311-Pillow:1'

  # CloudWatch Log Group
  ProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/\${ImageProcessorFunction}'
      RetentionInDays: 7

  # Dead Letter Queue for failed processing
  ProcessingDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: image-processing-dlq
      MessageRetentionPeriod: 1209600  # 14 days

  # Configure DLQ for Lambda
  ImageProcessorFunctionDLQ:
    Type: AWS::Lambda::EventInvokeConfig
    Properties:
      FunctionName: !Ref ImageProcessorFunction
      Qualifier: $LATEST
      MaximumRetryAttempts: 2
      DestinationConfig:
        OnFailure:
          Destination: !GetAtt ProcessingDLQ.Arn`
    },
    {
      title: "Step 4: Create requirements.txt",
      content: "For local development and testing, create a requirements.txt file with the Pillow dependency. When deploying to Lambda, we'll use a Lambda Layer instead to reduce deployment package size and improve cold start performance.",
      language: "text",
      code: `# requirements.txt for local development
Pillow==10.1.0
boto3==1.34.0

# For local testing
pytest==7.4.3
moto==4.2.9  # Mock AWS services`
    },
    {
      title: "Step 5: Deploy and Test",
      content: "Deploy the complete solution and test by uploading images to S3. Monitor CloudWatch Logs to see processing in real-time and verify thumbnails are created in the destination bucket.",
      language: "bash",
      code: `# Build and deploy
sam build
sam deploy --guided

# Get bucket names from outputs
SOURCE_BUCKET=$(aws cloudformation describe-stacks \\
  --stack-name image-processor-stack \\
  --query 'Stacks[0].Outputs[?OutputKey==\`SourceBucketName\`].OutputValue' \\
  --output text)

DEST_BUCKET=$(aws cloudformation describe-stacks \\
  --stack-name image-processor-stack \\
  --query 'Stacks[0].Outputs[?OutputKey==\`DestinationBucketName\`].OutputValue' \\
  --output text)

echo "Source Bucket: $SOURCE_BUCKET"
echo "Destination Bucket: $DEST_BUCKET"

# Upload test image
aws s3 cp test-image.jpg s3://$SOURCE_BUCKET/uploads/test-image.jpg

# Wait a few seconds for processing
sleep 5

# Check if thumbnail was created
aws s3 ls s3://$DEST_BUCKET/thumbnails/uploads/

# Download and verify thumbnail
aws s3 cp s3://$DEST_BUCKET/thumbnails/uploads/test-image.jpg thumbnail-output.jpg

# View Lambda logs
sam logs --stack-name image-processor-stack --tail

# Upload multiple images for batch testing
for i in {1..10}; do
  aws s3 cp test-image.jpg s3://$SOURCE_BUCKET/uploads/test-$i.jpg
done

# Monitor CloudWatch metrics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --dimensions Name=FunctionName,Value=image-processor-stack-ImageProcessorFunction-XXXXX \\
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 60 \\
  --statistics Sum

# Clean up test files
aws s3 rm s3://$SOURCE_BUCKET/uploads/ --recursive
aws s3 rm s3://$DEST_BUCKET/thumbnails/ --recursive`
    }
  ]
};

// Due to size constraints, I'll create a comprehensive file with all tutorials
// Continuing with remaining tutorials...
