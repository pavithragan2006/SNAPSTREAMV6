from flask import Flask, request, jsonify, session
from flask_cors import CORS
import boto3
import uuid
import json
import os
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

app = Flask(__name__)
app.secret_key = 'snapstream_secret_key' # Required for session management
CORS(app)

# --- AWS Configuration ---
REGION = 'us-east-1' 
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:604665149129:aws_capstone_topic' 

dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

# DynamoDB Tables (Ensure these Partition Keys are set in AWS: 'id' for both)
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
        print(f"Error sending notification: {e}")

# --- API Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    user_id = str(uuid.uuid4())
    
    # Check if email exists (Using scan for simplicity in this exercise)
    existing_users = users_table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('email').eq(data['email'])
    )
    if existing_users['Items']:
        return jsonify({"error": "Email already exists"}), 400

    user_item = {
        'id': user_id,
        'name': data['name'],
        'email': data['email'],
        'password': data['password'], # Note: In production, hash this!
        'role': data['role']
    }
    
    users_table.put_item(Item=user_item)
    send_notification("New SnapStream Signup", f"User {data['name']} ({data['role']}) registered.")
    
    return jsonify(user_item), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    # Scan for matching email
    response = users_table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('email').eq(data['email'])
    )
    users = response.get('Items', [])
    
    if users and users[0]['password'] == data['password']:
        user = users[0]
        send_notification("User Login", f"User {user['email']} logged into SnapStream.")
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
        # Scan for media belonging to owner
        response = media_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('owner_id').eq(owner_id)
        )
        
    items = response.get('Items', [])
    # Sort items by upload_date manually since Scan doesn't sort
    items.sort(key=lambda x: x.get('upload_date', ''), reverse=True)
    
    return jsonify(items)

@app.route('/api/media', methods=['POST'])
def create_media():
    data = request.json
    # If frontend doesn't provide ID, generate one
    media_id = data.get('id') or str(uuid.uuid4())
    
    media_item = {
        'id': media_id,
        'owner_id': data.get('owner_id'),
        'name': data['name'],
        'type': data['type'],
        'size': data['size'],
        'status': data['status'],
        'url': data['url'],
        'thumbnail_url': data.get('thumbnailUrl'),
        'profile': data.get('profile'),
        'upload_date': str(boto3.utils.rfc3339_date()) # Current timestamp
    }
    
    media_table.put_item(Item=media_item)
    return jsonify({"status": "created", "id": media_id}), 201

@app.route('/api/media/<item_id>/analysis', methods=['PUT'])
def update_analysis(item_id):
    data = request.json
    
    media_table.update_item(
        Key={'id': item_id},
        UpdateExpression="set analysis_results = :a, #stat = :s",
        ExpressionAttributeValues={
            ':a': json.dumps(data),
            ':s': 'completed'
        },
        ExpressionAttributeNames={
            "#stat": "status" # 'status' is a reserved keyword in DynamoDB
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
    # Clean output (remove passwords)
    users = [{"id": u['id'], "name": u['name'], "email": u['email'], "role": u['role']} for u in items]
    return jsonify(users)

if __name__ == '__main__':
    app.run(port=5000, debug=True)