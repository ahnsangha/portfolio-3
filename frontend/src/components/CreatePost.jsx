import { useState } from 'react';

// HomePage로부터 handleSubmit 함수를 props로 받습니다.
const CreatePost = ({ handleSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
    <form onSubmit={onSubmit} className="create-post-form">
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
      <button type="submit" className="primary">작성</button>
    </form>
  );
};

export default CreatePost;