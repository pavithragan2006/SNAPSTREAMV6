from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import uuid
import json
import os
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

app = Flask(__name__)
CORS(app)

# --- AWS Configuration ---
REGION = 'us-east-1' 
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:604665149129:aws_capstone_topic' 

# Initialize AWS Resources
# In EC2, this uses the IAM Role. Locally, it uses ~/.aws/credentials.
dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

# Table Definitions (Match the 'id' partition keys from your app.py logic)
users_table = dynamodb.Table('users')
media_table = dynamodb.Table('media_items')

def send_notification(subject, message):
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except ClientError as e:
        print(f"SNS Notification Error: {e}")

# --- API Routes mapped from app.py ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    user_id = str(uuid.uuid4())
    
    # Check if email exists (similar to UNIQUE constraint in SQLite)
    existing = users_table.scan(FilterExpression=Attr('email').eq(data['email']))
    if existing['Items']:
        return jsonify({"error": "Email already exists"}), 400

    user_item = {
        'id': user_id,
        'name': data['name'],
        'email': data['email'],
        'password': data['password'],
        'role': data['role']
    }
    
    users_table.put_item(Item=user_item)
    send_notification("SnapStream Registration", f"New user {data['name']} registered as {data['role']}.")
    
    return jsonify({"id": user_id, "name": data['name'], "email": data['email'], "role": data['role']}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    # Scan for email matching (case-insensitive logic handled by frontend or exact match here)
    response = users_table.scan(FilterExpression=Attr('email').eq(data['email']))
    items = response.get('Items', [])
    
    if items and items[0]['password'] == data['password']:
        user = items[0]
        send_notification("User Login", f"User {user['email']} has logged in.")
        return jsonify({
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role']
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/media', methods=['GET'])
def get_media():
    owner_id = request.args.get('owner_id')
    is_admin = request.args.get('is_admin') == 'true'
    
    if is_admin:
        response = media_table.scan()
    else:
        response = media_table.scan(FilterExpression=Attr('owner_id').eq(owner_id))
        
    items = response.get('Items', [])
    # Sort by upload_date descending (manual sort since Scan is unordered)
    items.sort(key=lambda x: x.get('upload_date', ''), reverse=True)
    
    # Format analysis results back to JSON for the frontend
    for item in items:
        if 'analysis_results' in item and isinstance(item['analysis_results'], str):
            item['analysis'] = json.loads(item['analysis_results'])
            
    return jsonify(items)

@app.route('/api/media', methods=['POST'])
def create_media():
    data = request.json
    media_item = {
        'id': data['id'],
        'owner_id': data.get('owner_id'),
        'name': data['name'],
        'type': data['type'],
        'size': data['size'],
        'status': data['status'],
        'url': data['url'],
        'thumbnail_url': data.get('thumbnailUrl'),
        'profile': data.get('profile'),
        'upload_date': str(uuid.uuid1()) # Using a timestamp-based ID or current time string
    }
    
    media_table.put_item(Item=media_item)
    return jsonify({"status": "created"}), 201

@app.route('/api/media/<item_id>/analysis', methods=['PUT'])
def update_analysis(item_id):
    data = request.json
    media_table.update_item(
        Key={'id': item_id},
        UpdateExpression="SET analysis_results = :val, #s = :stat",
        ExpressionAttributeValues={
            ':val': json.dumps(data),
            ':stat': 'completed'
        },
        ExpressionAttributeNames={
            "#s": "status" # 'status' is a reserved keyword in DynamoDB
        }
    )
    return jsonify({"status": "updated"})

@app.route('/api/media/<item_id>', methods=['DELETE'])
def delete_media(item_id):
    media_table.delete_item(Key={'id': item_id})
    return jsonify({"status": "deleted"})

@app.route('/api/users', methods=['GET'])
def get_users():
    response = users_table.scan()
    items = response.get('Items', [])
    # Filter out passwords before sending to frontend
    users = [{"id": u['id'], "name": u['name'], "email": u['email'], "role": u['role']} for u in items]
    return jsonify(users)

if __name__ == '__main__':
    # host='0.0.0.0' is required for EC2 deployment
    app.run(host='0.0.0.0', port=5000, debug=True)