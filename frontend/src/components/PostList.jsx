import React from 'react';
import { Link } from 'react-router-dom';

const PostList = ({ posts }) => {
  // 본문 내용을 100자로 자르고 '...'을 붙이는 헬퍼 함수
  const truncate = (str) => {
    return str.length > 100 ? str.substring(0, 100) + "..." : str;
  };

  return (
    <div className="post-list-container">
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post-item">
            <div className="post-item-content">
              <Link to={`/post/${post.id}`} className="post-title-link">
                <h3 className="post-title">{post.title}</h3>
                {/* 👇 본문 미리보기 추가 */}
                <p className="post-preview">{truncate(post.content)}</p>
              </Link>
            </div>
            <div className="post-meta">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span> | </span>
              <span>{post.author_nickname}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PostList;