import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner'; // 1. LoadingSpinner 임포트

// 2. isLoadingAuth prop을 받습니다.
const ProtectedRoute = ({ user, isLoadingAuth }) => {
  
  // 3. 인증 상태를 확인 중이면, 로딩 스피너를 표시
  if (isLoadingAuth) {
    return <LoadingSpinner />;
  }

  // 4. 확인이 끝났는데 user가 없으면, 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 5. 확인이 끝났고 user가 있으면, 자식 페이지를 표시
  return <Outlet />;
};

export default ProtectedRoute;