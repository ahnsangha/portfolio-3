import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = ({ user, onProfileUpdate }) => {
  const [nickname, setNickname] = useState(user.nickname);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname === user.nickname) {
      toast.error('새 닉네임이 기존 닉네임과 동일합니다.');
      return;
    }

    const promise = axios.put(
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

  return (
    <div className="card">
      <div className="main-header">
        <h1>프로필 수정</h1>
      </div>
      <hr />
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <button type="submit" className="primary">저장</button>
      </form>
    </div>
  );
};

export default ProfilePage;