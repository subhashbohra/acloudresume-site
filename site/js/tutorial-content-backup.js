// All Tutorial Content
window.TUTORIALS = {
  "lambda-api-gateway": {
    title: "Build REST API with Lambda + API Gateway",
    difficulty: "Beginner",
    duration: "10 min",
    description: "Create a serverless REST API in 10 minutes using AWS Lambda and API Gateway.",
    whatYouLearn: [
      "How AWS Lambda executes code without servers",
      "API Gateway routing and integration patterns",
      "Serverless deployment with AWS SAM",
      "Testing and debugging serverless APIs"
    ],
    skillsImproved: ["Serverless Architecture", "Python", "AWS SAM", "REST APIs"],
    architecture: `graph LR
    A[Client] -->|HTTPS Request| B[API Gateway]
    B -->|Invoke| C[Lambda Function]
    C -->|Response| B
    B -->|JSON Response| A
    style B fill:#FF9900
    style C fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">What is AWS Lambda?</h2>
    <p class="text-slate-700 mb-4">AWS Lambda is a serverless compute service that runs your code in response to events. You don't manage servers - AWS handles scaling, patching, and availability automatically.</p>`,
    steps: [
      {
        title: "1. Create Lambda Function",
        content: "Create a simple Lambda function that returns JSON response.",
        code: `import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'message': 'Hello from Lambda!'})
    }`,
        language: "python"
      },
      {
        title: "2. Deploy with SAM",
        content: "Use AWS SAM to deploy Lambda and API Gateway together.",
        code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.13
      Handler: app.lambda_handler
      Events:
        Api:
          Type: Api
          Properties:
            Path: /hello
            Method: GET`,
        language: "yaml"
      }
    ]
  },
  
  "s3-lambda-trigger": {
    title: "Process S3 Uploads with Lambda",
    difficulty: "Beginner",
    duration: "8 min",
    description: "Automatically process files uploaded to S3 using Lambda triggers.",
    whatYouLearn: ["S3 event notifications", "Lambda triggers", "File processing", "boto3 S3 operations"],
    skillsImproved: ["Event-Driven Architecture", "Python", "S3", "Lambda"],
    architecture: `graph LR
    A[User] -->|Upload File| B[S3 Bucket]
    B -->|Trigger Event| C[Lambda]
    C -->|Process| D[Output Bucket]
    style B fill:#FF9900
    style C fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">S3 Event Notifications</h2>
    <p class="text-slate-700 mb-4">S3 can automatically trigger Lambda functions when objects are created, deleted, or modified.</p>`,
    steps: [
      {
        title: "1. Create Lambda Function",
        content: "Process S3 events and read uploaded files.",
        code: `import boto3
import json

s3 = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Get file
        obj = s3.get_object(Bucket=bucket, Key=key)
        content = obj['Body'].read().decode('utf-8')
        
        print(f"Processed {key}: {len(content)} bytes")
    
    return {'statusCode': 200}`,
        language: "python"
      }
    ]
  },

  "dynamodb-crud": {
    title: "DynamoDB CRUD Operations",
    difficulty: "Beginner",
    duration: "12 min",
    description: "Master DynamoDB operations with Python boto3 SDK.",
    whatYouLearn: ["DynamoDB data modeling", "CRUD operations", "Query vs Scan", "boto3 SDK usage"],
    skillsImproved: ["NoSQL", "DynamoDB", "Python", "Data Modeling"],
    architecture: `graph LR
    A[Application] -->|boto3| B[DynamoDB]
    B -->|Put/Get/Update/Delete| C[Table]
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">DynamoDB Basics</h2>
    <p class="text-slate-700 mb-4">DynamoDB is a fully managed NoSQL database with single-digit millisecond performance at any scale.</p>`,
    steps: [
      {
        title: "1. CRUD Operations",
        content: "Create, Read, Update, Delete items in DynamoDB.",
        code: `import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

# Create
table.put_item(Item={'userId': '123', 'name': 'John', 'email': 'john@example.com'})

# Read
response = table.get_item(Key={'userId': '123'})
user = response['Item']

# Update
table.update_item(
    Key={'userId': '123'},
    UpdateExpression='SET #n = :name',
    ExpressionAttributeNames={'#n': 'name'},
    ExpressionAttributeValues={':name': 'John Doe'}
)

# Delete
table.delete_item(Key={'userId': '123'})`,
        language: "python"
      }
    ]
  },

  "bedrock-chatbot": {
    title: "Build a Chatbot with Bedrock",
    difficulty: "Intermediate",
    duration: "12 min",
    description: "Create a conversational AI chatbot using Amazon Bedrock.",
    whatYouLearn: ["Bedrock API usage", "Conversation memory", "DynamoDB integration", "Multi-turn conversations"],
    skillsImproved: ["Amazon Bedrock", "GenAI", "DynamoDB", "Conversation Design"],
    architecture: `graph TD
    A[User] -->|Chat| B[Lambda]
    B -->|Get History| C[DynamoDB]
    B -->|Generate| D[Bedrock]
    D -->|Response| B
    B -->|Save| C
    style D fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">Amazon Bedrock</h2>
    <p class="text-slate-700 mb-4">Bedrock provides access to foundation models through a single API.</p>`,
    steps: [
      {
        title: "1. Setup Bedrock Client",
        content: "Initialize Bedrock and create chat function.",
        code: `import boto3
import json

bedrock = boto3.client('bedrock-runtime')

def chat(message, history=[]):
    messages = history + [{"role": "user", "content": message}]
    
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "messages": messages,
            "max_tokens": 500
        })
    )
    
    result = json.loads(response['body'].read())
    return result['content'][0]['text']`,
        language: "python"
      }
    ]
  },

  "bedrock-agents-basics": {
    title: "Build AI Agents with Bedrock Agents",
    difficulty: "Intermediate",
    duration: "15 min",
    description: "Create autonomous AI agents that can use tools and APIs.",
    whatYouLearn: ["Bedrock Agents", "Tool use", "Action groups", "Agent orchestration"],
    skillsImproved: ["Agentic AI", "Bedrock", "Lambda", "API Design"],
    architecture: `graph TD
    A[User] -->|Query| B[Bedrock Agent]
    B -->|Call Tool| C[Lambda Function]
    C -->|API Call| D[External Service]
    D -->|Data| C
    C -->|Result| B
    B -->|Response| A
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">Bedrock Agents</h2>
    <p class="text-slate-700 mb-4">Agents can autonomously use tools and make decisions to accomplish tasks.</p>`,
    steps: [
      {
        title: "1. Create Tool Lambda",
        content: "Define a Lambda function that your agent can call.",
        code: `def lambda_handler(event, context):
    location = event['parameters']['location']
    
    # Call weather API
    weather = get_weather(location)
    
    return {
        'response': {
            'temperature': weather['temp'],
            'condition': weather['condition']
        }
    }`,
        language: "python"
      }
    ]
  },

  "python-lambda-basics": {
    title: "Python Lambda Function Essentials",
    difficulty: "Beginner",
    duration: "10 min",
    description: "Master Python Lambda development with best practices.",
    whatYouLearn: ["Lambda handler structure", "Environment variables", "boto3 SDK", "Error handling"],
    skillsImproved: ["Python", "Lambda", "boto3", "Serverless"],
    architecture: `graph LR
    A[Event] -->|Trigger| B[Lambda Handler]
    B -->|Use| C[boto3]
    C -->|Call| D[AWS Services]
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">Lambda with Python</h2>
    <p class="text-slate-700 mb-4">Python is the most popular runtime for Lambda functions.</p>`,
    steps: [
      {
        title: "1. Handler Structure",
        content: "Understand Lambda handler parameters and return values.",
        code: `import os
import json

def lambda_handler(event, context):
    # Environment variables
    table_name = os.environ['TABLE_NAME']
    
    # Event data
    body = json.loads(event.get('body', '{}'))
    
    # Context info
    request_id = context.request_id
    memory = context.memory_limit_in_mb
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Success'})
    }`,
        language: "python"
      }
    ]
  },

  "javascript-lambda-nodejs": {
    title: "Node.js Lambda with AWS SDK",
    difficulty: "Beginner",
    duration: "10 min",
    description: "Build Lambda functions using JavaScript and AWS SDK v3.",
    whatYouLearn: ["Node.js async/await", "AWS SDK v3", "DynamoDB operations", "Error handling"],
    skillsImproved: ["JavaScript", "Node.js", "Lambda", "AWS SDK"],
    architecture: `graph LR
    A[Event] -->|Trigger| B[Lambda Handler]
    B -->|AWS SDK v3| C[DynamoDB]
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">Node.js Lambda</h2>
    <p class="text-slate-700 mb-4">Node.js provides fast cold starts and excellent async support.</p>`,
    steps: [
      {
        title: "1. AWS SDK v3 Usage",
        content: "Use modular AWS SDK v3 with async/await.",
        code: `import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const command = new PutCommand({
        TableName: "Users",
        Item: {
            userId: "123",
            name: "John Doe"
        }
    });
    
    await docClient.send(command);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Success" })
    };
};`,
        language: "javascript"
      }
    ]
  },

  "sam-template-basics": {
    title: "AWS SAM Template Basics",
    difficulty: "Beginner",
    duration: "10 min",
    description: "Define serverless infrastructure as code with SAM.",
    whatYouLearn: ["SAM syntax", "Resource definitions", "Environment variables", "Event sources"],
    skillsImproved: ["SAM", "IaC", "CloudFormation", "YAML"],
    architecture: `graph TD
    A[SAM Template] -->|sam build| B[CloudFormation]
    B -->|Deploy| C[Lambda + API + DynamoDB]
    style A fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">AWS SAM</h2>
    <p class="text-slate-700 mb-4">SAM simplifies serverless application deployment with shorthand syntax.</p>`,
    steps: [
      {
        title: "1. Basic SAM Template",
        content: "Define Lambda, API Gateway, and DynamoDB in one file.",
        code: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.13
      Handler: app.lambda_handler
      Environment:
        Variables:
          TABLE_NAME: !Ref MyTable
      Events:
        Api:
          Type: Api
          Properties:
            Path: /items
            Method: get

  MyTable:
    Type: AWS::Serverless::SimpleTable`,
        language: "yaml"
      }
    ]
  },

  "cloudwatch-monitoring": {
    title: "Monitor Lambda with CloudWatch",
    difficulty: "Beginner",
    duration: "8 min",
    description: "Set up logs, metrics, and alarms for Lambda functions.",
    whatYouLearn: ["CloudWatch Logs", "Metrics", "Alarms", "Log Insights"],
    skillsImproved: ["CloudWatch", "Monitoring", "Observability", "Troubleshooting"],
    architecture: `graph LR
    A[Lambda] -->|Logs| B[CloudWatch Logs]
    A -->|Metrics| C[CloudWatch Metrics]
    C -->|Trigger| D[Alarm]
    D -->|Notify| E[SNS]
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">CloudWatch Monitoring</h2>
    <p class="text-slate-700 mb-4">CloudWatch provides comprehensive monitoring for Lambda functions.</p>`,
    steps: [
      {
        title: "1. Create Alarm",
        content: "Set up alarm for Lambda errors.",
        code: `aws cloudwatch put-metric-alarm \\
  --alarm-name lambda-errors \\
  --alarm-description "Alert on Lambda errors" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 300 \\
  --threshold 5 \\
  --comparison-operator GreaterThanThreshold \\
  --dimensions Name=FunctionName,Value=MyFunction`,
        language: "bash"
      }
    ]
  },

  "bedrock-text-generation": {
    title: "Generate Text with Amazon Bedrock",
    difficulty: "Beginner",
    duration: "8 min",
    description: "Use Claude or Titan models to generate AI-powered text.",
    whatYouLearn: ["Bedrock API", "Model invocation", "Prompt engineering", "Response parsing"],
    skillsImproved: ["Bedrock", "GenAI", "Python", "API Integration"],
    architecture: `graph LR
    A[Application] -->|Prompt| B[Bedrock]
    B -->|Invoke| C[Claude/Titan]
    C -->|Generated Text| B
    B -->|Response| A
    style B fill:#FF9900`,
    intro: `<h2 class="text-2xl font-bold mb-3">Text Generation</h2>
    <p class="text-slate-700 mb-4">Generate summaries, translations, and creative content with AI.</p>`,
    steps: [
      {
        title: "1. Invoke Bedrock Model",
        content: "Call Bedrock to generate text.",
        code: `import boto3
import json

bedrock = boto3.client('bedrock-runtime')

def generate_text(prompt):
    response = bedrock.invoke_model(
        modelId='amazon.titan-text-express-v1',
        body=json.dumps({
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 512,
                "temperature": 0.7
            }
        })
    )
    
    result = json.loads(response['body'].read())
    return result['results'][0]['outputText']

text = generate_text("Write a haiku about AWS Lambda")
print(text)`,
        language: "python"
      }
    ]
  }
};

