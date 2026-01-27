from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
import boto3
import uuid
from werkzeug.utils import secure_filename
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'snapstream_fallback_key')

# --- AWS Universal Configuration ---
# By NOT passing keys here, Boto3 looks at IAM Roles (Cloud) or ~/.aws (Local)
REGION = 'us-east-1'
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:604665149129:aws_capstone_topic'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
sns = boto3.client('sns', region_name=REGION)

# Table Definitions
users_table = dynamodb.Table('Users')
admin_users_table = dynamodb.Table('AdminUsers')
projects_table = dynamodb.Table('Projects')
enrollments_table = dynamodb.Table('Enrollments')

# Configuration for File Uploads
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def send_notification(subject, message):
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except ClientError as e:
        print(f"SNS Error: {e.response['Error']['Message']}")

# --- Core Routes ---

@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('home'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        response = users_table.get_item(Key={'username': username})
        if 'Item' in response:
            flash("User already exists!")
            return redirect(url_for('signup'))
        
        users_table.put_item(Item={'username': username, 'password': password})
        send_notification("New User Signup", f"User {username} has joined SnapStream.")
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        response = users_table.get_item(Key={'username': username})
        if 'Item' in response and response['Item']['password'] == password:
            session['username'] = username
            send_notification("User Login", f"User {username} logged in.")
            return redirect(url_for('home'))
        flash("Invalid credentials!")
    return render_template('login.html')

@app.route('/home')
def home():
    if 'username' not in session: return redirect(url_for('login'))
    username = session['username']
    
    # Fetch Enrollments
    res_enroll = enrollments_table.get_item(Key={'username': username})
    project_ids = res_enroll.get('Item', {}).get('project_ids', [])
    
    my_projects = []
    for pid in project_ids:
        p_res = projects_table.get_item(Key={'id': pid})
        if 'Item' in p_res: my_projects.append(p_res['Item'])
            
    return render_template('home.html', username=username, my_projects=my_projects)

# --- Admin Functionality ---

@app.route('/admin/create-project', methods=['GET', 'POST'])
def admin_create_project():
    if 'admin' not in session: return redirect(url_for('admin_login'))
    
    if request.method == 'POST':
        title = request.form['title']
        image = request.files['image']
        
        img_filename = secure_filename(image.filename) if image else None
        if img_filename:
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], img_filename))
        
        project_id = str(uuid.uuid4())
        projects_table.put_item(Item={
            'id': project_id,
            'title': title,
            'problem_statement': request.form['problem_statement'],
            'image': img_filename
        })
        send_notification("Admin Action", f"New Project Created: {title}")
        return redirect(url_for('admin_dashboard'))
        
    return render_template('admin_create_project.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Use 0.0.0.0 so EC2 allows external traffic on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)