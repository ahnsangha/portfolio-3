import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HomePage from './pages/HomePage';
import LoginModal from './components/LoginModal'; // LoginModal 불러오기
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false); // 모달 상태 추가

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setShowLoginModal(false); // 로그인/로그아웃 성공 시 모달 닫기
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      {/* 이제 HomePage는 항상 보입니다. */}
      <HomePage
        session={session}
        onLoginClick={() => setShowLoginModal(true)} // 로그인 모달을 여는 함수 전달
      />
      {/* 로그인 모달 컴포넌트 */}
      <LoginModal
        show={showLoginModal}
        onClose={() => setShowLoginModal(false)} // 모달을 닫는 함수 전달
      />
    </div>
  );
}

export default App;