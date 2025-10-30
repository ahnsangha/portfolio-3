import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// App.jsx로부터 user 정보를 props로 받습니다.
const PostDetailPage = ({ user }) => {
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/posts/${id}`);
        setPost(response.data);
        setEditTitle(response.data.title);
        setEditContent(response.data.content);
      } catch (error) {
        console.error("게시글 상세 정보 로딩 중 오류:", error);
      }
    };
    fetchPost();
  }, [id]);

  // 삭제 버튼 클릭 시 실행될 함수
  const handleDelete = async () => {
    if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      try {
        await axios.delete(`http://localhost:4000/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert("게시글이 삭제되었습니다.");
        navigate('/'); // 삭제 후 홈으로 이동
      } catch (error) {
        alert("삭제에 실패했습니다. 권한을 확인해주세요.");
      }
    }
  };

  // 수정 내용 저장 시 실행될 함수
  const handleUpdate = async () => {
    try {
      const response = await axios.put(`http://localhost:4000/api/posts/${id}`, 
        { title: editTitle, content: editContent },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPost({ ...post, title: editTitle, content: editContent });
      setIsEditing(false); // 수정 모드 종료
      alert("게시글이 수정되었습니다.");
    } catch (error) {
       alert("수정에 실패했습니다. 권한을 확인해주세요.");
    }
  };
  
  if (!post) return <div>게시글을 불러오는 중...</div>;

  // 현재 로그인한 사용자가 글 작성자인지 확인
  const isAuthor = user && Number(user.user_id) === post.user_id;

  return (
    <div className="post-detail">
      {isEditing ? (
        <div className="edit-form">
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="10" />
        </div>
      ) : (
        <>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>작성자: {post.author_email}</span>
            <span> | </span>
            <span>작성일: {new Date(post.created_at).toLocaleString()}</span>
          </div>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
        </>
      )}

      <div className="button-group">
        <Link to="/" className="back-to-list-button">목록</Link>
        {/* 글 작성자에게만 수정/삭제 버튼이 보입니다. */}
        {isAuthor && (
          isEditing ? (
            <>
              <button onClick={handleUpdate}>저장</button>
              <button onClick={() => setIsEditing(false)}>취소</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)}>수정</button>
              <button onClick={handleDelete}>삭제</button>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;