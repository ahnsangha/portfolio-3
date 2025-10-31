import React from 'react';
import { Link } from 'react-router-dom'; // Link를 불러옵니다.

const PostList = ({ posts }) => {
  return (
    <div className="post-list-container">
      <div className="post-list">
        {posts.length === 0 ? (
          <p>게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-item">
              {/* 제목을 Link 태그로 감싸줍니다. */}
              <Link to={`/post/${post.id}`} className="post-title-link">
                <h3 className="post-title">{post.title}</h3>
              </Link>
              <div className="post-meta">
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span> | </span>
                <span>{post.author_email}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PostList;