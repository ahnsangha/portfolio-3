import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import CommentList from '../components/CommentList';
import CommentForm from '../components/CommentForm';

// App.jsx로부터 user 정보를 props로 받습니다.
const PostDetailPage = ({ user }) => {
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [comments, setComments] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`http://localhost:4000/api/posts/${id}`);
        setPost(response.data);
        // ...
      } catch (error) {
        toast.error("게시글을 불러오지 못했습니다.");
      }
    };
    fetchPost();
  }, [id]);

  // 삭제 버튼 클릭 시 실행될 함수
  const handleDelete = async () => {
    if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      const promise = api.delete(`http://localhost:4000/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.promise(promise, {
        loading: '삭제 중...',
        success: () => {
          navigate('/');
          return '게시글이 삭제되었습니다.';
        },
        error: '삭제에 실패했습니다.',
      });
    }
  };

  // 수정 내용 저장 시 실행될 함수
  const handleUpdate = async () => {
    try {
      const response = await api.put(`http://localhost:4000/api/posts/${id}`, 
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

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          api.get(`http://localhost:4000/api/posts/${id}`),
          api.get(`http://localhost:4000/api/posts/${id}/comments`)
        ]);
        
        setPost(postRes.data);
        setComments(commentsRes.data);
        setEditTitle(postRes.data.title);
        setEditContent(postRes.data.content);
      } catch (error) {
        toast.error("데이터를 불러오지 못했습니다.");
        navigate('/posts');
      }
    };
    fetchPostAndComments();
  }, [id, navigate]);
  
  const handleCommentCreated = (newComment) => {
    setComments([newComment, ...comments]);
  };

  const handleCommentDeleted = (deletedCommentId) => {
    setComments(comments.filter(comment => comment.id !== deletedCommentId));
  };

  const handleCommentUpdated = (updatedComment) => {
    setComments(comments.map(c => 
      c.id === updatedComment.id ? updatedComment : c
    ));
  };
  
  if (!post) return <LoadingSpinner />;

  const isAuthor = user && Number(user.user_id) === post.user_id;

  return (
    // 👇 전체를 card div로 감싸줍니다.
    <div className="card post-detail">
      {isEditing ? (
        <div className="edit-form">
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="15" />
        </div>
      ) : (
        <>
          <h1>{post.title}</h1>
          <div className="post-detail-meta">
            <span>작성자: {post.author_email}</span>
            <span> | </span>
            <span>작성일: {new Date(post.created_at).toLocaleString()}</span>
          </div>
          <hr /> {/* 제목과 본문 사이에 구분선 추가 */}
          <div className="post-content">
            {/* p 태그 대신 div로 변경하여 여러 문단을 처리할 수 있게 함 */}
            <div>{post.content}</div>
          </div>
        </>
      )}

      <div className="button-group">
        {/* 👇 버튼 클래스 수정 및 추가 */}
        {isAuthor && isEditing ? (
            <>
              <button onClick={handleUpdate} className="primary">저장</button>
              <button onClick={() => setIsEditing(false)}>취소</button>
            </>
        ) : (
          <Link to="/posts" className="button-link">목록</Link>
        )}
        
        {isAuthor && !isEditing && (
          <>
            <button onClick={() => setIsEditing(true)}>수정</button>
            <button onClick={handleDelete}>삭제</button>
          </>
        )}
      </div>
      {user && (
        <CommentForm 
          user={user} 
          postId={id} 
          onCommentCreated={handleCommentCreated} 
        />
      )}

      <CommentList 
        user={user} 
        comments={comments} 
        onCommentDeleted={handleCommentDeleted}
        onCommentUpdated={handleCommentUpdated}
      />
    </div>
  );
};

export default PostDetailPage;