// Remaining tutorials (11-21)
window.TUTORIALS["eventbridge-scheduler"] = {
  title: "Schedule Tasks with EventBridge",
  difficulty: "Beginner",
  duration: "7 min",
  description: "Run Lambda functions on a schedule using EventBridge rules.",
  whatYouLearn: ["EventBridge rules", "Cron expressions", "Scheduled tasks", "Event patterns"],
  skillsImproved: ["EventBridge", "Lambda", "Scheduling", "Automation"],
  architecture: `graph LR
  A[EventBridge Rule] -->|Cron Schedule| B[Lambda]
  B -->|Execute Task| C[Output]
  style A fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">EventBridge Scheduler</h2>
  <p class="text-slate-700 mb-4">EventBridge can trigger Lambda functions on a schedule using cron or rate expressions.</p>`,
  steps: [{
    title: "1. Create Scheduled Rule",
    content: "Define EventBridge rule with cron expression.",
    code: `Resources:
  ScheduledFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.13
      Handler: app.lambda_handler
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: 'cron(0 9 * * ? *)'  # 9 AM daily
            Description: Run daily at 9 AM`,
    language: "yaml"
  }]
};

window.TUTORIALS["step-functions-workflow"] = {
  title: "Build Workflows with Step Functions",
  difficulty: "Intermediate",
  duration: "15 min",
  description: "Orchestrate multiple Lambda functions into a workflow.",
  whatYouLearn: ["Step Functions", "State machines", "Error handling", "Parallel execution"],
  skillsImproved: ["Step Functions", "Workflow", "Lambda", "Orchestration"],
  architecture: `graph TD
  A[Start] --> B[Lambda 1]
  B --> C{Success?}
  C -->|Yes| D[Lambda 2]
  C -->|No| E[Error Handler]
  D --> F[End]
  style B fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Step Functions</h2>
  <p class="text-slate-700 mb-4">Orchestrate complex workflows with built-in error handling and retries.</p>`,
  steps: [{
    title: "1. Define State Machine",
    content: "Create workflow with multiple steps.",
    code: `{
  "StartAt": "ProcessData",
  "States": {
    "ProcessData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessFunction",
      "Next": "ValidateData",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "HandleError"
      }]
    },
    "ValidateData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ValidateFunction",
      "End": true
    },
    "HandleError": {
      "Type": "Fail",
      "Error": "ProcessingFailed"
    }
  }
}`,
    language: "json"
  }]
};

