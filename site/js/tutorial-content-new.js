// Comprehensive AWS Tutorials with SEO-optimized content
window.TUTORIALS = {};

// RAG with Amazon Kendra and Bedrock
window.TUTORIALS["rag-kendra-bedrock"] = {
  title: "Build RAG Application with Amazon Kendra and Bedrock",
  category: "AI & GenAI",
  difficulty: "Intermediate",
  duration: "45 min",
  description: "Learn how to build a production-ready Retrieval-Augmented Generation (RAG) application using Amazon Kendra for intelligent search and Amazon Bedrock for AI-powered responses.",
  whatYouLearn: [
    "Understand RAG architecture and its benefits for enterprise AI applications",
    "Set up Amazon Kendra index with document ingestion and semantic search",
    "Integrate Amazon Bedrock Claude model for natural language generation",
    "Implement context-aware responses using retrieved documents",
    "Handle citations and source attribution in AI responses",
    "Deploy serverless RAG API using Lambda and API Gateway"
  ],
  skillsImproved: ["Amazon Kendra", "Amazon Bedrock", "RAG Architecture", "AWS Lambda", "Python", "Semantic Search"],
  architecture: `graph LR
    A[User Query] --> B[API Gateway]
    B --> C[Lambda Function]
    C --> D[Amazon Kendra]
    D --> E[Document Index]
    E --> D
    D --> C
    C --> F[Amazon Bedrock]
    F --> G[Claude Model]
    G --> F
    F --> C
    C --> B
    B --> H[AI Response with Citations]`,
  intro: `<h2 class="text-xl font-bold mb-3">Introduction to RAG with AWS</h2>
    <p class="mb-4">Retrieval-Augmented Generation (RAG) is a powerful AI architecture that combines the strengths of information retrieval systems with large language models (LLMs). Instead of relying solely on the LLM's training data, RAG retrieves relevant documents from your knowledge base and uses them as context for generating accurate, up-to-date responses.</p>
    <p class="mb-4"><strong>Why RAG?</strong> Traditional LLMs can hallucinate or provide outdated information. RAG solves this by grounding responses in your actual documents, making it ideal for enterprise applications like customer support, internal knowledge bases, and compliance documentation.</p>
    <p class="mb-4"><strong>Amazon Kendra</strong> is AWS's intelligent search service powered by machine learning. It understands natural language queries and returns highly relevant results from your documents, making it perfect for RAG applications.</p>
    <p><strong>Amazon Bedrock</strong> provides access to foundation models like Anthropic's Claude through a simple API, eliminating the need to manage infrastructure while ensuring enterprise-grade security and privacy.</p>`,
  steps: [
    {
      title: "Step 1: Create Amazon Kendra Index",
      content: "First, create a Kendra index to store and search your documents. Kendra uses machine learning to understand document content and user queries semantically. This CloudFormation template creates an index with an S3 data source for document ingestion.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Description: Amazon Kendra Index for RAG Application

Resources:
  KendraIndex:
    Type: AWS::Kendra::Index
    Properties:
      Name: rag-knowledge-base
      Edition: DEVELOPER_EDITION
      RoleArn: !GetAtt KendraRole.Arn
      Description: Intelligent search index for RAG application

  KendraRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: kendra.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      Policies:
        - PolicyName: KendraS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::\${DocumentBucket}/*'
                  - !Sub 'arn:aws:s3:::\${DocumentBucket}'

  DocumentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'rag-documents-\${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled

  KendraDataSource:
    Type: AWS::Kendra::DataSource
    Properties:
      IndexId: !Ref KendraIndex
      Name: S3DocumentSource
      Type: S3
      DataSourceConfiguration:
        S3Configuration:
          BucketName: !Ref DocumentBucket
      RoleArn: !GetAtt KendraRole.Arn
      Schedule: 'cron(0 */6 * * ? *)'  # Sync every 6 hours

Outputs:
  IndexId:
    Value: !Ref KendraIndex
    Description: Kendra Index ID
  BucketName:
    Value: !Ref DocumentBucket
    Description: S3 bucket for documents`
    },
    {
      title: "Step 2: Upload Documents to S3",
      content: "Upload your knowledge base documents to the S3 bucket. Kendra supports PDF, HTML, Word, PowerPoint, and plain text files. The service automatically extracts text, understands document structure, and creates searchable indexes.",
      language: "bash",
      code: `# Upload sample documents
aws s3 cp ./documents/ s3://rag-documents-YOUR-ACCOUNT-ID/ --recursive

# Trigger Kendra data source sync
aws kendra start-data-source-sync-job \\
  --index-id YOUR-INDEX-ID \\
  --id YOUR-DATA-SOURCE-ID

# Check sync status
aws kendra describe-data-source-sync-job \\
  --index-id YOUR-INDEX-ID \\
  --id YOUR-DATA-SOURCE-ID \\
  --sync-job-id YOUR-SYNC-JOB-ID`
    },
    {
      title: "Step 3: Implement RAG Lambda Function",
      content: "Create a Lambda function that queries Kendra for relevant documents and sends them to Bedrock for response generation. This function implements the core RAG logic: retrieve, augment, and generate.",
      language: "python",
      code: `import json
import boto3
import os

kendra = boto3.client('kendra')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

KENDRA_INDEX_ID = os.environ['KENDRA_INDEX_ID']
MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'

def lambda_handler(event, context):
    """
    RAG Lambda function that:
    1. Queries Kendra for relevant documents
    2. Constructs context from top results
    3. Sends to Bedrock for AI-generated response
    """
    body = json.loads(event['body'])
    query = body.get('query', '')
    
    if not query:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Query is required'})
        }
    
    # Step 1: Query Kendra for relevant documents
    kendra_response = kendra.query(
        IndexId=KENDRA_INDEX_ID,
        QueryText=query,
        PageSize=5,  # Top 5 results
        AttributeFilter={
            'EqualsTo': {
                'Key': '_language_code',
                'Value': {'StringValue': 'en'}
            }
        }
    )
    
    # Step 2: Extract context from Kendra results
    context_parts = []
    citations = []
    
    for idx, result in enumerate(kendra_response['ResultItems'][:3]):
        if result['Type'] == 'DOCUMENT':
            excerpt = result.get('DocumentExcerpt', {}).get('Text', '')
            title = result.get('DocumentTitle', {}).get('Text', 'Untitled')
            uri = result.get('DocumentURI', '')
            
            context_parts.append(f"[Document {idx+1}: {title}]\\n{excerpt}")
            citations.append({
                'number': idx + 1,
                'title': title,
                'uri': uri,
                'relevance': result.get('ScoreAttributes', {}).get('ScoreConfidence', 'MEDIUM')
            })
    
    context = "\\n\\n".join(context_parts)
    
    # Step 3: Construct prompt for Bedrock
    prompt = f"""You are a helpful AI assistant. Answer the user's question based on the provided context from our knowledge base.

Context from knowledge base:
{context}

User Question: {query}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain enough information, say so
- Cite sources using [Document N] notation
- Be concise and accurate

Answer:"""
    
    # Step 4: Call Bedrock Claude model
    bedrock_body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "top_p": 0.9
    })
    
    bedrock_response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=bedrock_body
    )
    
    response_body = json.loads(bedrock_response['body'].read())
    answer = response_body['content'][0]['text']
    
    # Step 5: Return response with citations
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'answer': answer,
            'citations': citations,
            'query': query
        })
    }`
    },
    {
      title: "Step 4: Deploy with SAM Template",
      content: "Use AWS SAM to deploy the complete RAG application including Lambda function, API Gateway, and IAM roles. This template creates a production-ready serverless API.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: RAG Application with Kendra and Bedrock

Parameters:
  KendraIndexId:
    Type: String
    Description: Kendra Index ID from previous stack

Resources:
  RagFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/rag/
      Handler: app.lambda_handler
      Runtime: python3.11
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          KENDRA_INDEX_ID: !Ref KendraIndexId
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - kendra:Query
                - kendra:Retrieve
              Resource: !Sub 'arn:aws:kendra:\${AWS::Region}:\${AWS::AccountId}:index/\${KendraIndexId}'
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: 'arn:aws:bedrock:*::foundation-model/*'
      Events:
        RagApi:
          Type: Api
          Properties:
            Path: /query
            Method: post
            RestApiId: !Ref RagApi

  RagApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowOrigin: "'*'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowMethods: "'POST,OPTIONS'"

Outputs:
  ApiUrl:
    Value: !Sub 'https://\${RagApi}.execute-api.\${AWS::Region}.amazonaws.com/prod/query'
    Description: RAG API endpoint`
    },
    {
      title: "Step 5: Test the RAG Application",
      content: "Test your RAG application by sending queries via the API. The response includes the AI-generated answer and citations to source documents, ensuring transparency and traceability.",
      language: "bash",
      code: `# Test RAG API
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the best practices for Lambda performance optimization?"
  }'

# Expected response:
{
  "answer": "Based on the knowledge base, here are key Lambda performance best practices:\\n\\n1. **Minimize cold starts** by keeping functions warm and using provisioned concurrency [Document 1]\\n2. **Optimize memory allocation** - more memory means more CPU [Document 2]\\n3. **Reduce package size** by removing unused dependencies [Document 1]\\n4. **Use environment variables** for configuration instead of loading from external sources [Document 3]",
  "citations": [
    {
      "number": 1,
      "title": "AWS Lambda Performance Optimization Guide",
      "uri": "s3://rag-documents-123456789/lambda-performance.pdf",
      "relevance": "HIGH"
    },
    {
      "number": 2,
      "title": "Lambda Memory and CPU Configuration",
      "uri": "s3://rag-documents-123456789/lambda-memory.pdf",
      "relevance": "HIGH"
    }
  ],
  "query": "What are the best practices for Lambda performance optimization?"
}`
    }
  ]
};

