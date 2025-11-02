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
        {isLoading ? <LoadingSpinner /> : <PostList posts={posts} />}
        
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