window.TUTORIALS["rag-kendra-bedrock"] = {
  title: "RAG with Kendra + Bedrock",
  difficulty: "Advanced",
  duration: "20 min",
  description: "Build a knowledge-base chatbot using RAG architecture.",
  whatYouLearn: ["RAG architecture", "Kendra search", "Bedrock generation", "Context injection"],
  skillsImproved: ["RAG", "Kendra", "Bedrock", "AI Architecture"],
  architecture: `graph TD
  A[User Query] --> B[Kendra]
  B -->|Relevant Docs| C[Bedrock]
  C -->|Generate Answer| D[Response]
  style B fill:#FF9900
  style C fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">RAG Architecture</h2>
  <p class="text-slate-700 mb-4">Retrieval-Augmented Generation combines search with AI generation for accurate answers.</p>`,
  steps: [{
    title: "1. Query Kendra",
    content: "Search knowledge base for relevant documents.",
    code: `import boto3

kendra = boto3.client('kendra')
bedrock = boto3.client('bedrock-runtime')

def rag_query(question):
    # Search Kendra
    response = kendra.query(
        IndexId='your-index-id',
        QueryText=question
    )
    
    # Get top results
    context = ""
    for result in response['ResultItems'][:3]:
        context += result['DocumentExcerpt']['Text'] + "\\n\\n"
    
    # Generate answer with Bedrock
    prompt = f"Context: {context}\\n\\nQuestion: {question}\\n\\nAnswer:"
    # ... invoke Bedrock with prompt`,
    language: "python"
  }]
};

