import axios from 'axios';

// 1. Vercel에 설정할 '운영' 주소 또는 로컬 '개발' 주소를 사용합니다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;