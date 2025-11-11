import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import CreatePost from '../components/CreatePost';
import LoadingSpinner from '../components/LoadingSpinner';

// localStorage 키 정의
const DRAFT_TITLE_KEY = 'post_draft_title';
const DRAFT_CONTENT_KEY = 'post_draft_content';
const DRAFT_IMAGE_URL_KEY = 'post_draft_image_url';

const WritePage = ({ user }) => {
  const navigate = useNavigate();
  // 1. 상태 분리:
  const [imageUrl, setImageUrl] = useState(() => localStorage.getItem(DRAFT_IMAGE_URL_KEY) || null); // 최종 업로드된 URL
  const [imageFile, setImageFile] = useState(null); // 사용자가 선택한 파일
  const [previewUrl, setPreviewUrl] = useState(() => localStorage.getItem(DRAFT_IMAGE_URL_KEY) || null); // 화면에 보여줄 미리보기
  const [isUploading, setIsUploading] = useState(false);

  // 2. 자동 저장을 위한 상태
  const [title, setTitle] = useState(() => localStorage.getItem(DRAFT_TITLE_KEY) || '');
  const [content, setContent] = useState(() => localStorage.getItem(DRAFT_CONTENT_KEY) || '');
  const [saveStatus, setSaveStatus] = useState('임시 저장됨');

  // 3. 자동 저장 로직 (imageUrl도 저장)
  useEffect(() => {
    setSaveStatus('변경 중...');
    const handler = setTimeout(() => {
      setSaveStatus('저장 중...');
      localStorage.setItem(DRAFT_TITLE_KEY, title);
      localStorage.setItem(DRAFT_CONTENT_KEY, content);
      if (imageUrl) {
        localStorage.setItem(DRAFT_IMAGE_URL_KEY, imageUrl);
      } else {
        localStorage.removeItem(DRAFT_IMAGE_URL_KEY);
      }
      setTimeout(() => setSaveStatus('임시 저장됨'), 500);
    }, 1000);
    return () => clearTimeout(handler);
  }, [title, content, imageUrl]);

  // 4. 로컬 미리보기 URL 메모리 해제
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 5. 파일 선택 핸들러 (파일 상태에만 저장)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(null); // 이전 업로드 URL 초기화
      localStorage.removeItem(DRAFT_IMAGE_URL_KEY);
      
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file)); // 로컬 미리보기 생성
    }
  };

  // 6. "이미지 등록" 버튼 핸들러 (이때만 API 호출)
  const handleImageRegister = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('파일을 먼저 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    setIsUploading(true);

    const promise = api.post('/api/posts/image-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${user.token}`
      }
    });

    toast.promise(promise, {
      loading: '이미지를 등록 중입니다...',
      success: (response) => {
        setImageUrl(response.data.image_url); // *업로드된* URL 저장
        setPreviewUrl(response.data.image_url); // 미리보기도 업로드된 URL로 변경
        setImageFile(null); // 선택한 파일 초기화
        setIsUploading(false);
        return '이미지가 성공적으로 등록되었습니다!';
      },
      error: (error) => {
        setIsUploading(false);
        return error.response?.data?.message || '업로드에 실패했습니다.';
      }
    });
  };

  // 7. "이미지 삭제" 버튼 핸들러
  const handleImageDelete = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setImageUrl(null);
    setPreviewUrl(null);
    localStorage.removeItem(DRAFT_IMAGE_URL_KEY);
    // 파일 인풋 초기화
    document.getElementById('image-upload').value = null;
    toast.success('이미지가 삭제되었습니다.');
  };

  // 8. "게시글 작성" (최종 제출) 핸들러
  const handleCreatePost = async ({ title, content }) => {
    const promise = api.post(
      '/api/posts',
      { title, content, image_url: imageUrl }, // WritePage가 관리하던 imageUrl을 함께 전송
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: () => {
        // 모든 드래프트 초기화
        setTitle('');
        setContent('');
        setImageUrl(null);
        setPreviewUrl(null);
        setImageFile(null);
        localStorage.removeItem(DRAFT_TITLE_KEY);
        localStorage.removeItem(DRAFT_CONTENT_KEY);
        localStorage.removeItem(DRAFT_IMAGE_URL_KEY);
        setSaveStatus('게시글 발행됨');
        
        setTimeout(() => navigate('/posts'), 1000);
        return '게시글이 성공적으로 작성되었습니다!';
      },
      error: '글 작성에 실패했습니다.',
    });
  };

  return (
    <div className="card">
      <div className="main-header">
        <h1>새 글 작성하기</h1>
        <span className="save-status">{saveStatus}</span>
        <Link to="/posts" className="button-link">목록으로</Link>
      </div>
      <hr />

      {/* 9. 이미지 업로드 UI (등록/삭제 버튼 포함) */}
      <div className="form-group">
        <label htmlFor="image-upload">대표 이미지 (선택)</label>
        <input
          id="image-upload"
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading && <LoadingSpinner />}
        {previewUrl && (
          <div className="image-preview-container">
            <img src={previewUrl} alt="업로드 미리보기" className="image-preview" />
          </div>
        )}
        <div className="image-button-group">
          <button 
            type="button" 
            onClick={handleImageRegister} 
            className="primary" 
            disabled={!imageFile || isUploading}
          >
            이미지 등록
          </button>
          <button 
            type="button" 
            onClick={handleImageDelete} 
            disabled={!previewUrl && !imageUrl}
          >
            이미지 삭제
          </button>
        </div>
      </div>
      <hr />

      {/* 10. CreatePost는 이제 폼 UI만 담당 */}
      <CreatePost 
        handleSubmit={handleCreatePost}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
      />
    </div>
  );
};

export default WritePage;