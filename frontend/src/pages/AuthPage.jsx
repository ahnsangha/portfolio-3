import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const AuthPage = ({ onLogin, user }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 1. 비밀번호 확인 state
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 2. 회원가입 시 비밀번호 일치 여부 확인
    if (isRegister && password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    const url = isRegister ? '/api/register' : '/api/login';
    const payload = isRegister ? { email, password, nickname } : { email, password };
    
    const promise = api.post(`http://localhost:4000${url}`, payload);

    toast.promise(promise, {
      loading: '처리 중...',
      success: (response) => {
        if (isRegister) {
          setIsRegister(false);
          setNickname('');
          setConfirmPassword(''); // 입력창 초기화
          return '회원가입 성공! 이제 로그인해주세요.';
        } else {
          onLogin(response.data);
          return '로그인 성공!';
        }
      },
      // 3. 백엔드에서 보낸 구체적인 오류 메시지가 자동으로 표시됩니다.
      error: (error) => error.response?.data?.message || '오류가 발생했습니다.',
    });
  };

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="auth-page">
      <div className="card">
        <h1>연습용 커뮤니티</h1>
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
          {/* 4. 비밀번호 확인 입력창 추가 */}
          {isRegister && (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          <button type="submit" className="primary">{isRegister ? '회원가입' : '로그인'}</button>
          <p onClick={() => setIsRegister(!isRegister)} className="toggle-auth">
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </p>
        </form>
        <div className="auth-footer">
          <Link to="/">홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;