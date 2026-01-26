from flask import Flask, request, jsonify

from flask_cors import CORS

import sqlite3

import json

import uuid

import os



app = Flask(__name__)

CORS(app)



DB_PATH = 'snapstream.db'



def init_db():

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    # Users Table

    cursor.execute('''

        CREATE TABLE IF NOT EXISTS users (

            id TEXT PRIMARY KEY,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL,

            role TEXT NOT NULL

        )

    ''')

    # Media Items Table

    cursor.execute('''

        CREATE TABLE IF NOT EXISTS media_items (

            id TEXT PRIMARY KEY,

            owner_id TEXT,

            name TEXT NOT NULL,

            type TEXT NOT NULL,

            size INTEGER,

            status TEXT NOT NULL,

            url TEXT,

            thumbnail_url TEXT,

            profile TEXT,

            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            analysis_results TEXT,

            FOREIGN KEY (owner_id) REFERENCES users (id)

        )

    ''')

   

    # SEED DEFAULT ADMIN: Check if users exist, if not, create default

    cursor.execute("SELECT COUNT(*) FROM users")

    if cursor.fetchone()[0] == 0:

        admin_id = str(uuid.uuid4())

        cursor.execute(

            "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",

            (admin_id, 'System Administrator', 'admin@snapstream.io', 'password123', 'admin')

        )

        print(f"Database seeded with default admin: admin@snapstream.io / password123")

       

    conn.commit()

    conn.close()



init_db()



@app.route('/api/register', methods=['POST'])

def register():

    data = request.json

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    user_id = str(uuid.uuid4())

    try:

        cursor.execute(

            "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",

            (user_id, data['name'], data['email'], data['password'], data['role'])

        )

        conn.commit()

        return jsonify({"id": user_id, "name": data['name'], "email": data['email'], "role": data['role']}), 201

    except sqlite3.IntegrityError:

        return jsonify({"error": "Email already exists"}), 400

    finally:

        conn.close()



@app.route('/api/login', methods=['POST'])

def login():

    data = request.json

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    # Ensure email comparison is case-insensitive for better UX

    cursor.execute("SELECT id, name, email, password, role FROM users WHERE LOWER(email) = LOWER(?)", (data['email'],))

    user = cursor.fetchone()

    conn.close()

   

    if user and user[3] == data['password']:

        return jsonify({

            "id": user[0],

            "name": user[1],

            "email": user[2],

            "role": user[4]

        }), 200

       

    return jsonify({"error": "Invalid email or password"}), 401



@app.route('/api/media', methods=['GET'])

def get_media():

    owner_id = request.args.get('owner_id')

    is_admin = request.args.get('is_admin') == 'true'

    conn = sqlite3.connect(DB_PATH)

    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

   

    if is_admin:

        cursor.execute("SELECT * FROM media_items ORDER BY upload_date DESC")

    else:

        cursor.execute("SELECT * FROM media_items WHERE owner_id = ? ORDER BY upload_date DESC", (owner_id,))

       

    rows = cursor.fetchall()

    items = []

    for row in rows:

        item = dict(row)

        if item['analysis_results']:

            item['analysis'] = json.loads(item['analysis_results'])

        items.append(item)

    conn.close()

    return jsonify(items)



@app.route('/api/media', methods=['POST'])

def create_media():

    data = request.json

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    cursor.execute(

        "INSERT INTO media_items (id, owner_id, name, type, size, status, url, thumbnail_url, profile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",

        (data['id'], data.get('owner_id'), data['name'], data['type'], data['size'], data['status'], data['url'], data.get('thumbnailUrl'), data.get('profile'))

    )

    conn.commit()

    conn.close()

    return jsonify({"status": "created"}), 201



@app.route('/api/media/<item_id>/analysis', methods=['PUT'])

def update_analysis(item_id):

    data = request.json

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    cursor.execute(

        "UPDATE media_items SET analysis_results = ?, status = 'completed' WHERE id = ?",

        (json.dumps(data), item_id)

    )

    conn.commit()

    conn.close()

    return jsonify({"status": "updated"})



@app.route('/api/media/<item_id>', methods=['DELETE'])

def delete_media(item_id):

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    cursor.execute("DELETE FROM media_items WHERE id = ?", (item_id,))

    conn.commit()

    conn.close()

    return jsonify({"status": "deleted"})



@app.route('/api/users', methods=['GET'])

def get_users():

    conn = sqlite3.connect(DB_PATH)

    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, role FROM users")

    rows = cursor.fetchall()

    users = [dict(row) for row in rows]

    conn.close()

    return jsonify(users)


if __name__ == '__main__':

    app.run(port=5000, debug=True)
