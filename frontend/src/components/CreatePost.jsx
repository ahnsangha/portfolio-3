import { useState } from 'react';

const CreatePost = ({ handleSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // onSubmit 함수는 기존과 동일합니다.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    handleSubmit({ title, content });
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="15" // 👇 이 속성을 추가하여 높이를 크게 늘립니다.
        />
      </div>
      <button type="submit" className="primary">작성</button>
    </form>
  );
};

export default CreatePost;