import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreatePost from '../components/CreatePost';

const WritePage = ({ user }) => {
  const navigate = useNavigate();

  const handleCreatePost = async ({ title, content }) => {
    const promise = axios.post(
      'http://localhost:4000/api/posts',
      { title, content },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: (response) => {
        // 성공 시, 홈으로 이동하기 전에 잠시 딜레이를 주어 토스트 메시지를 볼 수 있게 함
        setTimeout(() => navigate('/'), 1000); 
        return '게시글이 성공적으로 작성되었습니다!';
      },
      error: '글 작성에 실패했습니다.',
    });
  };

  return (
    <div className="write-page-container">
      <h1>새 글 작성하기</h1>
      <CreatePost handleSubmit={handleCreatePost} />
    </div>
  );
};

export default WritePage;