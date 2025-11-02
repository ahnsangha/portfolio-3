import React from 'react';
import { Link } from 'react-router-dom';

// 1. userLikes와 onLikeToggle props를 받습니다.
const PostList = ({ posts, userLikes, onLikeToggle }) => {
  const truncate = (str) => {
    return str.length > 100 ? str.substring(0, 100) + "..." : str;
  };

  return (
    <div className="post-list-container">
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        posts.map((post) => {
          // 2. 이 게시글에 좋아요를 눌렀는지 확인
          const isLiked = userLikes.has(post.id);

          return (
            <div key={post.id} className="post-item">
              <div className="post-item-content">
                <Link to={`/post/${post.id}`} className="post-title-link">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-preview">{truncate(post.content)}</p>
                </Link>
                {/* 3. 좋아요 버튼 추가 */}
                <div className="post-actions">
                  <button 
                    onClick={() => onLikeToggle(post.id, isLiked)}
                    className={`like-button ${isLiked ? 'liked' : ''}`}
                  >
                    ❤️ {post.like_count}
                  </button>
                </div>
              </div>
              <div className="post-meta">
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span> | </span>
                <span>{post.author_nickname}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PostList;