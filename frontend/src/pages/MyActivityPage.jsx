import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const MyActivityPage = () => {
  return (
    <div className="card">
      <div className="main-header">
        <h1>내 활동</h1>
      </div>
      <hr />
      
      <nav className="tab-nav">
        {/* 👇 '내가 쓴 글' 탭의 to 속성을 수정합니다. */}
        <NavLink to="/my-activity" end>내가 쓴 글</NavLink>

        <NavLink to="/my-activity/comments">내가 쓴 댓글</NavLink>
        <NavLink to="/my-activity/likes">좋아요 누른 글</NavLink>
      </nav>

      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MyActivityPage;