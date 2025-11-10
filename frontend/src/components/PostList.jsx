import React from 'react';
import { Link } from 'react-router-dom';

const PostList = ({ posts, userLikes, onLikeToggle }) => {

  // 👇 1. 이 함수를 수정합니다.
  const stripHtmlAndTruncate = (html) => {
    if (!html) return "";
    
    // 1-1. 정규식(Regex)을 사용해 모든 HTML 태그를 제거합니다.
    const plainText = html.replace(/<[^>]+>/g, '');
    
    // 1-2. 태그가 제거된 순수 텍스트를 기준으로 100자로 자릅니다.
    return plainText.length > 100 
      ? plainText.substring(0, 100) + "..." 
      : plainText;
  };

  return (
    <div className="post-list-container">
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        posts.map((post) => {
          const isLiked = userLikes.has(post.id);

          return (
            <div key={post.id} className="post-item">
              <div className="post-item-content">
                <Link to={`/post/${post.id}`} className="post-title-link">
                  <h3 className="post-title">{post.title}</h3>
                  {/* 👇 2. 수정한 함수를 여기서 사용합니다. */}
                  <p className="post-preview">{stripHtmlAndTruncate(post.content)}</p>
                </Link>
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