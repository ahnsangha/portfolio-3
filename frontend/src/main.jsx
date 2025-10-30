import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. BrowserRouter 불러오기
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* 2. App을 감싸줍니다. */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);