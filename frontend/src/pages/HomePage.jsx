import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import CreatePost from '../components/CreatePost';
import Sidebar from '../components/Sidebar';
import AuthPage from './AuthPage';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = ({ user, onLogin, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true); // 로딩 시작
    try {
      const response = await axios.get('http://localhost:4000/api/posts');
      setPosts(response.data);
    } catch (error) {
      toast.error("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async ({ title, content }) => {
    const promise = axios.post(
      'http://localhost:4000/api/posts',
      { title, content },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: () => {
        fetchPosts(); // 성공 시 목록 새로고침
        return '게시글이 성공적으로 작성되었습니다!';
      },
      error: '글 작성에 실패했습니다.',
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (!user) {
    return <AuthPage onLogin={onLogin} />;
  }

  if (!user) {
    return <AuthPage onLogin={onLogin} />;
  }

  // 로그인하지 않았으면 AuthPage를 보여줍니다.
  if (!user) {
    return <AuthPage onLogin={onLogin} />;
  }

  // 로그인했다면 사이드바 레이아웃을 보여줍니다.
  return (
    <div className="app-container">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <main className="main-content">
        <h1>연습용 커뮤니티</h1>
        <CreatePost handleSubmit={handleCreatePost} />
        <hr />
        {isLoading ? <LoadingSpinner /> : <PostList posts={posts} />}
      </main>
    </div>
  );
};

export default HomePage;