window.TUTORIALS["prompt-engineering"] = {
  title: "Prompt Engineering Essentials",
  difficulty: "Beginner",
  duration: "10 min",
  description: "Master prompt design for better AI outputs.",
  whatYouLearn: ["Prompt techniques", "Few-shot learning", "Chain-of-thought", "Role prompting"],
  skillsImproved: ["Prompt Engineering", "GenAI", "AI Best Practices"],
  architecture: `graph LR
  A[Prompt] --> B[LLM]
  B --> C[Output]
  style B fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Prompt Engineering</h2>
  <p class="text-slate-700 mb-4">Well-designed prompts dramatically improve AI output quality.</p>`,
  steps: [{
    title: "1. Few-Shot Prompting",
    content: "Provide examples to guide the model.",
    code: `prompt = """
You are a helpful AWS expert. Answer questions concisely.

Q: What is Lambda?
A: AWS Lambda is a serverless compute service that runs code without managing servers.

Q: What is S3?
A: Amazon S3 is object storage with industry-leading scalability and durability.

Q: What is DynamoDB?
A: """

# Model will follow the pattern and provide a concise answer`,
    language: "python"
  }]
};

window.TUTORIALS["agent-with-knowledge-base"] = {
  title: "AI Agent with Custom Knowledge Base",
  difficulty: "Advanced",
  duration: "18 min",
  description: "Give your agent domain-specific knowledge using vector databases.",
  whatYouLearn: ["Knowledge bases", "Vector embeddings", "Agent configuration", "RAG for agents"],
  skillsImproved: ["Agents", "Knowledge Base", "RAG", "Bedrock"],
  architecture: `graph TD
  A[User] --> B[Agent]
  B --> C[Knowledge Base]
  C --> D[Vector DB]
  D --> C
  C --> B
  B --> E[Response]
  style B fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Agent Knowledge Bases</h2>
  <p class="text-slate-700 mb-4">Agents can query custom knowledge bases to answer domain-specific questions.</p>`,
  steps: [{
    title: "1. Create Knowledge Base",
    content: "Set up vector database with your documents.",
    code: `Resources:
  KnowledgeBase:
    Type: AWS::Bedrock::KnowledgeBase
    Properties:
      Name: CompanyDocs
      RoleArn: !GetAtt KBRole.Arn
      KnowledgeBaseConfiguration:
        Type: VECTOR
        VectorKnowledgeBaseConfiguration:
          EmbeddingModelArn: arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1
      StorageConfiguration:
        Type: OPENSEARCH_SERVERLESS`,
    language: "yaml"
  }]
};

