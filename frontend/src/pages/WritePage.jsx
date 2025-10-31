import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreatePost from '../components/CreatePost';

const WritePage = ({ user }) => {
  const navigate = useNavigate();

  // handleCreatePost 함수는 기존과 동일합니다.
  const handleCreatePost = async ({ title, content }) => {
    const promise = axios.post(
      'http://localhost:4000/api/posts',
      { title, content },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: () => {
        setTimeout(() => navigate('/'), 1000);
        return '게시글이 성공적으로 작성되었습니다!';
      },
      error: '글 작성에 실패했습니다.',
    });
  };

  return (
    // 👇 write-page-container 대신 card 클래스를 사용합니다.
    <div className="card">
      <div className="main-header">
        <h1>새 글 작성하기</h1>
        <Link to="/" className="button-link">목록으로</Link>
      </div>
      <hr />
      <CreatePost handleSubmit={handleCreatePost} />
    </div>
  );
};

export default WritePage;