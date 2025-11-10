import React from 'react'; // 1. useState, useEffect가 더 이상 필요 없습니다.
import ReactQuill from 'react-quill';
import toast from 'react-hot-toast'; // 2. toast는 유효성 검사를 위해 필요합니다.

// 3. title, setTitle, content, setContent를 props로 받습니다.
const CreatePost = ({ handleSubmit, imageUrl, title, setTitle, content, setContent }) => {
  
  // 4. 내부 state 관리 로직을 모두 삭제합니다.

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>') {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    handleSubmit({ title, content, image_url: imageUrl });
    
    // 5. 제출 성공 후 state와 localStorage를 지우는 로직을
    //    부모 컴포넌트(WritePage)가 담당하므로 여기서는 제거합니다.
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title} // 6. props로 받은 title 사용
          onChange={(e) => setTitle(e.target.value)} // 6. props로 받은 setTitle 사용
        />
      </div>
      <div className="form-group">
        <ReactQuill 
          theme="snow" 
          value={content} // 7. props로 받은 content 사용
          onChange={setContent} // 7. props로 받은 setContent 사용
          placeholder="내용을 입력하세요..."
          className="rich-text-editor"
        />
      </div>
      <button type="submit" className="primary">작성</button>
    </form>
  );
};

export default CreatePost;