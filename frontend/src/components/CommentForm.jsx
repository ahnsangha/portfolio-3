import React from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const CommentForm = ({ user, postId, onCommentCreated }) => {
  const [newComment, setNewComment] = React.useState("");

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("댓글 내용을 입력해주세요.");
      return;
    }

    const promise = axios.post(
      `http://localhost:4000/api/posts/${postId}/comments`,
      { content: newComment },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '댓글을 작성 중입니다...',
      success: (response) => {
        onCommentCreated(response.data); // 1. 새 댓글을 부모(PostDetailPage)로 전달
        setNewComment(""); // 2. 입력창 비우기
        return '댓글이 성공적으로 작성되었습니다!';
      },
      error: (error) => error.response?.data?.message || '댓글 작성에 실패했습니다.',
    });
  };

  return (
    <div className="card comment-form-card">
      <form onSubmit={handleCommentSubmit}>
        <div className="form-group">
          <label htmlFor="comment">댓글 작성</label>
          <textarea
            id="comment"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="4"
            maxLength={500}
          />
          <div className="char-counter">
            {newComment.length} / 500
          </div>
        </div>
        <button type="submit" className="primary">댓글 작성</button>
      </form>
    </div>
  );
};

export default CommentForm;