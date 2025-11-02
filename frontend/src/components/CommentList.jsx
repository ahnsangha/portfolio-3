import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// 1. user와 onCommentDeleted props를 받습니다.
const CommentList = ({ user, comments, onCommentDeleted }) => {

  // 2. 삭제 버튼 클릭 시 실행될 함수
  const handleDelete = (commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    const promise = axios.delete(
      `http://localhost:4000/api/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '댓글을 삭제하는 중...',
      success: () => {
        onCommentDeleted(commentId); // 3. 부모(PostDetailPage)의 상태 업데이트
        return '댓글이 삭제되었습니다.';
      },
      error: (error) => error.response?.data?.message || '삭제에 실패했습니다.',
    });
  };

  return (
    <div className="card comment-list-card">
      <h3>댓글 ({comments.length}개)</h3>
      <hr />
      <div className="comment-list">
        {comments.length === 0 ? (
          <p>아직 댓글이 없습니다.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <img
                src={comment.users.avatar_url || '/default_avatar_placeholder.png'}
                alt={comment.users.nickname}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.users.nickname}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p>{comment.content}</p>
              </div>
              {/* 4. 로그인한 사용자가 댓글 작성자일 경우에만 삭제 버튼 표시 */}
              {user && user.user_id === comment.user_id && (
                <button 
                  onClick={() => handleDelete(comment.id)} 
                  className="comment-delete-button"
                >
                  삭제
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentList;