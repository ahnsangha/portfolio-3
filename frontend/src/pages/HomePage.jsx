import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PostList from '../components/PostList';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination'; // 1. Pagination 컴포넌트 불러오기

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // 2. 현재 페이지 state
  const [totalPages, setTotalPages] = useState(0);   // 3. 전체 페이지 state

  const fetchPosts = async (page = 1) => {
    setIsLoading(true);
    try {
      // 4. API 요청 시 page와 search 파라미터를 함께 전송
      const response = await axios.get(`http://localhost:4000/api/posts`, {
        params: { 
          search: searchTerm,
          page: page
        }
      });
      // 5. 백엔드에서 받은 데이터로 state 업데이트
      setPosts(response.data.posts);
      setTotalPages(Math.ceil(response.data.total_count / response.data.limit));
      setCurrentPage(response.data.page);
    } catch (error) {
      toast.error("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1); // 6. 처음 로드 시 1페이지를 불러옴
  }, []); // 👈 의존성 배열을 비워둬야 검색 시 중복 호출을 막을 수 있음

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(1); // 7. 검색 시에는 항상 1페이지부터 다시 검색
  };

  // 8. 페이지 변경 시 실행될 함수
  const handlePageChange = (pageNumber) => {
    fetchPosts(pageNumber);
  };

  return (
    <>
      <div className="main-header">
        <h1>최근 게시글</h1>
        <Link to="/write" className="button-link primary">글쓰기</Link>
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
        {isLoading ? <LoadingSpinner /> : <PostList posts={posts} />}
        
        {/* 9. Pagination 컴포넌트 추가 */}
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

export default HomePage;