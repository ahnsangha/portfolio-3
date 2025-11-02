import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = ({ user }) => {
  return (
    <div className="card">
      <div className="main-header">
        {/* 1. user 객체의 존재 여부를 확인합니다. */}
        {user ? (
          // 2. 로그인한 사용자에게 보여줄 메시지
          <h1>👋 {user.nickname}님, 환영합니다!</h1>
        ) : (
          // 3. 로그인하지 않은 방문객에게 보여줄 메시지
          <h1>👋 커뮤니티에 오신 것을 환영합니다!</h1>
        )}
      </div>
      <hr />
      <div className="home-content">
        {user ? (
          // 4. 로그인한 사용자에게 보여줄 안내
          <>
            <p>사이드바 메뉴를 통해 게시글을 보거나 프로필을 수정할 수 있습니다.</p>
            <br />
            <Link to="/posts" className="button-link primary">게시글 보러가기</Link>
          </>
        ) : (
          // 5. 로그인하지 않은 방문객에게 보여줄 안내
          <>
            <p>모든 게시글을 자유롭게 둘러보실 수 있습니다.</p>
            <p>글을 작성하거나 댓글을 남기시려면, 사이드바에서 로그인을 해주세요.</p>
            <br />
            <Link to="/posts" className="button-link primary">게시글 보러가기</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;