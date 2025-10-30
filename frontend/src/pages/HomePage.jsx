import { useState, useEffect } from 'react';
import axios from 'axios';
import PostList from '../components/PostList';
import CreatePost from '../components/CreatePost';
import { supabase } from '../supabaseClient';

const HomePage = ({ session, onLoginClick }) => {
  const [posts, setPosts] = useState([]);

  // 1. 게시글 목록을 불러오는 함수를 useEffect 밖으로 꺼냅니다.
  const fetchPosts = async () => {
    try {
      // 이 API는 이제 누구나 호출할 수 있으므로 헤더가 필요 없습니다.
      const response = await axios.get('http://localhost:4000/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("데이터를 불러오는 중 에러가 발생했습니다:", error);
    }
  };

  // 2. useEffect는 처음 한 번만 실행해서 초기 데이터를 로드하게 합니다.
  useEffect(() => {
    fetchPosts();
  }, []); // 빈 배열로 두어 처음 한 번만 실행되게 합니다.

  const handleCreatePost = async ({ title, content }) => {
    try {
      const response = await axios.post(
        'http://localhost:4000/api/posts',
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      // 3. 글 작성 성공 후, 목록 전체를 다시 불러옵니다.
      // 이렇게 하면 방금 쓴 글의 작성자 정보까지 완벽하게 표시됩니다.
      if (response.status === 201) {
        fetchPosts(); 
      }

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
        onLoginClick={onLoginClick}
      />
      <hr />
      <PostList posts={posts} />
    </div>
  );
};

export default HomePage;