import axios from 'axios'
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '', // 走 vite 代理时可留空
  timeout: 15000,
})
http.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('HTTP Error:', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)
export default http
