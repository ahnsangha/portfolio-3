import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import WritePage from './pages/WritePage'
import PostDetailPage from './pages/PostDetailPage';
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
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('user_id'); // 1. user_id 가져오기
    if (token && email && userId) {
      setUser({ token, email, user_id: userId }); // 2. user 상태에 저장
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('user_id', userData.user_id); // 3. user_id 저장
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('user_id'); // 4. user_id 삭제
    setUser(null);
  };

  return (
    <div className="App">
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
              theme={theme} // theme과 toggleTheme 함수를 props로 전달
              toggleTheme={toggleTheme}
            />
          }
        />
        <Route path="/post/:id" element={<PostDetailPage user={user} />} />
        
        <Route 
          path="/write" 
          element={
            user ? <WritePage user={user} /> : <Navigate to="/" />
          }
        />
      </Routes>
    </div>
  );
}

export default App;