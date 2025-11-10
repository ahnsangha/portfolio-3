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
from sqlalchemy import create_engine, text # SQLAlchemy 임포트

# --- 초기 설정 ---
load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY")
bcrypt = Bcrypt(app)
CORS(app)

# 1. (신규) SQLAlchemy 엔진 생성 (Neon DB 연결)
db_url = os.environ.get("DATABASE_URL")
# Neon의 DB URL은 postgres://로 시작하므로, psycopg2가 인식하도록 postgresql://로 변경
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
engine = create_engine(db_url)

# 2. (기존) Supabase 클라이언트 (Storage 전용)
supa_url: str = os.environ.get("SUPABASE_URL")
supa_key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supa_url, supa_key)


# --- (기존) 인증 토큰(JWT) 관련 함수 (변경 없음) ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': '토큰이 존재하지 않습니다.'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'message': '토큰이 유효하지 않습니다.', 'error': str(e)}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated

# --- API 엔드포인트 (SQLAlchemy로 모두 수정) ---

# 1. 회원가입 API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nickname = data.get('nickname')

    if not email or not password or not nickname:
        return jsonify({'message': '이메일, 비밀번호, 닉네임을 모두 입력해주세요.'}), 400

    try:
        # SQLAlchemy를 사용한 SQL 실행
        with engine.connect() as conn:
            # 1. 이메일 중복 확인
            email_check = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).first()
            if email_check:
                return jsonify({'message': '이미 사용 중인 이메일입니다.'}), 409

            # 2. 닉네임 중복 확인
            nickname_check = conn.execute(text("SELECT id FROM users WHERE nickname = :nickname"), {"nickname": nickname}).first()
            if nickname_check:
                return jsonify({'message': '이미 사용 중인 닉네임입니다.'}), 409

            # 3. 사용자 생성
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            conn.execute(text("""
                INSERT INTO users (email, password_hash, nickname) 
                VALUES (:email, :password_hash, :nickname)
            """), {"email": email, "password_hash": hashed_password, "nickname": nickname})
            conn.commit() # 변경사항 저장
            
            return jsonify({'message': '회원가입이 완료되었습니다.'}), 201
            
    except Exception as e:
        return jsonify({'message': '회원가입 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 2. 로그인 API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    with engine.connect() as conn:
        user_result = conn.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email}).first()

    if not user_result:
        return jsonify({'message': '존재하지 않는 사용자입니다.'}), 401
    
    # SQLAlchemy의 Row 객체를 dict로 변환
    user = user_result._asdict()

    if bcrypt.check_password_hash(user['password_hash'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            'token': token, 
            'email': user['email'], 
            'user_id': user['id'],
            'nickname': user.get('nickname'),
            'avatar_url': user.get('avatar_url')
        })

    return jsonify({'message': '비밀번호가 일치하지 않습니다.'}), 401

# 3. 게시글 목록 조회 API (SQL JOIN으로 RPC 대체)
@app.route('/api/posts', methods=['GET'])
def get_posts():
    search_term = request.args.get('search', '')
    try:
        page = int(request.args.get('page', 1))
    except ValueError:
        page = 1
    
    limit = 5
    offset = (page - 1) * limit

    # Supabase RPC를 복잡한 SQL 쿼리로 대체
    query = text("""
        WITH FilteredPosts AS (
            SELECT
                p.id, p.created_at, p.title, p.content, p.user_id, p.image_url,
                u.nickname AS author_nickname,
                COUNT(l.post_id) AS like_count,
                COUNT(*) OVER() as total_count
            FROM posts AS p
            JOIN users AS u ON p.user_id = u.id
            LEFT JOIN likes AS l ON p.id = l.post_id
            WHERE
                (:search_term = '' OR p.title ILIKE :search_pattern OR p.content ILIKE :search_pattern)
            GROUP BY p.id, u.nickname
        )
        SELECT * FROM FilteredPosts
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset;
    """)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(query, {
                "search_term": search_term,
                "search_pattern": f"%{search_term}%",
                "limit": limit,
                "offset": offset
            }).fetchall()
        
        posts_data = [row._asdict() for row in result]
        total_count = posts_data[0]['total_count'] if posts_data else 0
        
        return jsonify({
            'posts': posts_data,
            'total_count': total_count,
            'page': page,
            'limit': limit
        })
    except Exception as e:
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500

