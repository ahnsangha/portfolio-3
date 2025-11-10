import { useState } from 'react';
import ReactQuill from 'react-quill'; // 1. ReactQuill을 임포트합니다.

const CreatePost = ({ handleSubmit, imageUrl }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // 2. 이 content가 HTML 문자열을 저장합니다.

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>') { // 3. 비어있는지 확인
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    handleSubmit({ title, content, image_url: imageUrl });
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
        {/* 👇 4. 기존 <textarea>를 <ReactQuill>로 교체합니다. */}
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          placeholder="내용을 입력하세요..."
          className="rich-text-editor"
        />
      </div>
      <button type="submit" className="primary">작성</button>
    </form>
  );
};

export default CreatePost;