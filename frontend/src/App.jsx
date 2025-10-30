import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // 1. Routes와 Route를 불러옵니다.
import axios from 'axios';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage'; // 2. 상세 페이지를 불러옵니다.
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // 앱이 처음 로드될 때 localStorage에서 토큰을 확인합니다.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email) {
      setUser({ token, email });
    }
  }, []);

  // 로그인 함수
  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.email);
    setUser(userData);
  };

  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  return (
    <div className="App">
      <Routes> {/* 3. Routes로 전체 경로를 감쌉니다. */}
        {/* 4. 경로 정의: "/" 경로는 HomePage를 보여줍니다. */}
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          }
        />
        {/* 5. 경로 정의: "/post/:id" 경로는 PostDetailPage를 보여줍니다. */}
        <Route path="/post/:id" element={<PostDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;