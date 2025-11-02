import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const PostListPage = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [userLikes, setUserLikes] = useState(new Set());

  const fetchPosts = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/posts`, {
        params: { 
          search: searchTerm,
          page: page
        }
      });
      setPosts(response.data.posts);
      setTotalPages(Math.ceil(response.data.total_count / response.data.limit));
      setCurrentPage(response.data.page);
    } catch (error) {
      toast.error("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostsAndLikes = async (page = 1) => {
    setIsLoading(true);
    try {
      // 3. 게시글 목록과 좋아요 목록을 '동시에' 요청합니다.
      const postsPromise = api.get(`/api/posts`, {
        params: { search: searchTerm, page: page }
      });
      
      const likesPromise = user 
        ? api.get('/api/user/my-likes', { headers: { Authorization: `Bearer ${user.token}` } })
        : Promise.resolve({ data: [] }); // 로그인 안했으면 빈 배열

      const [postsRes, likesRes] = await Promise.all([postsPromise, likesPromise]);

      setPosts(postsRes.data.posts);
      setTotalPages(Math.ceil(postsRes.data.total_count / postsRes.data.limit));
      setCurrentPage(postsRes.data.page);
      setUserLikes(new Set(likesRes.data)); // 4. Set에 좋아요 ID 목록 저장
      
    } catch (error) {
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []); 

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handlePageChange = (pageNumber) => {
    fetchPosts(pageNumber);
  };

  const handleLikeToggle = async (post_id, isLiked) => {
    if (!user) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    try {
      if (isLiked) {
        // --- 좋아요 취소 ---
        await api.delete(`/api/posts/${post_id}/like`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        // userLikes Set에서 post_id 제거
        setUserLikes(prevLikes => {
          const newLikes = new Set(prevLikes);
          newLikes.delete(post_id);
          return newLikes;
        });
        // posts state에서 like_count 1 감소
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === post_id ? { ...p, like_count: p.like_count - 1 } : p
          )
        );
      } else {
        // --- 좋아요 누르기 ---
        await api.post(`/api/posts/${post_id}/like`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        // userLikes Set에 post_id 추가
        setUserLikes(prevLikes => {
          const newLikes = new Set(prevLikes);
          newLikes.add(post_id);
          return newLikes;
        });
        // posts state에서 like_count 1 증가
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === post_id ? { ...p, like_count: p.like_count + 1 } : p
          )
        );
      }
    } catch (error) {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="main-header">
        <h1>게시글</h1>
        {user && <Link to="/write" className="button-link primary">글쓰기</Link>}
      </div>
      
      <form onSubmit={handleSearch} className="search-form card">
        <input
          type="text"
          placeholder="게시글 제목 또는 내용 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="primary">검색</button>
      </form>

      <div className="card post-list-card">
        {isLoading ? <LoadingSpinner /> : (
          <PostList 
            posts={posts} 
            userLikes={userLikes}
            onLikeToggle={handleLikeToggle}
          />
        )}
        
        {!isLoading && totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default PostListPage;