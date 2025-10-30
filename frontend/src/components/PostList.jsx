import React from 'react';

// HomePage로부터 posts 데이터를 props로 받습니다.
const PostList = ({ posts }) => {
  return (
    <div className="post-list-container">
      <h2>최근 게시글</h2>
      <div className="post-list">
        {posts.length === 0 ? (
          <p>게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-item">
              <h3 className="post-title">{post.title}</h3>
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