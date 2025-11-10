import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import LoadingSpinner from '../components/LoadingSpinner';

const MyPostsPage = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Set());

  // (PostListPage의 fetchPostsAndLikes와 거의 동일)
  const fetchMyPostsAndLikes = async () => {
    setIsLoading(true);
    try {
      const postsPromise = api.get('/api/user/my-posts', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const likesPromise = api.get('/api/user/my-likes', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const [postsRes, likesRes] = await Promise.all([postsPromise, likesPromise]);

      setPosts(postsRes.data.posts);
      setUserLikes(new Set(likesRes.data));
      
    } catch (error) {
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPostsAndLikes();
  }, [user]); // user가 로드되면 실행

  // '좋아요' 토글 핸들러 (PostListPage와 동일)
  const handleLikeToggle = async (post_id, isLiked) => {
    try {
      if (isLiked) {
        await api.delete(`/api/posts/${post_id}/like`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUserLikes(prevLikes => {
          const newLikes = new Set(prevLikes); newLikes.delete(post_id); return newLikes;
        });
        setPosts(prevPosts => 
          prevPosts.map(p => p.id === post_id ? { ...p, like_count: p.like_count - 1 } : p)
        );
      } else {
        await api.post(`/api/posts/${post_id}/like`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUserLikes(prevLikes => {
          const newLikes = new Set(prevLikes); newLikes.add(post_id); return newLikes;
        });
        setPosts(prevPosts => 
          prevPosts.map(p => p.id === post_id ? { ...p, like_count: p.like_count + 1 } : p)
        );
      }
    } catch (error) {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

 return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PostList 
          posts={posts} 
          userLikes={userLikes}
          onLikeToggle={handleLikeToggle}
        />
      )}
    </>
  );
};

export default MyPostsPage;