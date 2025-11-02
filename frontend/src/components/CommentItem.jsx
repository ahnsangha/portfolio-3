import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const CommentItem = ({ user, comment, onCommentDeleted, onCommentUpdated }) => {
  // 1. 수정 모드를 위한 state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // 현재 로그인한 사용자가 이 댓글의 작성자인지 확인
  const isAuthor = user && Number(user.user_id) === comment.user_id;

  // 2. 삭제 핸들러
  const handleDelete = () => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    const promise = api.delete(
      `http://localhost:4000/api/comments/${comment.id}`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    toast.promise(promise, {
      loading: '삭제 중...',
      success: () => {
        onCommentDeleted(comment.id);
        return '댓글이 삭제되었습니다.';
      },
      error: (error) => error.response?.data?.message || '삭제에 실패했습니다.',
    });
  };
  
  // 3. 수정 완료 핸들러
  const handleUpdate = (e) => {
    e.preventDefault();
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    const promise = api.put(
      `http://localhost:4000/api/comments/${comment.id}`,
      { content: editContent },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    toast.promise(promise, {
      loading: '수정 중...',
      success: (response) => {
        onCommentUpdated(response.data); // 부모에게 수정된 댓글 전달
        setIsEditing(false);
        return '댓글이 수정되었습니다.';
      },
      error: (error) => error.response?.data?.message || '수정에 실패했습니다.',
    });
  };

  return (
    <div className="comment-item">
      {comment.users.avatar_url && comment.users.avatar_url !== 'null' ? (
        <img
          src={comment.users.avatar_url}
          alt={comment.users.nickname}
          className="comment-avatar"
        />
      ) : (
        <span className="comment-avatar-placeholder">👤</span>
      )}
      
      {isEditing ? (
        // 4. 수정 모드일 때 폼 렌더링
        <form className="comment-content" onSubmit={handleUpdate}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows="3"
            maxLength={500}
            className="comment-edit-textarea"
          />
          <div className="comment-button-group">
            <button type="submit" className="primary">저장</button>
            <button type="button" onClick={() => setIsEditing(false)}>취소</button>
          </div>
        </form>
      ) : (
        // 5. 일반 모드일 때 내용 렌더링
        <div className="comment-content">
          <div className="comment-header">
            <span className="comment-author">{comment.users.nickname}</span>
            <span className="comment-date">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p>{comment.content}</p>
        </div>
      )}

      {/* 6. 작성자에게만 수정/삭제 버튼 표시 (수정 모드 아닐 때) */}
      {isAuthor && !isEditing && (
        <div className="comment-actions">
          <button onClick={() => setIsEditing(true)} className="comment-edit-button">수정</button>
          <button onClick={handleDelete} className="comment-delete-button">삭제</button>
        </div>
      )}
    </div>
  );
};

export default CommentItem;