# 4. 새 게시글 작성 API
@app.route('/api/posts', methods=['POST'])
@token_required
def create_post(current_user_id):
    try:
        data = request.get_json()
        
        query = text("""
            INSERT INTO posts (title, content, user_id, image_url) 
            VALUES (:title, :content, :user_id, :image_url)
            RETURNING id;
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {
                'title': data.get('title'),
                'content': data.get('content'),
                'user_id': current_user_id,
                'image_url': data.get('image_url')
            }).first()
            new_post_id = result[0]
            conn.commit()

        # (상세 조회 쿼리를 재사용하여 방금 만든 게시글 정보 반환)
        detail_query = text("""
            SELECT p.*, u.nickname AS author_nickname, COUNT(l.post_id) AS like_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            WHERE p.id = :post_id
            GROUP BY p.id, u.nickname
        """)
        with engine.connect() as conn:
            final_post = conn.execute(detail_query, {"post_id": new_post_id}).first()

        return jsonify(final_post._asdict()), 201
        
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# (상세 조회) - ID로 특정 게시글 하나만 조회
@app.route("/api/posts/<int:post_id>", methods=['GET'])
def get_post_by_id(post_id):
    try:
        detail_query = text("""
            SELECT p.id, p.created_at, p.title, p.content, p.user_id, p.image_url,
                   u.nickname AS author_nickname, 
                   COUNT(l.post_id) AS like_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            WHERE p.id = :post_id
            GROUP BY p.id, u.nickname
        """)
        with engine.connect() as conn:
            result = conn.execute(detail_query, {"post_id": post_id}).first()

        if result:
            return jsonify(result._asdict())
        return jsonify({'message': '게시글을 찾을 수 없습니다.'}), 404
    except Exception as e:
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500

# (수정) - ID로 특정 게시글 수정
@app.route("/api/posts/<int:post_id>", methods=['PUT'])
@token_required
def update_post(current_user_id, post_id):
    try:
        with engine.connect() as conn:
            post_check = conn.execute(text("SELECT user_id FROM posts WHERE id = :id"), {"id": post_id}).first()
            if not post_check or post_check[0] != current_user_id:
                return jsonify({'message': '수정 권한이 없습니다.'}), 403

            data = request.get_json()
            conn.execute(text("""
                UPDATE posts SET title = :title, content = :content 
                WHERE id = :id
            """), {"title": data.get('title'), "content": data.get('content'), "id": post_id})
            conn.commit()
            
            # (수정된 데이터 반환 로직은 편의상 생략, 간단히 성공 메시지 반환)
            return jsonify({'message': '게시글이 수정되었습니다.'}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# (삭제) - ID로 특정 게시글 삭제
@app.route("/api/posts/<int:post_id>", methods=['DELETE'])
@token_required
def delete_post(current_user_id, post_id):
    try:
        with engine.connect() as conn:
            post_check = conn.execute(text("SELECT user_id FROM posts WHERE id = :id"), {"id": post_id}).first()
            if not post_check or post_check[0] != current_user_id:
                return jsonify({'message': '삭제 권한이 없습니다.'}), 403

            conn.execute(text("DELETE FROM posts WHERE id = :id"), {"id": post_id})
            conn.commit()
            return jsonify({'message': '게시글이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# 5. 닉네임 변경 API
@app.route('/api/user/nickname', methods=['PUT'])
@token_required
def update_nickname(current_user_id):
    data = request.get_json()
    new_nickname = data.get('nickname')
    if not new_nickname:
        return jsonify({'message': '새 닉네임을 입력해주세요.'}), 400
    try:
        with engine.connect() as conn:
            conn.execute(text("UPDATE users SET nickname = :nickname WHERE id = :id"), 
                         {"nickname": new_nickname, "id": current_user_id})
            conn.commit()
        return jsonify({'nickname': new_nickname})
    except Exception as e:
        return jsonify({'message': '이미 사용 중인 닉네임이거나 오류가 발생했습니다.', 'error': str(e)}), 409

# 6. 프로필 사진 업로드 API (Storage는 Supabase 계속 사용)
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

        # 1. Supabase Storage에 업로드 (관리자 권한)
        file_data = file.read()
        supabase.storage.from_('avatars').upload(
            path=file_path, file=file_data, file_options={'content-type': file.content_type}
        )
        public_url = supabase.storage.from_('avatars').get_public_url(file_path)

        # 2. Neon DB에 URL 업데이트
        with engine.connect() as conn:
            conn.execute(text("UPDATE users SET avatar_url = :url WHERE id = :id"),
                         {"url": public_url, "id": current_user_id})
            conn.commit()

        return jsonify({'avatar_url': public_url}), 200
    except Exception as e:
        return jsonify({'message': '파일 업로드 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 7. 프로필 사진 삭제 API
@app.route('/api/user/avatar', methods=['DELETE'])
@token_required
def delete_avatar(current_user_id):
    try:
        # 1. DB에서 현재 URL 가져오기
        with engine.connect() as conn:
            result = conn.execute(text("SELECT avatar_url FROM users WHERE id = :id"), {"id": current_user_id}).first()
            current_avatar_url = result[0] if result else None
        
            if not current_avatar_url:
                return jsonify({'message': '삭제할 프로필 사진이 없습니다.'}), 404
        
            # 2. Storage에서 파일 삭제
            try:
                path_to_remove = current_avatar_url.split('/avatars/')[-1]
                supabase.storage.from_('avatars').remove([path_to_remove])
            except Exception as e:
                print(f"Could not delete file from storage: {e}")
            
            # 3. DB에서 URL 제거
            conn.execute(text("UPDATE users SET avatar_url = NULL WHERE id = :id"), {"id": current_user_id})
            conn.commit()
            
        return jsonify({'avatar_url': None}), 200
    except Exception as e:
        print(f"Error in delete_avatar: {e}")
        return jsonify({'message': '사진 삭제 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 8. 특정 게시글의 댓글 목록 조회 API
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    try:
        query = text("""
            SELECT c.*, u.nickname, u.avatar_url 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = :post_id
            ORDER BY c.created_at DESC
        """)
        with engine.connect() as conn:
            result = conn.execute(query, {"post_id": post_id}).fetchall()
        
        # 'users' 객체 형태로 중첩시키기 (프론트엔드 호환용)
        comments_data = []
        for row in result:
            comment = row._asdict()
            comment['users'] = {
                'nickname': comment.pop('nickname'),
                'avatar_url': comment.pop('avatar_url')
            }
            comments_data.append(comment)
            
        return jsonify(comments_data)
    except Exception as e:
        return jsonify({"message": "댓글을 불러오는 데 실패했습니다.", "details": str(e)}), 500

# 9. 새 댓글 작성 API
@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user_id, post_id):
    data = request.get_json()
    content = data.get('content')
    if not content or len(content) > 500:
        return jsonify({'message': '댓글 내용을 확인해주세요.'}), 400
    try:
        with engine.connect() as conn:
            query = text("""
                INSERT INTO comments (content, user_id, post_id) 
                VALUES (:content, :user_id, :post_id)
                RETURNING id;
            """)
            result = conn.execute(query, {
                "content": content, "user_id": current_user_id, "post_id": post_id
            }).first()
            new_comment_id = result[0]
            conn.commit()

            # 방금 만든 댓글 정보 반환
            detail_query = text("""
                SELECT c.*, u.nickname, u.avatar_url 
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = :comment_id
            """)
            new_comment_result = conn.execute(detail_query, {"comment_id": new_comment_id}).first()
            
            # 'users' 객체 형태로 중첩
            new_comment_data = new_comment_result._asdict()
            new_comment_data['users'] = {
                'nickname': new_comment_data.pop('nickname'),
                'avatar_url': new_comment_data.pop('avatar_url')
            }
            return jsonify(new_comment_data), 201
            
    except Exception as e:
        return jsonify({'message': '댓글 작성 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 10. 댓글 삭제 API
@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user_id, comment_id):
    try:
        with engine.connect() as conn:
            comment_check = conn.execute(text("SELECT user_id FROM comments WHERE id = :id"), {"id": comment_id}).first()
            if not comment_check:
                return jsonify({'message': '댓글을 찾을 수 없습니다.'}), 404
            if comment_check[0] != current_user_id:
                return jsonify({'message': '삭제 권한이 없습니다.'}), 403
            
            conn.execute(text("DELETE FROM comments WHERE id = :id"), {"id": comment_id})
            conn.commit()
        return jsonify({'message': '댓글이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'message': '댓글 삭제 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 11. 댓글 수정 API
@app.route('/api/comments/<int:comment_id>', methods=['PUT'])
@token_required
def update_comment(current_user_id, comment_id):
    data = request.get_json()
    content = data.get('content')
    if not content or len(content) > 500:
        return jsonify({'message': '댓글 내용을 확인해주세요.'}), 400
    try:
        with engine.connect() as conn:
            comment_check = conn.execute(text("SELECT user_id FROM comments WHERE id = :id"), {"id": comment_id}).first()
            if not comment_check:
                return jsonify({'message': '댓글을 찾을 수 없습니다.'}), 404
            if comment_check[0] != current_user_id:
                return jsonify({'message': '수정 권한이 없습니다.'}), 403

            conn.execute(text("UPDATE comments SET content = :content WHERE id = :id"), 
                         {"content": content, "id": comment_id})
            conn.commit()

            # (상세 조회 쿼리를 재사용하여 수정된 댓글 정보 반환)
            detail_query = text("""
                SELECT c.*, u.nickname, u.avatar_url 
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = :comment_id
            """)
            updated_comment_result = conn.execute(detail_query, {"comment_id": comment_id}).first()
            updated_comment_data = updated_comment_result._asdict()
            updated_comment_data['users'] = {
                'nickname': updated_comment_data.pop('nickname'),
                'avatar_url': updated_comment_data.pop('avatar_url')
            }
            return jsonify(updated_comment_data), 200
            
    except Exception as e:
        return jsonify({'message': '댓글 수정 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 13. 좋아요 누르기 API
@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@token_required
def add_like(current_user_id, post_id):
    try:
        with engine.connect() as conn:
            conn.execute(text("INSERT INTO likes (user_id, post_id) VALUES (:user_id, :post_id)"), 
                         {"user_id": current_user_id, "post_id": post_id})
            conn.commit()
        return jsonify({'message': '좋아요가 추가되었습니다.'}), 201
    except Exception as e:
        return jsonify({'message': '이미 좋아요를 눌렀거나 오류가 발생했습니다.', 'error': str(e)}), 409

# 14. 좋아요 취소하기 API
@app.route('/api/posts/<int:post_id>/like', methods=['DELETE'])
@token_required
def remove_like(current_user_id, post_id):
    try:
        with engine.connect() as conn:
            result = conn.execute(text("DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id"), 
                                  {"user_id": current_user_id, "post_id": post_id})
            conn.commit()
            if result.rowcount == 0:
                return jsonify({'message': '좋아요 기록을 찾을 수 없습니다.'}), 404
        return jsonify({'message': '좋아요가 취소되었습니다.'}), 200
    except Exception as e:
        return jsonify({'message': '좋아요 취소 중 오류가 발생했습니다.', 'error': str(e)}), 500

# 15. 내가 좋아요 누른 게시글 ID 목록 API
@app.route('/api/user/my-likes', methods=['GET'])
@token_required
def get_my_likes(current_user_id):
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT post_id FROM likes WHERE user_id = :user_id"), 
                                  {"user_id": current_user_id}).fetchall()
        liked_post_ids = [row[0] for row in result]
        return jsonify(liked_post_ids)
    except Exception as e:
        return jsonify({"message": "좋아요 목록을 불러오는 데 실패했습니다.", "details": str(e)}), 500

# 13. (신규) 게시글 본문 이미지 업로드 API (Storage는 Supabase)
@app.route('/api/posts/image-upload', methods=['POST'])
@token_required
def upload_post_image(current_user_id):
    if 'image' not in request.files:
        return jsonify({'message': '이미지 파일이 전송되지 않았습니다.'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': '선택된 파일이 없습니다.'}), 400
    try:
        file_ext = os.path.splitext(file.filename)[1]
        file_path = f"{current_user_id}/{uuid.uuid4()}{file_ext}"

        # (관리자 권한으로 Storage에 업로드)
        file_data = file.read()
        supabase.storage.from_('post_images').upload(
            path=file_path, file=file_data, file_options={'content-type': file.content_type}
        )
        public_url = supabase.storage.from_('post_images').get_public_url(file_path)
        return jsonify({'image_url': public_url}), 200
    except Exception as e:
        print(f"Error in upload_post_image: {e}")
        return jsonify({'message': '이미지 업로드 중 오류가 발생했습니다.', 'error': str(e)}), 500
    
# 14. (신규) '내가 쓴 글' 목록 조회 API (로그인 필요)
@app.route('/api/user/my-posts', methods=['GET'])
@token_required
def get_my_posts(current_user_id):
    try:
        # get_posts와 동일한 SQL 쿼리지만, WHERE p.user_id = :user_id 조건만 추가합니다.
        query = text("""
            SELECT
                p.id, p.created_at, p.title, p.content, p.user_id, p.image_url,
                u.nickname AS author_nickname,
                COUNT(l.post_id) AS like_count,
                COUNT(*) OVER() as total_count
            FROM posts AS p
            JOIN users AS u ON p.user_id = u.id
            LEFT JOIN likes AS l ON p.id = l.post_id
            WHERE p.user_id = :current_user_id -- 이 사용자가 쓴 글만 필터링
            GROUP BY p.id, u.nickname
            ORDER BY p.created_at DESC;
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"current_user_id": current_user_id}).fetchall()
        
        posts_data = [row._asdict() for row in result]
        
        # '좋아요' 기능과 달리, 이 API는 페이지네이션 없이 모든 글을 반환합니다.
        # (추후 페이지네이션을 추가할 수도 있습니다.)
        return jsonify({
            'posts': posts_data,
            'total_count': len(posts_data),
            'page': 1,
            'limit': len(posts_data)
        })

    except Exception as e:
        print(f"Error in get_my_posts: {e}")
        return jsonify({"message": "내 게시글을 불러오는 데 실패했습니다.", "details": str(e)}), 500

