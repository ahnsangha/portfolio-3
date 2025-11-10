import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import CreatePost from '../components/CreatePost';
import LoadingSpinner from '../components/LoadingSpinner';

// localStorage에서 사용할 키(key)를 정의합니다.
const DRAFT_TITLE_KEY = 'post_draft_title';
const DRAFT_CONTENT_KEY = 'post_draft_content';

const WritePage = ({ user }) => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // title과 content state를 CreatePost에서 여기로 이동합니다.
  // useState의 초기값으로 localStorage에서 값을 불러옵니다.
  const [title, setTitle] = useState(() => {
    return localStorage.getItem(DRAFT_TITLE_KEY) || '';
  });
  const [content, setContent] = useState(() => {
    return localStorage.getItem(DRAFT_CONTENT_KEY) || '';
  });

  // 임시 저장 상태를 관리할 state 추가
  const [saveStatus, setSaveStatus] = useState('임시 저장됨');

  // [자동 저장] title이 변경될 때마다 localStorage에 저장합니다.
  useEffect(() => {
    localStorage.setItem(DRAFT_TITLE_KEY, title);
  }, [title]);

  // [자동 저장] content가 변경될 때마다 localStorage에 저장합니다.
  useEffect(() => {
    localStorage.setItem(DRAFT_CONTENT_KEY, content);
  }, [content]);

  // [자동 저장] useEffect 로직 수정
  useEffect(() => {
    // 내용이 변경되면 '변경 중...'으로 상태 변경
    setSaveStatus('변경 중...');

    // 1초간 추가 입력이 없으면 저장 (디바운스 효과)
    const handler = setTimeout(() => {
      setSaveStatus('저장 중...');
      localStorage.setItem(DRAFT_TITLE_KEY, title);
      localStorage.setItem(DRAFT_CONTENT_KEY, content);
      
      // 0.5초 뒤 '저장됨'으로 변경
      setTimeout(() => {
        setSaveStatus('임시 저장됨');
      }, 500);

    }, 1000);

    // 사용자가 타이핑을 계속하면 기존 타이머를 취소하고 새로 시작
    return () => {
      clearTimeout(handler);
    };
  }, [title, content]); // title이나 content가 변경될 때마다 실행

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

  // [자동 저장 삭제] handleCreatePost 함수 수정
  const handleCreatePost = async ({ title, content, image_url }) => {
    const promise = api.post(
      '/api/posts',
      { title, content, image_url: image_url },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '게시글을 작성 중입니다...',
      success: () => {
        setTitle('');
        setContent('');
        setImageUrl(null);
        localStorage.removeItem(DRAFT_TITLE_KEY);
        localStorage.removeItem(DRAFT_CONTENT_KEY);
        setSaveStatus('게시글 발행됨'); // 3. 최종 상태 변경
        
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

      {/* 8. CreatePost에 state와 setter 함수를 props로 전달합니다. */}
      <CreatePost 
        handleSubmit={handleCreatePost} 
        imageUrl={imageUrl}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
      />
    </div>
  );
};

export default WritePage;