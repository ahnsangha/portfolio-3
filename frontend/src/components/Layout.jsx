import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ user, onLogout, theme, toggleTheme }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-content">
        {/* 이 부분에 각 페이지의 실제 내용이 렌더링됩니다. */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;