import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)
CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


@app.route("/")
def hello_world():
    return jsonify({"message": "Hello from the Python backend server!"})


# (전체 목록 조회) - 기존 코드
@app.route("/api/posts", methods=['GET'])
def get_posts():
    # 'Authorization' 헤더 검사 로직을 모두 제거합니다.
    # 이제 누구나 이 함수를 호출할 수 있습니다.
    try:
        response = supabase.rpc('get_all_posts_with_author').execute()
        return jsonify(response.data)
    except Exception as e:
        # 혹시 모를 서버 오류에 대비한 예외 처리
        return jsonify({"message": "데이터를 불러오는 데 실패했습니다.", "details": str(e)}), 500

# (생성) - 기존 코드
@app.route("/api/posts", methods=['POST'])
def create_post():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Authorization header is missing or invalid"}), 401
    
    jwt_token = auth_header.split(" ")[1]
    
    try:
        # Supabase에 토큰을 직접 전달하여 사용자 정보를 가져옵니다.
        # 이것이 가장 안정적인 방법입니다.
        user_response = supabase.auth.get_user(jwt_token)
        user = user_response.user
        
        if not user:
            return jsonify({"message": "Invalid token or user not found"}), 401

        # 요청 본문에서 데이터를 가져옵니다.
        data = request.get_json()
        if not data or not data.get('title') or not data.get('content'):
            return jsonify({"message": "Title and content are required"}), 400
        
        # 실제 사용자 ID를 사용하여 데이터를 삽입합니다.
        response = supabase.table('posts').insert({
            'title': data.get('title'),
            'content': data.get('content'),
            'user_id': user.id  # 인증된 사용자의 실제 ID
        }).execute()

        # 성공적으로 삽입된 데이터를 반환합니다.
        return jsonify(response.data), 201

    except Exception as e:
        # 오류 발생 시 더 자세한 정보를 반환합니다.
        return jsonify({"message": "An error occurred", "details": str(e)}), 500

# (상세 조회) - ID로 특정 게시글 하나만 조회
@app.route("/api/posts/<int:post_id>", methods=['GET'])
def get_post_by_id(post_id):
    """
    ID에 해당하는 특정 게시글 하나를 조회합니다.
    """
    response = supabase.table('posts').select("*").eq('id', post_id).single().execute()
    return jsonify(response.data)

# (수정) - ID로 특정 게시글 수정
@app.route("/api/posts/<int:post_id>", methods=['PUT'])
def update_post(post_id):
    """
    ID에 해당하는 게시글의 제목과 내용을 수정합니다.
    """
    data = request.get_json()
    response = supabase.table('posts').update({
        'title': data.get('title'),
        'content': data.get('content')
    }).eq('id', post_id).execute()
    return jsonify(response.data)

# (삭제) - ID로 특정 게시글 삭제
@app.route("/api/posts/<int:post_id>", methods=['DELETE'])
def delete_post(post_id):
    """
    ID에 해당하는 게시글을 삭제합니다.
    """
    response = supabase.table('posts').delete().eq('id', post_id).execute()
    return jsonify(response.data)


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=4000)