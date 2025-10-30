import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link 불러오기
import axios from 'axios';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import AuthPage from './AuthPage';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/Sidebar';

const HomePage = ({ user, onLogin, onLogout, theme, toggleTheme }) => {
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
      <Sidebar user={user} onLogout={onLogout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} theme={theme} toggleTheme={toggleTheme} />

      <main className="main-content">
        <div className="main-header">
          <h1>연습용 커뮤니티</h1>
          {/* 👇 CreatePost 컴포넌트 대신 글쓰기 버튼으로 교체 */}
          <Link to="/write" className="write-post-button">글쓰기</Link>
        </div>
        <hr />
        {isLoading ? <LoadingSpinner /> : <PostList posts={posts} />}
      </main>
    </div>
  );
};

export default HomePage;