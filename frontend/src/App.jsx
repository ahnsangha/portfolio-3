import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

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
            />
          }
        />
        {/* 5. PostDetailPage에 user 정보를 props로 전달합니다. */}
        <Route path="/post/:id" element={<PostDetailPage user={user} />} />
      </Routes>
    </div>
  );
}

export default App;