import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // axios 대신 api
import toast from 'react-hot-toast';
import CreatePost from '../components/CreatePost';
import LoadingSpinner from '../components/LoadingSpinner';

const WritePage = ({ user }) => {
  const navigate = useNavigate();
  // 1. 업로드된 이미지 URL을 저장할 state
  const [imageUrl, setImageUrl] = useState(null);
  // 2. 이미지 업로드 중인지 확인하는 state
  const [isUploading, setIsUploading] = useState(false);

  // 3. 이미지 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setIsUploading(true);

    const promise = api.post(
      '/api/posts/image-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      }
    );

    toast.promise(promise, {
      loading: '이미지를 업로드 중입니다...',
      success: (response) => {
        setImageUrl(response.data.image_url); // 4. 성공 시 URL을 state에 저장
        setIsUploading(false);
        return '이미지가 성공적으로 업로드되었습니다!';
      },
      error: (error) => {
        setIsUploading(false);
        return error.response?.data?.message || '업로드에 실패했습니다.';
      }
    });
  };

  // 5. 최종 글 작성 핸들러 (이제 image_url도 함께 전달)
  const handleCreatePost = async ({ title, content, image_url }) => {
    const promise = api.post(
      '/api/posts',
      { title, content, image_url: image_url }, // 6. image_url을 백엔드로 전송
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: () => {
        setTimeout(() => navigate('/posts'), 1000); // 게시글 목록으로 이동
        return '게시글이 성공적으로 작성되었습니다!';
      },
      error: '글 작성에 실패했습니다.',
    });
  };

  return (
    <div className="card">
      <div className="main-header">
        <h1>새 글 작성하기</h1>
        <Link to="/posts" className="button-link">목록으로</Link>
      </div>
      <hr />

      {/* 7. 이미지 업로드 UI 추가 */}
      <div className="form-group">
        <label htmlFor="image-upload">대표 이미지 (선택)</label>
        <input
          id="image-upload"
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        {isUploading && <LoadingSpinner />}
        {imageUrl && (
          <div className="image-preview-container">
            <img src={imageUrl} alt="업로드 미리보기" className="image-preview" />
          </div>
        )}
      </div>

      <CreatePost handleSubmit={handleCreatePost} imageUrl={imageUrl} />
    </div>
  );
};

export default WritePage;