import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = ({ user }) => {
  return (
    <div className="card">
      <div className="main-header">
        <h1>👋 {user.nickname}님, 환영합니다!</h1>
      </div>
      <hr />
      <div className="home-content">
        <p>연습용 커뮤니티 프로젝트에 오신 것을 환영합니다.</p>
        <p>사이드바 메뉴를 통해 게시글을 보거나 프로필을 수정할 수 있습니다.</p>
        <br />
        <Link to="/posts" className="button-link primary">게시글 보러가기</Link>
      </div>
    </div>
  );
};

export default HomePage;