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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/api/posts/${id}`);
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
      const promise = api.delete(`/api/posts/${id}`, {
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
      const response = await api.put(`/api/posts/${id}`, 
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
    const fetchPostData = async () => {
      try {
        // 3개의 요청을 동시에 보냅니다.
        const postPromise = api.get(`/api/posts/${id}`);
        const commentsPromise = api.get(`/api/posts/${id}/comments`);
        const likesPromise = user
          ? api.get('/api/user/my-likes', { headers: { Authorization: `Bearer ${user.token}` } })
          : Promise.resolve({ data: [] }); // 로그인 안했으면 빈 배열

        const [postRes, commentsRes, likesRes] = await Promise.all([postPromise, commentsPromise, likesPromise]);

        // 게시글 정보 설정
        setPost(postRes.data);
        setEditTitle(postRes.data.title);
        setEditContent(postRes.data.content);

        // 댓글 정보 설정
        setComments(commentsRes.data);

        // '좋아요' 정보 설정
        setLikeCount(postRes.data.like_count); // DB에서 가져온 총 '좋아요' 수
        const userLikes = new Set(likesRes.data);
        setIsLiked(userLikes.has(postRes.data.id)); // 내가 '좋아요' 눌렀는지 여부

      } catch (error) {
        toast.error("데이터를 불러오지 못했습니다.");
        navigate('/posts');
      }
    };
    fetchPostData();
  }, [id, navigate, user]);
  
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

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    try {
      if (isLiked) {
        // --- 좋아요 취소 ---
        await api.delete(`/api/posts/${post.id}/like`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setIsLiked(false);
        setLikeCount(prevCount => prevCount - 1);
      } else {
        // --- 좋아요 누르기 ---
        await api.post(`/api/posts/${post.id}/like`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setIsLiked(true);
        setLikeCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      toast.error("좋아요 처리에 실패했습니다.");
    }
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
          <div className="post-actions-detail">
              <button 
                onClick={handleLikeToggle}
                className={`like-button ${isLiked ? 'liked' : ''}`}
              >
                ❤️ {likeCount}
              </button>
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