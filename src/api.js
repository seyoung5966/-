import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api", // 세영이 백엔드 주소
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
