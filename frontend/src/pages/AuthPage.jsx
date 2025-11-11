import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const AuthPage = ({ onLogin, user }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState({}); // 1. 오류 메시지 상태 추가

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // 2. 이전 오류 초기화

    // --- 3. 클라이언트 측 유효성 검사 시작 ---
    const newErrors = {};
    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "유효한 이메일 형식이 아닙니다.";
    }
    
    if (isRegister) {
      if (nickname.length < 2) {
        newErrors.nickname = "닉네임은 2자 이상 입력해주세요.";
      }
      if (password.length < 8) {
        newErrors.password = "비밀번호는 8자 이상 입력해주세요.";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      }
    }

    // 4. 유효성 검사 실패 시, 오류 메시지를 표시하고 전송 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // --- 유효성 검사 끝 ---

    const url = isRegister ? '/api/register' : '/api/login';
    const payload = isRegister ? { email, password, nickname } : { email, password };
    
    const promise = api.post(url, payload);

    toast.promise(promise, {
      loading: '처리 중...',
      success: (response) => {
        if (isRegister) {
          setIsRegister(false);
          setNickname('');
          setConfirmPassword('');
          return '회원가입 성공! 이제 로그인해주세요.';
        } else {
          onLogin(response.data);
          return '로그인 성공!';
        }
      },
      error: (error) => {
        const serverMessage = error.response?.data?.message || '오류가 발생했습니다.';
        // 5. 서버에서 받은 오류를 상단에 표시
        setErrors({ server: serverMessage });
        return serverMessage; // 토스트 알림에도 표시
      },
    });
  };

  return (
    <div className="auth-page">
      <div className="card">
        <h1>연습용 커뮤니티</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{isRegister ? '회원가입' : '로그인'}</h2>
          
          {/* 6. 서버 오류 메시지 표시 영역 */}
          {errors.server && (
            <span className="error-message server-error">{errors.server}</span>
          )}

          {isRegister && (
            <div className="form-group">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                type="text"
                placeholder="2자 이상"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              {errors.nickname && <span className="error-message">{errors.nickname}</span>}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder={isRegister ? "8자 이상" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
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