window.TUTORIALS["multi-agent-system"] = {
  title: "Build Multi-Agent Systems",
  difficulty: "Advanced",
  duration: "22 min",
  description: "Orchestrate multiple AI agents working together.",
  whatYouLearn: ["Multi-agent architecture", "Agent coordination", "Task delegation", "Result aggregation"],
  skillsImproved: ["Agents", "Orchestration", "System Design", "Bedrock"],
  architecture: `graph TD
  A[Coordinator] --> B[Research Agent]
  A --> C[Writer Agent]
  A --> D[Reviewer Agent]
  B --> E[Results]
  C --> E
  D --> E
  style A fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Multi-Agent Systems</h2>
  <p class="text-slate-700 mb-4">Multiple specialized agents can collaborate to solve complex tasks.</p>`,
  steps: [{
    title: "1. Define Agent Roles",
    content: "Create specialized agents for different tasks.",
    code: `agents = {
    'researcher': {
        'role': 'Research and gather information',
        'tools': ['web_search', 'database_query']
    },
    'writer': {
        'role': 'Write content based on research',
        'tools': ['text_generation']
    },
    'reviewer': {
        'role': 'Review and improve content',
        'tools': ['quality_check']
    }
}

def orchestrate(task):
    research = agents['researcher'].execute(task)
    draft = agents['writer'].execute(research)
    final = agents['reviewer'].execute(draft)
    return final`,
    language: "python"
  }]
};