// Continue with more tutorials...
// Lambda DynamoDB API
window.TUTORIALS["lambda-dynamodb-api"] = {
  title: "Build Serverless REST API with Lambda and DynamoDB",
  category: "Serverless",
  difficulty: "Beginner",
  duration: "30 min",
  description: "Create a production-ready serverless REST API using AWS Lambda, API Gateway, and DynamoDB with full CRUD operations, error handling, and best practices.",
  whatYouLearn: [
    "Design DynamoDB table with proper partition and sort keys",
    "Implement CRUD operations using AWS SDK for Python (Boto3)",
    "Create RESTful API endpoints with API Gateway",
    "Handle errors and validation in Lambda functions",
    "Implement pagination and filtering for list operations",
    "Deploy using AWS SAM with Infrastructure as Code"
  ],
  skillsImproved: ["AWS Lambda", "DynamoDB", "API Gateway", "Python", "REST API", "AWS SAM"],
  architecture: `graph LR
    A[Client] --> B[API Gateway]
    B --> C[Lambda CRUD]
    C --> D[DynamoDB Table]
    D --> C
    C --> B
    B --> A`,
  intro: `<h2 class="text-xl font-bold mb-3">Building Serverless APIs on AWS</h2>
    <p class="mb-4">Serverless architecture eliminates server management, automatically scales with demand, and charges only for actual usage. This tutorial demonstrates building a complete REST API using AWS's serverless services.</p>
    <p class="mb-4"><strong>AWS Lambda</strong> runs your code without provisioning servers. You write functions that respond to events (HTTP requests in this case), and AWS handles scaling, patching, and availability.</p>
    <p class="mb-4"><strong>Amazon DynamoDB</strong> is a fully managed NoSQL database that provides single-digit millisecond performance at any scale. It's perfect for serverless applications due to its automatic scaling and pay-per-request pricing.</p>
    <p><strong>Amazon API Gateway</strong> creates, publishes, and manages REST APIs at any scale. It handles request routing, authentication, rate limiting, and monitoring.</p>`,
  steps: [
    {
      title: "Step 1: Design DynamoDB Table",
      content: "Design a DynamoDB table for storing items. Use a single-table design with a partition key (PK) and sort key (SK) for flexibility. This example creates a table for a task management application.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  TasksTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tasks-table
      BillingMode: PAY_PER_REQUEST  # Auto-scaling, no capacity planning
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: Production`
    },
    {
      title: "Step 2: Implement Create Operation",
      content: "Implement the CREATE operation to add new items to DynamoDB. This function validates input, generates unique IDs, and stores items with timestamps.",
      language: "python",
      code: `import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('tasks-table')

def lambda_handler(event, context):
    """Create a new task"""
    try:
        body = json.loads(event['body'])
        
        # Validate required fields
        if 'title' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Title is required'})
            }
        
        # Generate unique ID
        task_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Prepare item
        item = {
            'PK': f'TASK#{task_id}',
            'SK': f'METADATA',
            'GSI1PK': f'USER#{body.get("userId", "anonymous")}',
            'GSI1SK': f'TASK#{timestamp}',
            'taskId': task_id,
            'title': body['title'],
            'description': body.get('description', ''),
            'status': body.get('status', 'pending'),
            'priority': body.get('priority', 'medium'),
            'createdAt': timestamp,
            'updatedAt': timestamp
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(item, default=str)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }`
    },
    {
      title: "Step 3: Implement Read Operations",
      content: "Implement GET operations to retrieve single items and list all items with pagination. DynamoDB's Query operation is efficient for retrieving items by partition key.",
      language: "python",
      code: `def get_task(event, context):
    """Get a single task by ID"""
    try:
        task_id = event['pathParameters']['id']
        
        response = table.get_item(
            Key={
                'PK': f'TASK#{task_id}',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Task not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Item'], default=str)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def list_tasks(event, context):
    """List all tasks with pagination"""
    try:
        # Get query parameters
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 20))
        last_key = params.get('lastKey')
        
        # Query parameters
        query_params = {
            'IndexName': 'GSI1',
            'KeyConditionExpression': 'GSI1PK = :pk',
            'ExpressionAttributeValues': {
                ':pk': f'USER#{params.get("userId", "anonymous")}'
            },
            'Limit': limit,
            'ScanIndexForward': False  # Newest first
        }
        
        # Add pagination token if provided
        if last_key:
            query_params['ExclusiveStartKey'] = json.loads(last_key)
        
        response = table.query(**query_params)
        
        result = {
            'items': response['Items'],
            'count': len(response['Items'])
        }
        
        # Include pagination token if more results exist
        if 'LastEvaluatedKey' in response:
            result['lastKey'] = json.dumps(response['LastEvaluatedKey'], default=str)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }`
    },
    {
      title: "Step 4: Implement Update and Delete",
      content: "Implement UPDATE and DELETE operations to complete the CRUD functionality. Use UpdateExpression for atomic updates and ConditionExpression to prevent race conditions.",
      language: "python",
      code: `def update_task(event, context):
    """Update an existing task"""
    try:
        task_id = event['pathParameters']['id']
        body = json.loads(event['body'])
        
        # Build update expression dynamically
        update_expr = "SET updatedAt = :updated"
        expr_values = {':updated': datetime.utcnow().isoformat()}
        
        if 'title' in body:
            update_expr += ", title = :title"
            expr_values[':title'] = body['title']
        
        if 'status' in body:
            update_expr += ", #status = :status"
            expr_values[':status'] = body['status']
        
        if 'description' in body:
            update_expr += ", description = :desc"
            expr_values[':desc'] = body['description']
        
        response = table.update_item(
            Key={
                'PK': f'TASK#{task_id}',
                'SK': 'METADATA'
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'},
            ConditionExpression='attribute_exists(PK)',  # Ensure item exists
            ReturnValues='ALL_NEW'
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Attributes'], default=str)
        }
        
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Task not found'})
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def delete_task(event, context):
    """Delete a task"""
    try:
        task_id = event['pathParameters']['id']
        
        table.delete_item(
            Key={
                'PK': f'TASK#{task_id}',
                'SK': 'METADATA'
            },
            ConditionExpression='attribute_exists(PK)'
        )
        
        return {
            'statusCode': 204,
            'headers': {'Content-Type': 'application/json'}
        }
        
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Task not found'})
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }`
    },
    {
      title: "Step 5: Deploy Complete API",
      content: "Deploy the complete REST API using AWS SAM. This template defines all Lambda functions, API Gateway routes, and IAM permissions.",
      language: "yaml",
      code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: python3.11
    Timeout: 10
    MemorySize: 256
    Environment:
      Variables:
        TABLE_NAME: !Ref TasksTable

Resources:
  TasksApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowOrigin: "'*'"
        AllowHeaders: "'*'"
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"

  CreateTaskFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/create/
      Handler: app.lambda_handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref TasksTable
      Events:
        CreateTask:
          Type: Api
          Properties:
            RestApiId: !Ref TasksApi
            Path: /tasks
            Method: post

  GetTaskFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/get/
      Handler: app.get_task
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref TasksTable
      Events:
        GetTask:
          Type: Api
          Properties:
            RestApiId: !Ref TasksApi
            Path: /tasks/{id}
            Method: get

  ListTasksFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/list/
      Handler: app.list_tasks
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref TasksTable
      Events:
        ListTasks:
          Type: Api
          Properties:
            RestApiId: !Ref TasksApi
            Path: /tasks
            Method: get

  UpdateTaskFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/update/
      Handler: app.update_task
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref TasksTable
      Events:
        UpdateTask:
          Type: Api
          Properties:
            RestApiId: !Ref TasksApi
            Path: /tasks/{id}
            Method: put

  DeleteTaskFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/delete/
      Handler: app.delete_task
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref TasksTable
      Events:
        DeleteTask:
          Type: Api
          Properties:
            RestApiId: !Ref TasksApi
            Path: /tasks/{id}
            Method: delete

Outputs:
  ApiUrl:
    Value: !Sub 'https://\${TasksApi}.execute-api.\${AWS::Region}.amazonaws.com/prod'
  TableName:
    Value: !Ref TasksTable`
    }
  ]
};

// Add placeholder for remaining tutorials
const tutorialIds = [
  "eventbridge-lambda-workflow",
  "step-functions-orchestration",
  "bedrock-text-generation",
  "sagemaker-endpoint-deployment",
  "agent-tool-use-bedrock",
  "multi-agent-collaboration",
  "eks-deployment",
  "cicd-codepipeline",
  "cloudwatch-observability"
];

tutorialIds.forEach(id => {
  window.TUTORIALS[id] = {
    title: "Tutorial Coming Soon",
    category: "General",
    difficulty: "Intermediate",
    duration: "30 min",
    description: "This comprehensive tutorial is being prepared with detailed AWS documentation and best practices.",
    whatYouLearn: ["Detailed content coming soon"],
    skillsImproved: ["AWS Services"],
    architecture: `graph LR\n    A[Coming Soon]`,
    intro: `<p>This tutorial is being developed with comprehensive, SEO-optimized content based on official AWS documentation.</p>`,
    steps: []
  };
});
