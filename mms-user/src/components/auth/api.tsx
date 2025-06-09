import axios from "axios"

export const baseURL = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000/server'
const tokenURL = `${baseURL}/token/refresh/`

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken'; // This is the default, but good to be explicit
axios.defaults.withCredentials = true // Include credentials (cookies) in requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 5000,
})

// Remove the request interceptor - browser handles HttpOnly cookies automatically
api.interceptors.request.use((config) => {
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => {
  return response
}, async (error) => {
  const originalRequest = error.config

    if (
      error.response?.status === 401 && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      try {
        console.log('Attempting token refresh via HttpOnly cookie...');
        // Send request to refresh endpoint. The browser automatically includes
        // the HttpOnly refresh_token cookie because withCredentials is true.
        // The backend reads the cookie, verifies it, and sets a new access_token cookie.
        await axios.post(tokenURL, {}, { // Send empty body, backend reads cookie
          withCredentials: true,
        })
        console.log('Token refresh successful (cookies updated by backend).');
        // Retry the original request. The browser will now send the new access_token cookie.
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed.');
        // Log the detailed error response from the backend if available
        if (refreshError.response) {
          console.error('Refresh Error Response:', refreshError.response.status, refreshError.response.data);
        } else {
          console.error('Refresh Error:', refreshError.message);
        }
        // No need to remove localStorage item as we are not using it for tokens
        // Could potentially clear other app state here if needed
        // Redirect to login on refresh failure
        if (window.location.pathname !== '/login') { // Avoid redirect loop if already on login
            window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
  return Promise.reject(error)
})


export default api


export interface CountryType {
  code: string
  name: string
}

export const apiCountry: Promise<CountryType[]> = axios.get('https://restcountries.com/v3.1/all?fields=name,cca2')
  .then(res => {
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((country: { name: { common: string}, cca2: string }) => ({name: country.name.common, code: country.cca2})).sort((a, b) => a.name.localeCompare(b.name))
    }
    console.warn('Country API response data is not an array or is missing: ', res.data)
    return []
  })
  .catch(err => {
    console.error('Error fetching country data:', err)
    return []
  })