window.TUTORIALS["agent-tool-use"] = {
  title: "AI Agents with Custom Tools",
  difficulty: "Intermediate",
  duration: "14 min",
  description: "Teach agents to use external APIs and services.",
  whatYouLearn: ["Tool definitions", "Function calling", "API integration", "Tool orchestration"],
  skillsImproved: ["Agents", "Tools", "API", "Integration"],
  architecture: `graph LR
  A[Agent] --> B[Tool 1: Weather]
  A --> C[Tool 2: Email]
  A --> D[Tool 3: Database]
  style A fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Agent Tools</h2>
  <p class="text-slate-700 mb-4">Agents can use custom tools to interact with external systems.</p>`,
  steps: [{
    title: "1. Define Tool Schema",
    content: "Create OpenAPI schema for your tools.",
    code: `{
  "openapi": "3.0.0",
  "info": {"title": "Agent Tools"},
  "paths": {
    "/weather": {
      "get": {
        "description": "Get weather for a location",
        "parameters": [{
          "name": "location",
          "in": "query",
          "required": true,
          "schema": {"type": "string"}
        }],
        "responses": {
          "200": {
            "description": "Weather data",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "temperature": {"type": "number"},
                    "condition": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,
    language: "json"
  }]
};

window.TUTORIALS["cicd-codepipeline"] = {
  title: "CI/CD with CodePipeline",
  difficulty: "Intermediate",
  duration: "15 min",
  description: "Automate deployments with AWS CodePipeline.",
  whatYouLearn: ["CodePipeline", "CodeBuild", "Automated testing", "Deployment automation"],
  skillsImproved: ["CI/CD", "CodePipeline", "DevOps", "Automation"],
  architecture: `graph LR
  A[GitHub] --> B[CodePipeline]
  B --> C[CodeBuild]
  C --> D[Deploy to Lambda]
  style B fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">CI/CD Pipeline</h2>
  <p class="text-slate-700 mb-4">Automate build, test, and deployment with CodePipeline.</p>`,
  steps: [{
    title: "1. Create Pipeline",
    content: "Define pipeline stages in SAM template.",
    code: `Resources:
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: 1
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
        - Name: Deploy
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1`,
    language: "yaml"
  }]
};

window.TUTORIALS["java-lambda-spring"] = {
  title: "Java Lambda with Spring Boot",
  difficulty: "Intermediate",
  duration: "18 min",
  description: "Build enterprise Lambda functions using Java and Spring.",
  whatYouLearn: ["Spring Cloud Function", "Java Lambda", "Dependency injection", "Enterprise patterns"],
  skillsImproved: ["Java", "Spring Boot", "Lambda", "Enterprise Development"],
  architecture: `graph LR
  A[Event] --> B[Spring Handler]
  B --> C[Service Layer]
  C --> D[Repository]
  style B fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Java Lambda</h2>
  <p class="text-slate-700 mb-4">Use Spring Boot for enterprise-grade Lambda functions.</p>`,
  steps: [{
    title: "1. Spring Cloud Function",
    content: "Create Lambda with Spring dependency injection.",
    code: `@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
    
    @Bean
    public Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> handleRequest() {
        return request -> {
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);
            response.setBody("{\\"message\\": \\"Hello from Spring Lambda\\"}");
            return response;
        };
    }
}`,
    language: "java"
  }]
};

window.TUTORIALS["python-async-lambda"] = {
  title: "Async Python in Lambda",
  difficulty: "Intermediate",
  duration: "12 min",
  description: "Use asyncio for concurrent operations in Lambda.",
  whatYouLearn: ["asyncio", "Concurrent API calls", "Performance optimization", "async/await"],
  skillsImproved: ["Python", "Async", "Performance", "Concurrency"],
  architecture: `graph TD
  A[Lambda] --> B[Async Task 1]
  A --> C[Async Task 2]
  A --> D[Async Task 3]
  B --> E[Results]
  C --> E
  D --> E
  style A fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">Async Python</h2>
  <p class="text-slate-700 mb-4">Speed up Lambda functions with concurrent operations.</p>`,
  steps: [{
    title: "1. Async Handler",
    content: "Use asyncio for parallel API calls.",
    code: `import asyncio
import aiohttp

async def fetch_data(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

async def lambda_handler(event, context):
    urls = ['https://api1.com', 'https://api2.com', 'https://api3.com']
    
    # Fetch all URLs concurrently
    results = await asyncio.gather(*[fetch_data(url) for url in urls])
    
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }`,
    language: "python"
  }]
};

window.TUTORIALS["typescript-lambda-cdk"] = {
  title: "TypeScript Lambda with AWS CDK",
  difficulty: "Intermediate",
  duration: "15 min",
  description: "Build type-safe Lambda functions using TypeScript and CDK.",
  whatYouLearn: ["TypeScript", "AWS CDK", "Type safety", "Infrastructure as code"],
  skillsImproved: ["TypeScript", "CDK", "Lambda", "Type Safety"],
  architecture: `graph LR
  A[CDK Code] --> B[CloudFormation]
  B --> C[Lambda + API]
  style A fill:#FF9900`,
  intro: `<h2 class="text-2xl font-bold mb-3">TypeScript CDK</h2>
  <p class="text-slate-700 mb-4">Use TypeScript for both infrastructure and Lambda code.</p>`,
  steps: [{
    title: "1. CDK Stack",
    content: "Define infrastructure with TypeScript CDK.",
    code: `import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    
    const fn = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda')
    });
    
    new apigateway.LambdaRestApi(this, 'MyApi', {
      handler: fn
    });
  }
}`,
    language: "typescript"
  }]
};
