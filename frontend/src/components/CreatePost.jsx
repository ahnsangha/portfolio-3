import { useState } from 'react';

// HomePage로부터 handleSubmit 함수를 props로 받습니다.
const CreatePost = ({ session, handleSubmit, onLoginClick }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // form의 제출(submit) 이벤트가 발생했을 때 실행될 함수
  const onSubmit = (e) => {
    e.preventDefault(); // form의 기본 새로고침 동작을 막습니다.

    // 로그인하지 않았다면, 로그인 창을 띄웁니다.
    if (!session) {
      alert('글을 작성하려면 로그인이 필요합니다.');
      onLoginClick();
      return;
    }

    // 제목이나 내용이 비어있으면 경고창을 띄우고 함수를 종료합니다.
    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 부모 컴포넌트(HomePage)로부터 받은 handleSubmit 함수를 호출합니다.
    handleSubmit({ title, content });

    // 입력창을 다시 비워줍니다.
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={onSubmit} className="create-post-form">
      <h3>새 게시글 작성하기</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <button type="submit">작성</button>
    </form>
  );
};

export default CreatePost;