# 15. (신규) '내가 쓴 댓글' 목록 조회 API (로그인 필요)
@app.route('/api/user/my-comments', methods=['GET'])
@token_required
def get_my_comments(current_user_id):
    try:
        # comments 테이블을 기준으로 posts 테이블을 조인합니다.
        query = text("""
            SELECT 
                c.id, 
                c.created_at, 
                c.content, 
                c.post_id, 
                p.title AS post_title
            FROM comments AS c
            JOIN posts AS p ON c.post_id = p.id
            WHERE c.user_id = :current_user_id
            ORDER BY c.created_at DESC;
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"current_user_id": current_user_id}).fetchall()
        
        comments_data = [row._asdict() for row in result]
        
        return jsonify(comments_data)

    except Exception as e:
        print(f"Error in get_my_comments: {e}")
        return jsonify({"message": "내 댓글을 불러오는 데 실패했습니다.", "details": str(e)}), 500
    
# 16. (신규) '내가 좋아요 누른 글' 목록 조회 API (로그인 필요)
@app.route('/api/user/my-likes-posts', methods=['GET'])
@token_required
def get_my_liked_posts(current_user_id):
    try:
        # likes 테이블을 기준으로 JOIN하여 '좋아요 누른 글' 목록을 가져옵니다.
        query = text("""
            SELECT
                p.id, p.created_at, p.title, p.content, p.user_id, p.image_url,
                u.nickname AS author_nickname,
                (SELECT COUNT(*) FROM likes l_count WHERE l_count.post_id = p.id) AS like_count,
                COUNT(*) OVER() as total_count
            FROM likes AS l
            JOIN posts AS p ON l.post_id = p.id
            JOIN users AS u ON p.user_id = u.id
            WHERE l.user_id = :current_user_id
            GROUP BY p.id, u.nickname
            ORDER BY p.created_at DESC;
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query, {"current_user_id": current_user_id}).fetchall()
        
        posts_data = [row._asdict() for row in result]
        
        return jsonify({
            'posts': posts_data,
            'total_count': len(posts_data),
            'page': 1,
            'limit': len(posts_data)
        })

    except Exception as e:
        print(f"Error in get_my_liked_posts: {e}")
        return jsonify({"message": "좋아요한 게시글을 불러오는 데 실패했습니다.", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)