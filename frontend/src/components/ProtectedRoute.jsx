import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ user }) => {
  if (!user) {
    // 1. 유저 정보가 없으면(로그인 안했으면) /login 페이지로 보냅니다.
    return <Navigate to="/login" replace />;
  }

  // 2. 유저 정보가 있으면 자식 페이지(예: WritePage, ProfilePage)를 보여줍니다.
  return <Outlet />;
};

export default ProtectedRoute;