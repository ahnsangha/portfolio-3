import os
import uuid
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
    nickname = data.get('nickname') # 닉네임 가져오기

    if not email or not password or not nickname:
        return jsonify({'message': '이메일, 비밀번호, 닉네임을 모두 입력해주세요.'}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        response = supabase.table('users').insert({
            'email': email,
            'password_hash': hashed_password,
            'nickname': nickname # 닉네임 저장
        }).execute()
        return jsonify({'message': '회원가입이 완료되었습니다.'}), 201
    except Exception as e:
        # 닉네임 중복 오류도 여기서 처리됩니다.
        return jsonify({'message': '이미 사용 중인 이메일 또는 닉네임입니다.', 'error': str(e)}), 409


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
        
        return jsonify({
            'token': token, 
            'email': user['email'], 
            'user_id': user['id'],
            # 👇 .get()을 사용하여 nickname이 없을 경우 None을 반환하도록 안전하게 변경
            'nickname': user.get('nickname') 
        })

    return jsonify({'message': '비밀번호가 일치하지 않습니다.'}), 401

# 3. 게시글 목록 조회 API (누구나 가능)
@app.route('/api/posts', methods=['GET'])
def get_posts():
    search_term = request.args.get('search', '')
    
    # 1. 'page' 파라미터를 받아옵니다. 없으면 1페이지로 간주.
    try:
        page = int(request.args.get('page', 1))
    except ValueError:
        page = 1
    
    # 2. 한 페이지에 5개의 게시글을 보여주도록 설정합니다.
    limit = 5
    offset = (page - 1) * limit

    try:
        # 3. RPC 함수에 limit과 offset을 전달합니다.
        response = supabase.rpc('get_all_posts_with_author', {
            'search_term': search_term,
            'page_limit': limit,
            'page_offset': offset
        }).execute()
        
        # 4. 총 개수를 계산합니다.
        total_count = 0
        if response.data:
            # RPC 함수가 반환한 total_count 값을 사용합니다.
            total_count = response.data[0]['total_count']
        
        # 5. 게시글 목록과 함께 총 개수, 현재 페이지 정보를 반환합니다.
        return jsonify({
            'posts': response.data,
            'total_count': total_count,
            'page': page,
            'limit': limit
        })

    except Exception as e:
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500

@app.route("/api/posts/<int:post_id>", methods=['GET'])
def get_post_by_id(post_id):
    # 이 API는 누구나 접근 가능하므로 인증이 필요 없습니다.
    try:
        response = supabase.rpc('get_all_posts_with_author').eq('id', post_id).single().execute()
        if response.data:
            return jsonify(response.data)
        return jsonify({'message': '게시글을 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500


# 4. 새 게시글 작성 API (로그인 필요)
@app.route('/api/posts', methods=['POST'])
@token_required # 1. @token_required가 우리 앱의 보안을 담당
def create_post(current_user_id):
    try:
        data = request.get_json()
        
        # 2. 전역 supabase 클라이언트로 바로 작업 (RLS를 무시함)
        response = supabase.table('posts').insert({
            'title': data.get('title'),
            'content': data.get('content'),
            'user_id': current_user_id
        }).execute()

        new_post_id = response.data[0]['id']
        new_post_response = supabase.rpc('get_all_posts_with_author').eq('id', new_post_id).single().execute()
        return jsonify(new_post_response.data), 201
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# (수정) - ID로 특정 게시글 수정 (로그인 필요)
@app.route("/api/posts/<int:post_id>", methods=['PUT'])
@token_required
def update_post(current_user_id, post_id):
    try:
        # 1. 우리 백엔드 로직으로 권한 확인
        post_response = supabase.table('posts').select("user_id").eq('id', post_id).single().execute()
        if not post_response.data or post_response.data['user_id'] != current_user_id:
            return jsonify({'message': '수정 권한이 없습니다.'}), 403

        # 2. 전역 클라이언트로 DB 수정
        data = request.get_json()
        response = supabase.table('posts').update({
            'title': data.get('title'),
            'content': data.get('content')
        }).eq('id', post_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# (삭제) - ID로 특정 게시글 삭제 (로그인 필요)
@app.route("/api/posts/<int:post_id>", methods=['DELETE'])
@token_required
def delete_post(current_user_id, post_id):
    try:
        post_response = supabase.table('posts').select("user_id").eq('id', post_id).single().execute()
        if not post_response.data or post_response.data['user_id'] != current_user_id:
            return jsonify({'message': '삭제 권한이 없습니다.'}), 403

        response = supabase.table('posts').delete().eq('id', post_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# 5. 닉네임 변경 API (로그인 필요)
@app.route('/api/user/nickname', methods=['PUT'])
@token_required
def update_nickname(current_user_id):
    data = request.get_json()
    new_nickname = data.get('nickname')
    if not new_nickname:
        return jsonify({'message': '새 닉네임을 입력해주세요.'}), 400
    try:
        response = supabase.table('users').update({
            'nickname': new_nickname
        }).eq('id', current_user_id).execute()
        return jsonify({'nickname': new_nickname})
    except Exception as e:
        return jsonify({'message': '이미 사용 중인 닉네임이거나 오류가 발생했습니다.', 'error': str(e)}), 409

# 6. 프로필 사진 업로드 API (로그인 필요)
@app.route('/api/user/avatar', methods=['POST'])
@token_required
def upload_avatar(current_user_id):
    if 'avatar' not in request.files:
        return jsonify({'message': '파일이 전송되지 않았습니다.'}), 400
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'message': '선택된 파일이 없습니다.'}), 400

    try:
        file_ext = os.path.splitext(file.filename)[1]
        file_path = f"{current_user_id}/{uuid.uuid4()}{file_ext}"

        # 1. 전역 클라이언트로 Storage에 업로드 (RLS 무시)
        file_data = file.read()
        supabase.storage.from_('avatars').upload(
            path=file_path,
            file=file_data,
            file_options={'content-type': file.content_type}
        )
        public_url = supabase.storage.from_('avatars').get_public_url(file_path)

        # 2. 전역 클라이언트로 DB에 업데이트 (RLS 무시)
        supabase.table('users').update({
            'avatar_url': public_url
        }).eq('id', current_user_id).execute()

        return jsonify({'avatar_url': public_url}), 200
    except Exception as e:
        return jsonify({'message': '파일 업로드 중 오류가 발생했습니다.', 'error': str(e)}), 500
    
# 7. 프로필 사진 삭제 API (로그인 필요)
@app.route('/api/user/avatar', methods=['DELETE'])
@token_required
def delete_avatar(current_user_id):
    try:
        # 1. 사용자의 현재 아바타 URL 가져오기 (관리자 권한)
        user_response = supabase.table('users').select("avatar_url").eq('id', current_user_id).single().execute()
        current_avatar_url = user_response.data.get('avatar_url')

        if not current_avatar_url:
            return jsonify({'message': '삭제할 프로필 사진이 없습니다.'}), 404

        # 2. Storage에서 파일 삭제
        try:
            # URL에서 파일 경로(예: 123/abc.png)를 추출합니다.
            path_to_remove = current_avatar_url.split('/avatars/')[-1]
            supabase.storage.from_('avatars').remove([path_to_remove])
        except Exception as e:
            # DB 연결을 끊는 것이 더 중요하므로, 스토리지 삭제 실패는 로깅만 합니다.
            print(f"Could not delete file from storage: {e}")
        
        # 3. 'users' 테이블에서 avatar_url을 NULL로 업데이트
        supabase.table('users').update({
            'avatar_url': None
        }).eq('id', current_user_id).execute()

        # 4. 프론트엔드에 avatar_url이 null임을 반환
        return jsonify({'avatar_url': None}), 200

    except Exception as e:
        print(f"Error in delete_avatar: {e}")
        return jsonify({'message': '사진 삭제 중 오류가 발생했습니다.', 'error': str(e)}), 500
    
# 8. 특정 게시글의 댓글 목록 조회 API (누구나 가능)
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    try:
        # 댓글을 가져올 때, users 테이블을 조인하여 작성자 닉네임과 아바타 URL을 함께 가져옵니다.
        response = supabase.table('comments').select(
            '*, users(nickname, avatar_url)'
        ).eq('post_id', post_id).order('created_at', desc=True).execute()
        
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"message": "댓글을 불러오는 데 실패했습니다.", "details": str(e)}), 500

# 9. 새 댓글 작성 API (로그인 필요)
@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user_id, post_id):
    data = request.get_json()
    content = data.get('content')

    if not content:
        return jsonify({'message': '내용을 입력해주세요.'}), 400

    # 1. 글자 수 제한 (500자)
    if len(content) > 500:
        return jsonify({'message': '댓글은 500자를 초과할 수 없습니다.'}), 400

    try:
        # 2. 댓글을 DB에 저장
        response = supabase.table('comments').insert({
            'content': content,
            'user_id': current_user_id,
            'post_id': post_id
        }).execute()
        
        new_comment_id = response.data[0]['id']

        # 3. 방금 생성된 댓글의 전체 정보(작성자 닉네임 포함)를 다시 조회하여 반환
        new_comment = supabase.table('comments').select(
            '*, users(nickname, avatar_url)'
        ).eq('id', new_comment_id).single().execute()

        return jsonify(new_comment.data), 201

    except Exception as e:
        return jsonify({'message': '댓글 작성 중 오류가 발생했습니다.', 'error': str(e)}), 500
    
# 10. 댓글 삭제 API (로그인 필요)
@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user_id, comment_id):
    try:
        # 1. 삭제하려는 댓글의 작성자(user_id)를 확인합니다. (관리자 권한)
        comment_response = supabase.table('comments').select("user_id").eq('id', comment_id).single().execute()
        
        if not comment_response.data:
            return jsonify({'message': '댓글을 찾을 수 없습니다.'}), 404
        
        comment_user_id = comment_response.data['user_id']
        
        # 2. 현재 로그인한 사용자와 댓글 작성자가 일치하는지 확인합니다.
        if comment_user_id != current_user_id:
            return jsonify({'message': '삭제 권한이 없습니다.'}), 403
            
        # 3. 댓글을 삭제합니다.
        supabase.table('comments').delete().eq('id', comment_id).execute()
        
        return jsonify({'message': '댓글이 삭제되었습니다.'}), 200

    except Exception as e:
        print(f"Error in delete_comment: {e}")
        return jsonify({'message': '댓글 삭제 중 오류가 발생했습니다.', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)
