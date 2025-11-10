import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MyCommentsPage = ({ user }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyComments = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/user/my-comments', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setComments(response.data);
      } catch (error) {
        toast.error("댓글을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyComments();
  }, [user]);

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="my-comments-list">
          {comments.length === 0 ? (
            <p>작성한 댓글이 없습니다.</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="my-comment-item">
                <p className="my-comment-content">"{comment.content}"</p>
                <div className="my-comment-meta">
                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                  <span> | </span>
                  <Link to={`/post/${comment.post_id}`}>
                    '{comment.post_title}' 게시글
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default MyCommentsPage;