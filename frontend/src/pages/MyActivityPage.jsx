import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const MyActivityPage = () => {
  return (
    <div className="card">
      <div className="main-header">
        <h1>내 활동</h1>
      </div>
      <hr />
      
      {/* 1. 탭 네비게이션 메뉴 */}
      <nav className="tab-nav">
        <NavLink to="/my-activity/posts" end>내가 쓴 글</NavLink>
        <NavLink to="/my-activity/comments">내가 쓴 댓글</NavLink>
        <NavLink to="/my-activity/likes">좋아요 누른 글</NavLink>
      </nav>

      {/* 2. 탭 내용이 렌더링될 영역 */}
      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MyActivityPage;