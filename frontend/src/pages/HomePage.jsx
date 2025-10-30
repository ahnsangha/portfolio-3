import { useState, useEffect } from 'react';
import axios from 'axios';
import PostList from '../components/PostList';
import CreatePost from '../components/CreatePost';
import AuthPage from './AuthPage'; // 새로 만들 로그인/회원가입 페이지

const HomePage = ({ user, onLogin, onLogout }) => {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("게시글 목록 로딩 중 오류:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async ({ title, content }) => {
    try {
      const response = await axios.post(
        'http://localhost:4000/api/posts',
        { title, content },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // 새 글 작성 성공 시, 목록을 다시 불러옵니다.
      if (response.status === 201) {
        fetchPosts();
      }
    } catch (error) {
      console.error("게시글 작성 중 오류:", error);
      alert('글 작성에 실패했습니다.');
    }
  };

  // user가 없으면 (로그인 안 했으면) AuthPage를 보여줍니다.
  if (!user) {
    return <AuthPage onLogin={onLogin} />;
  }

  // user가 있으면 (로그인 했으면) 메인 페이지를 보여줍니다.
  return (
    <div>
      <div className="header">
        <span>안녕하세요, {user.email}님</span>
        <button onClick={onLogout}>로그아웃</button>
      </div>
      <h1>연습용 커뮤니티</h1>
      <CreatePost handleSubmit={handleCreatePost} />
      <hr />
      <PostList posts={posts} />
    </div>
  );
};

export default HomePage;