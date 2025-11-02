import { useState } from 'react';

// 1. imageUrl prop을 받습니다.
const CreatePost = ({ handleSubmit, imageUrl }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    // 2. handleSubmit을 호출할 때 imageUrl도 함께 전달합니다.
    handleSubmit({ title, content, image_url: imageUrl });
    setTitle('');
    setContent('');
  };

  return (
    // 3. form 태그가 분리되었으므로, ID를 사용해 연결하거나 form 자체를 CreatePost로 옮깁니다.
    //    간단하게 form을 여기로 옮기겠습니다.
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
          rows="15"
        />
      </div>
      <button type="submit" className="primary">작성</button>
    </form>
  );
};

export default CreatePost;