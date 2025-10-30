import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps

# --- 초기 설정 ---
load_dotenv()
app = Flask(__name__)
# ⚠️ 나중에 실제 배포 시에는 반드시 복잡하고 안전한 키로 변경해야 합니다.
app.config['SECRET_KEY'] = 'YOUR_SECRET_KEY'
bcrypt = Bcrypt(app)
CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# --- 인증 토큰(JWT) 관련 함수 ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'message': '토큰이 존재하지 않습니다.'}), 401

        try:
            # 우리 서버가 발급한 토큰이 맞는지 SECRET_KEY로 검증합니다.
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            # 토큰에서 사용자 id를 추출합니다.
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'message': '토큰이 유효하지 않습니다.', 'error': str(e)}), 401

        # 검증된 사용자 id를 API 함수로 전달합니다.
        return f(current_user_id, *args, **kwargs)
    return decorated

# --- API 엔드포인트 ---

# 1. 회원가입 API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': '이메일과 비밀번호를 모두 입력해주세요.'}), 400

    # 비밀번호를 bcrypt로 해싱(암호화)합니다.
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        # 새로운 users 테이블에 사용자 정보를 저장합니다.
        response = supabase.table('users').insert({
            'email': email,
            'password_hash': hashed_password
        }).execute()
        return jsonify({'message': '회원가입이 완료되었습니다.'}), 201
    except Exception as e:
        return jsonify({'message': '이미 존재하는 이메일입니다.', 'error': str(e)}), 409


# 2. 로그인 API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user_response = supabase.table('users').select("*").eq('email', email).execute()
    
    if not user_response.data:
        return jsonify({'message': '존재하지 않는 사용자입니다.'}), 401

    user = user_response.data[0]
    if bcrypt.check_password_hash(user['password_hash'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # user_id를 응답에 추가합니다.
        return jsonify({
            'token': token, 
            'email': user['email'], 
            'user_id': user['id'] 
        })

    return jsonify({'message': '비밀번호가 일치하지 않습니다.'}), 401


# 3. 게시글 목록 조회 API (누구나 가능)
@app.route('/api/posts', methods=['GET'])
def get_posts():
    # 이전에 만든 RPC 함수를 호출합니다. (함수 내용은 다음 단계에서 수정 필요)
    try:
        response = supabase.rpc('get_all_posts_with_author').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500


# 4. 새 게시글 작성 API (로그인 필요)
@app.route('/api/posts', methods=['POST'])
@token_required # 이 데코레이터가 토큰을 검증합니다.
def create_post(current_user_id): # token_required로부터 사용자 id를 받습니다.
    data = request.get_json()
    
    response = supabase.table('posts').insert({
        'title': data.get('title'),
        'content': data.get('content'),
        'user_id': current_user_id
    }).execute()

    new_post_id = response.data[0]['id']
    new_post_response = supabase.rpc('get_all_posts_with_author').eq('id', new_post_id).single().execute()
    
    return jsonify(new_post_response.data), 201

# (상세 조회) - ID로 특정 게시글 하나만 조회
@app.route("/api/posts/<int:post_id>", methods=['GET'])
def get_post_by_id(post_id):
    # 이 API는 누구나 접근 가능하므로 인증이 필요 없습니다.
    response = supabase.rpc('get_all_posts_with_author').eq('id', post_id).single().execute()
    if response.data:
        return jsonify(response.data)
    return jsonify({'message': '게시글을 찾을 수 없습니다.'}), 404

# (수정) - ID로 특정 게시글 수정 (로그인 필요)
@app.route("/api/posts/<int:post_id>", methods=['PUT'])
@token_required
def update_post(current_user_id, post_id):
    # 1. 수정하려는 게시글이 현재 로그인한 사용자의 글이 맞는지 확인
    post_response = supabase.table('posts').select("user_id").eq('id', post_id).single().execute()
    if not post_response.data or post_response.data['user_id'] != current_user_id:
        return jsonify({'message': '수정 권한이 없습니다.'}), 403

    # 2. 게시글 수정 진행
    data = request.get_json()
    response = supabase.table('posts').update({
        'title': data.get('title'),
        'content': data.get('content')
    }).eq('id', post_id).execute()
    
    return jsonify(response.data)

# (삭제) - ID로 특정 게시글 삭제 (로그인 필요)
@app.route("/api/posts/<int:post_id>", methods=['DELETE'])
@token_required
def delete_post(current_user_id, post_id):
    # 1. 삭제하려는 게시글이 현재 로그인한 사용자의 글이 맞는지 확인
    post_response = supabase.table('posts').select("user_id").eq('id', post_id).single().execute()
    if not post_response.data or post_response.data['user_id'] != current_user_id:
        return jsonify({'message': '삭제 권한이 없습니다.'}), 403

    # 2. 게시글 삭제 진행
    response = supabase.table('posts').delete().eq('id', post_id).execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)