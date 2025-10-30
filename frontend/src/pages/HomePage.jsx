import { useState, useEffect } from 'react';
import axios from 'axios';
import PostList from '../components/PostList';
import CreatePost from '../components/CreatePost';
import { supabase } from '../supabaseClient'; // supabase client import 추가

// App.jsx로부터 session props를 받습니다.
const HomePage = ({ session, onLoginClick }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/posts');
        setPosts(response.data);
      } catch (error) {
        console.error("데이터를 불러오는 중 에러가 발생했습니다:", error);
      }
    };

    if (session) { // session이 있을 때만 데이터를 불러옵니다.
        fetchPosts();
    }
  }, []); // session이 바뀔 때마다 이 effect를 다시 실행합니다.

  const handleCreatePost = async ({ title, content }) => {
    try {
      // 이 부분은 이미 헤더가 포함되어 있으므로 그대로 둡니다.
      const response = await axios.post(
        'http://localhost:4000/api/posts',
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setPosts([response.data[0], ...posts]);
    } catch (error) {
      console.error("게시글 작성 중 에러가 발생했습니다:", error);
    }
  };

  return (
    <div>
      <div className="header">
        {session ? (
          <>
            <span>안녕하세요, {session.user.email}님</span>
            <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
          </>
        ) : (
          <button onClick={onLoginClick}>로그인</button>
        )}
      </div>
      <h1>연습용 커뮤니티</h1>
      <CreatePost
        session={session}
        handleSubmit={handleCreatePost}
        onLoginClick={onLoginClick} // 로그인 함수 전달
      />
      <hr />
      <PostList posts={posts} />
    </div>
  );
};

export default HomePage;