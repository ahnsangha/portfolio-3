import React from 'react';

// isCollapsed와 onToggle props를 추가로 받습니다.
const Sidebar = ({ user, onLogout, isCollapsed, onToggle }) => {
  return (
    // isCollapsed 상태에 따라 'collapsed' 클래스를 동적으로 추가합니다.
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button onClick={onToggle} className="sidebar-toggle-button">
        {isCollapsed ? '>>' : '<<'}
      </button>

      {/* 사이드바가 펼쳐져 있을 때만 내용을 보여줍니다. */}
      {!isCollapsed && (
        <>
          <div className="user-profile">
            <h3>회원 정보</h3>
            <p>안녕하세요,</p>
            <p className="user-email">{user.email}님</p>
            <button onClick={onLogout} className="logout-button">로그아웃</button>
          </div>
          <nav className="sidebar-nav">
            <a href="/">게시글 목록</a>
          </nav>
        </>
      )}
    </aside>
  );
};

export default Sidebar;