import React from 'react';
import CommentItem from './CommentItem'; // 1. CommentItem 불러오기

// 2. onCommentUpdated prop 추가
const CommentList = ({ user, comments, onCommentDeleted, onCommentUpdated }) => {
  return (
    <div className="card comment-list-card">
      <h3>댓글 ({comments.length}개)</h3>
      <hr />
      <div className="comment-list">
        {comments.length === 0 ? (
          <p>아직 댓글이 없습니다.</p>
        ) : (
          // 3. CommentItem을 맵핑하여 렌더링
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              user={user}
              comment={comment}
              onCommentDeleted={onCommentDeleted}
              onCommentUpdated={onCommentUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentList;