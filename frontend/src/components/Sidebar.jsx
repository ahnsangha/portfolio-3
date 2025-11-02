import React from 'react';
import { NavLink } from 'react-router-dom';

// 아이콘들을 간단한 컴포넌트로 정의합니다.
const IconHome = () => ( <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const IconLogout = () => ( <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> );
const IconTheme = ({ theme }) => theme === 'light' ? ( <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> ) : ( <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> );
const IconToggle = () => ( <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> );
// 👇 1. '프로필 수정' 아이콘 컴포넌트를 정의합니다.
const IconUser = () => ( <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> );

const Sidebar = ({ user, onLogout, isCollapsed, onToggle, theme, toggleTheme }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button onClick={onToggle} className="sidebar-button toggle-button">
          <IconToggle />
          <span className="menu-text">사이드바 접기</span>
        </button>
      </div>

      <div className="user-profile">
        <span className="menu-icon">👤</span>
        <div className="user-details">
          <span className="user-greeting">안녕하세요,</span>
          <span className="user-email">{user.nickname}님</span>
        </div>
      </div>

      <nav className="sidebar-nav">
         <NavLink to="/profile">
          <IconUser />
          <span className="menu-text">프로필 수정</span>
        </NavLink>
        
        <NavLink to="/">
          <IconHome />
          <span className="menu-text">게시글 목록</span>
        </NavLink>

       
      </nav>

      <div className="sidebar-actions">
        <button onClick={toggleTheme} className="sidebar-button">
          <IconTheme theme={theme} />
          <span className="menu-text">{theme === 'light' ? '다크 모드' : '라이트 모드'}</span>
        </button>
        <button onClick={onLogout} className="sidebar-button">
          <IconLogout />
          <span className="menu-text">로그아웃</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;