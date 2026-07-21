import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://10.246.59.198:5000/api", // change if your backend runs on a different port
});

// Automatically attach the JWT token to every request, if it exists
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;