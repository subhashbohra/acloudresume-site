import os
import json
import time
import boto3
import urllib.request
import urllib.parse

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE'])

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', '')
LINKEDIN_CLIENT_ID = os.environ.get('LINKEDIN_CLIENT_ID', '')
LINKEDIN_CLIENT_SECRET = os.environ.get('LINKEDIN_CLIENT_SECRET', '')
SITE_BASE_URL = os.environ['SITE_BASE_URL']

def lambda_handler(event, context):
    path = event.get('rawPath') or event.get('path', '')
    
    if '/auth/callback' in path:
        return handle_oauth_callback(event)
    
    if '/auth/count' in path:
        return get_user_count()
    
    return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}

def handle_oauth_callback(event):
    try:
        qs = event.get('queryStringParameters', {})
        code = qs.get('code')
        provider = qs.get('state', 'google')
        
        if not code:
            return redirect_error('Missing code')
        
        # Get redirect URI dynamically
        redirect_uri = f"{SITE_BASE_URL}/auth/callback"
        
        if provider == 'google':
            user_info = handle_google_oauth(code, redirect_uri)
        elif provider == 'github':
            user_info = handle_github_oauth(code, redirect_uri)
        elif provider == 'linkedin':
            user_info = handle_linkedin_oauth(code, redirect_uri)
        else:
            return redirect_error('Invalid provider')
        
        if not user_info:
            return redirect_error('Failed to get user info')
        
        user_id = save_user(user_info, provider)
        
        return {
            'statusCode': 302,
            'headers': {'Location': f'{SITE_BASE_URL}?registered=true'}
        }
        
    except Exception as e:
        print(f"OAuth error: {str(e)}")
        return redirect_error(str(e))

def handle_google_oauth(code, redirect_uri):
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    req = urllib.request.Request(
        token_url,
        data=urllib.parse.urlencode(data).encode(),
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read())
    
    access_token = token_data.get('access_token')
    if not access_token:
        return None
    
    req = urllib.request.Request(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def handle_github_oauth(code, redirect_uri):
    token_url = 'https://github.com/login/oauth/access_token'
    data = {
        'code': code,
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'redirect_uri': redirect_uri
    }
    
    req = urllib.request.Request(
        token_url,
        data=urllib.parse.urlencode(data).encode(),
        headers={'Accept': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read())
    
    access_token = token_data.get('access_token')
    if not access_token:
        return None
    
    req = urllib.request.Request(
        'https://api.github.com/user',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    with urllib.request.urlopen(req) as response:
        user_data = json.loads(response.read())
    
    if not user_data.get('email'):
        req = urllib.request.Request(
            'https://api.github.com/user/emails',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        with urllib.request.urlopen(req) as response:
            emails = json.loads(response.read())
            user_data['email'] = next((e['email'] for e in emails if e['primary']), '')
    
    return {
        'id': str(user_data['id']),
        'email': user_data.get('email', ''),
        'name': user_data.get('name') or user_data.get('login'),
        'picture': user_data.get('avatar_url', '')
    }

def handle_linkedin_oauth(code, redirect_uri):
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'code': code,
        'client_id': LINKEDIN_CLIENT_ID,
        'client_secret': LINKEDIN_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    req = urllib.request.Request(
        token_url,
        data=urllib.parse.urlencode(data).encode(),
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read())
    
    access_token = token_data.get('access_token')
    if not access_token:
        return None
    
    req = urllib.request.Request(
        'https://api.linkedin.com/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())

def save_user(user_info, provider):
    user_id = user_info.get('id')
    timestamp = int(time.time())
    
    users_table.put_item(Item={
        'userId': f'{provider}_{user_id}',
        'email': user_info.get('email', ''),
        'name': user_info.get('name', ''),
        'picture': user_info.get('picture', ''),
        'provider': provider,
        'registeredAt': timestamp
    })
    
    return f'{provider}_{user_id}'

def get_user_count():
    try:
        response = users_table.scan(Select='COUNT')
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'totalUsers': response.get('Count', 0)})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def redirect_error(message):
    return {
        'statusCode': 302,
        'headers': {'Location': f'{SITE_BASE_URL}?registered=false&error={urllib.parse.quote(message)}'}
    }
