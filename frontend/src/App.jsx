import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import WritePage from './pages/WritePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const nickname = localStorage.getItem('nickname');
    const userId = localStorage.getItem('user_id'); // 1. user_id 가져오기
    if (token && nickname && userId) {
      setUser({ token, nickname, user_id: userId }); // 2. user 상태에 저장
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('nickname', userData.nickname);
    localStorage.setItem('user_id', userData.user_id); // 3. user_id 저장
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    localStorage.removeItem('user_id'); // 4. user_id 삭제
    setUser(null);
  };

  // 닉네임 변경 시 user 상태와 localStorage를 업데이트하는 함수
  const handleProfileUpdate = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('nickname', updatedUser.nickname);
  };

  if (!user) {
    return (
      <div className={`App auth-mode`}>
        <Toaster position="top-center" />
        <AuthPage onLogin={handleLogin} />
      </div>
    );
  }

  // user가 있으면(로그인 했으면) Layout으로 감싸진 페이지들을 보여줍니다.
  return (
    <div className="App">
      <Toaster position="top-center" />
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/post/:id" element={<PostDetailPage user={user} />} />
          <Route path="/write" element={<WritePage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} onProfileUpdate={handleProfileUpdate} />} 
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;