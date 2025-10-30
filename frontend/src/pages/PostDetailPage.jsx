import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const { id } = useParams(); // URL에서 :id 부분을 가져옵니다 (예: /post/1 -> id는 1)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/posts/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error("게시글 상세 정보 로딩 중 오류:", error);
      }
    };
    fetchPost();
  }, [id]); // id가 바뀔 때마다 데이터를 다시 불러옵니다.

  // 데이터 로딩 중이거나 post가 없으면 메시지를 보여줍니다.
  if (!post) {
    return <div>게시글을 불러오는 중...</div>;
  }

  return (
    <div className="post-detail">
      <h1>{post.title}</h1>
      <div className="post-meta">
        <span>작성일: {new Date(post.created_at).toLocaleString()}</span>
        {/* 상세 페이지에서는 작성자 이메일을 보여줄 필요가 없을 수 있습니다. */}
      </div>
      <div className="post-content">
        <p>{post.content}</p>
      </div>
      <Link to="/" className="back-to-list-button">목록으로 돌아가기</Link>
    </div>
  );
};

export default PostDetailPage;