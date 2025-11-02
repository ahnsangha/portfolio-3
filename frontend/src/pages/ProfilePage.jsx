import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const ProfilePage = ({ user, onProfileUpdate, onLogout }) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [avatarFile, setAvatarFile] = useState(null); // 1. 업로드할 파일 상태
  const [previewUrl, setPreviewUrl] = useState(user.avatar_url || null); // 2. 미리보기 URL 상태

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    if (nickname === user.nickname) {
      toast.error('새 닉네임이 기존 닉네임과 동일합니다.');
      return;
    }

    const promise = api.put(
      'http://localhost:4000/api/user/nickname',
      { nickname },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '닉네임을 변경하는 중...',
      success: (response) => {
        onProfileUpdate(response.data); // App.jsx의 상태 업데이트 함수 호출
        return '닉네임이 성공적으로 변경되었습니다!';
      },
      error: (error) => error.response?.data?.message || '변경에 실패했습니다.',
    });
  };

  // 3. 파일이 선택되었을 때 실행될 함수
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // 로컬에서 임시 미리보기 URL 생성
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 4. 아바타(사진) 업로드 핸들러
  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error('먼저 파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const promise = api.post(
      'http://localhost:4000/api/user/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      }
    );

    toast.promise(promise, {
      loading: '프로필 사진을 업로드 중...',
      success: (response) => {
        onProfileUpdate(response.data); // App.jsx의 상태 업데이트
        setAvatarFile(null); // 파일 선택 상태 초기화
        return '사진이 성공적으로 변경되었습니다!';
      },
      error: (error) => error.response?.data?.message || '업로드에 실패했습니다.',
    });
  };

  const handleAvatarRemove = async (e) => {
    e.preventDefault();
    if (!previewUrl) {
      toast.error('삭제할 사진이 없습니다.');
      return;
    }
    if (!window.confirm("정말로 프로필 사진을 삭제하시겠습니까?")) {
      return;
    }

    const promise = api.delete(
      'http://localhost:4000/api/user/avatar',
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '프로필 사진을 삭제하는 중...',
      success: (response) => {
        onProfileUpdate({ avatar_url: null }); // App.jsx 상태 업데이트
        setPreviewUrl(null); // 미리보기 초기화
        setAvatarFile(null); // 파일 선택 초기화
        return '사진이 성공적으로 삭제되었습니다!';
      },
      error: (error) => error.response?.data?.message || '삭제에 실패했습니다.',
    });
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 회원에서 탈퇴하시겠습니까?\n모든 게시글과 댓글이 영구적으로 삭제됩니다.")) {
      return;
    }

    const promise = api.delete(
      'http://localhost:4000/api/user',
      { headers: { 'Authorization': `Bearer ${user.token}` } }
    );

    toast.promise(promise, {
      loading: '회원 탈퇴를 처리 중입니다...',
      success: (response) => {
        onLogout();
        return response.data.message;
      },
      error: (error) => error.response?.data?.message || '탈퇴에 실패했습니다.',
    });
  };

  return (
    <div className="card">
      <div className="main-header">
        <h1>프로필 수정</h1>
      </div>
      <hr />
      
      {/* 닉네임 수정 폼 */}
      <form onSubmit={handleNicknameSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <button type="submit" className="primary">닉네임 저장</button>
      </form>

      <hr />

      <form onSubmit={handleAvatarSubmit} className="profile-form">
        <div className="form-group">
          <label>프로필 사진</label>
          <div className="avatar-uploader">
            {previewUrl ? (
              <img 
                src={previewUrl}
                alt="Avatar preview" 
                className="avatar-preview" 
              />
            ) : (
              <span className="avatar-preview-default">👤</span>
            )}
            <input
              id="avatar"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <div className="button-group">
          <button type="submit" className="primary" disabled={!avatarFile}>
            사진 업로드
          </button>
          <button onClick={handleAvatarRemove} disabled={!previewUrl}>
            사진 삭제
          </button>
        </div>
      </form>

       <div className="card danger-zone">
        <div className="main-header">
          <h2>회원 탈퇴</h2>
        </div>
        <hr />
        <p>회원 탈퇴 시, 계정과 관련된 모든 정보(게시글, 댓글, 프로필 사진)가 영구적으로 삭제되며 복구할 수 없습니다.</p>
        <button onClick={handleDeleteAccount} className="danger-button">
          회원 탈퇴
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;