import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? '/api/register' : '/api/login';
    const payload = isRegister ? { email, password, nickname } : { email, password };

    // 👇 1. axios 요청을 'promise' 변수에 먼저 할당합니다.
    const promise = axios.post(`http://localhost:4000${url}`, payload);

    // 👇 2. 이제 정의된 'promise' 변수를 사용합니다.
    toast.promise(promise, {
      loading: '처리 중...',
      success: (response) => {
        if (isRegister) {
          setIsRegister(false);
          setNickname(''); // 회원가입 후 닉네임 필드 초기화
          return '회원가입 성공! 이제 로그인해주세요.';
        } else {
          onLogin(response.data);
          return '로그인 성공!';
        }
      },
      error: (error) => error.response?.data?.message || '오류가 발생했습니다.',
    });
  };

  return (
    <div className="auth-page">
      <div className="card">
        <h1>연습용 커뮤_니티</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isRegister ? '회원가입' : '로그인'}</h2>
          {isRegister && (
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          )}
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
          <button type="submit" className="primary">{isRegister ? '회원가입' : '로그인'}</button>
          <p onClick={() => setIsRegister(!isRegister)} className="toggle-auth">
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;