import { useState } from 'react';
import axios from 'axios';

const AuthPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? '/api/register' : '/api/login';
    try {
      const response = await axios.post(`http://localhost:4000${url}`, { email, password });
      if (isRegister) {
        alert('회원가입 성공! 이제 로그인해주세요.');
        setIsRegister(false); // 로그인 폼으로 전환
      } else {
        onLogin(response.data); // App.jsx의 handleLogin 호출
      }
    } catch (error) {
      alert(error.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  return (
    <div className="auth-page">
      <h1>연습용 커뮤니티</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isRegister ? '회원가입' : '로그인'}</h2>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isRegister ? '회원가입' : '로그인'}</button>
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-auth">
          {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </p>
      </form>
    </div>
  );
};

export default AuthPage;