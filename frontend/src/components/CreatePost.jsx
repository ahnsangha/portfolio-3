import React from 'react';
import ReactQuill from 'react-quill';
import toast from 'react-hot-toast';

// 1. imageUrl prop을 제거합니다.
const CreatePost = ({ handleSubmit, title, setTitle, content, setContent }) => {

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>') {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    // 2. imageUrl 없이 title과 content만 전달합니다.
    handleSubmit({ title, content });
  };

  return (
    <form onSubmit={onSubmit} className="post-create-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-group">
        <ReactQuill 
          theme="snow" 
          value={content}
          onChange={setContent}
          placeholder="내용을 입력하세요..."
          className="rich-text-editor"
        />
      </div>
      <button type="submit" className="primary">게시글 작성</button>
    </form>
  );
};

export default CreatePost;