import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/posts');
      setPosts(response.data);
    } catch (error) {
      toast.error("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    // 👇 card div가 전체를 감싸도록 변경합니다.
    <div className="card">
      <div className="main-header">
        <h1>최근 게시글</h1>
        <Link to="/write" className="button-link primary">글쓰기</Link>
      </div>
      {/* hr 태그는 card 내부에서 사용하는 것이 더 자연스럽습니다. */}
      <hr />
      {isLoading ? <LoadingSpinner /> : <PostList posts={posts} />}
    </div>
  );
};

export default HomePage;