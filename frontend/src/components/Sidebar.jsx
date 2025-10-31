import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, onLogout, isCollapsed, onToggle, theme, toggleTheme }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button onClick={onToggle} className="sidebar-toggle-button">
        {isCollapsed ? '>>' : '<<'}
      </button>

      {!isCollapsed && (
        <>
          <div className="user-profile">
            <h3>회원 정보</h3>
            <p className="user-email">{user.email}</p>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/">게시글 목록</NavLink>
            {/* 나중에 다른 메뉴를 이곳에 추가할 수 있습니다. */}
          </nav>

          {/* 👇 기능 버튼들을 nav 태그 밖으로 빼서 그룹화합니다. */}
          <div className="sidebar-actions">
            <button onClick={toggleTheme} className="sidebar-button">
              {theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
            </button>
            <button onClick={onLogout} className="sidebar-button">
              로그아웃
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;