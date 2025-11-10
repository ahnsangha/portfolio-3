import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import WritePage from './pages/WritePage';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import MyLikesPage from './pages/MyLikesPage';
import MyPostsPage from './pages/MyPostsPage';
import MyCommentsPage from './pages/MyCommentsPage';
import MyActivityPage from './pages/MyActivityPage';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  // 'theme' 상태 추가, 초기값은 localStorage에서 가져오거나 시스템 설정을 따름
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    // 시스템 설정 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // 인증 로딩 상태 추가

  // 테마를 토글하는 함수
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // theme 상태가 바뀔 때마다 <body> 클래스와 localStorage를 업데이트
  useEffect(() => {
    document.body.className = ''; // 기존 클래스 초기화
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 인증 useEffect 수정
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const nickname = localStorage.getItem('nickname');
      const userId = localStorage.getItem('user_id');
      let avatarUrl = localStorage.getItem('avatar_url');
      if (avatarUrl === 'null') avatarUrl = null;

      if (token && nickname && userId) {
        setUser({ token, nickname, user_id: userId, avatar_url: avatarUrl });
      }
    } catch (error) {
      console.error("인증 로드 중 오류 발생:", error);
    } finally {
      setIsLoadingAuth(false); // 확인이 끝나면 로딩 상태를 false로 변경
    }
  }, []); // 빈 배열로, 앱 실행 시 딱 한 번만 실행됨

// handleLogin 함수
const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('nickname', userData.nickname);
    localStorage.setItem('user_id', userData.user_id);
    
    if (userData.avatar_url) {
      localStorage.setItem('avatar_url', userData.avatar_url);
    } else {
      localStorage.removeItem('avatar_url'); // null 대신 제거
    }
    
    setUser(userData);
  };

// handleLogout 함수
const handleLogout = () => {
    // ... (token, nickname, user_id 삭제)
    localStorage.removeItem('avatar_url'); // 로그아웃 시 삭제
    setUser(null);
  };

// handleProfileUpdate 함수
const handleProfileUpdate = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    // 닉네임과 아바타 URL을 모두 업데이트
    if (updatedData.nickname) {
      localStorage.setItem('nickname', updatedUser.nickname);
    }
    if (updatedData.avatar_url) {
      localStorage.setItem('avatar_url', updatedUser.avatar_url);
    }
  };

  // user가 있으면(로그인 했으면) Layout으로 감싸진 페이지들을 보여줍니다.
 return (
    <div className="App">
      <Toaster position="top-center" />
      <Routes>
        {/* Layout에 isLoadingAuth 전달 (선택사항이지만, 나중에 유용할 수 있음) */}
        <Route element={<Layout user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} isLoadingAuth={isLoadingAuth} />}>
          {/* 누구나 접근 가능한 페이지 */}
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/posts" element={<PostListPage user={user} />} />
          <Route path="/post/:id" element={<PostDetailPage user={user} />} />
          
          {/* 로그인해야만 접근 가능한 페이지 (ProtectedRoute로 감싸기) */}
          <Route element={<ProtectedRoute user={user} />}>
            <Route path="/write" element={<WritePage user={user} />} />
            <Route 
            path="/profile" 
            element={<ProfilePage user={user} onProfileUpdate={handleProfileUpdate} onLogout={handleLogout} />} 
           />
            <Route path="/my-posts" element={<MyPostsPage user={user} />} />

          {/* ProtectedRoute에 isLoadingAuth를 전달 */}
          {/* 3개의 경로를 MyActivityPage의 자식 경로로 묶습니다. */}
          <Route element={<ProtectedRoute user={user} isLoadingAuth={isLoadingAuth}/>}>
            <Route path="/write" element={<WritePage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} onProfileUpdate={handleProfileUpdate} onLogout={handleLogout} />} />
            {/*'내 활동' 중첩 라우트 */}
            <Route path="/my-activity" element={<MyActivityPage />}>
              <Route index element={<MyPostsPage user={user} />} /> {/* '/my-activity' (기본 탭) */}  
              <Route path="comments" element={<MyCommentsPage user={user} />} />
              <Route path="likes" element={<MyLikesPage user={user} />} />
            </Route>
          </Route>

          </Route>
        </Route>
        
        {/* B. 사이드바가 없는 로그인/회원가입 페이지 */}
        <Route 
          path="/login" 
          element={
            <div className="auth-mode">
              <AuthPage onLogin={handleLogin} user={user} />
            </div>
          } 
        />
        
        {/* C. 404 페이지 (선택 사항) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;