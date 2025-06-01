import axios from "axios"

export const baseURL = 'http://127.0.0.1:8000/server' //'http://localhost:8000/server'
//const tokenURL = `${baseURL}/token/refresh/`

//axios.defaults.xsrfCookieName = 'csrftoken';
//axios.defaults.xsrfHeaderName = 'X-CSRFToken'; // This is the default, but good to be explicit
//axios.defaults.withCredentials = true // Include credentials (cookies) in requests

const api = axios.create({
  baseURL: baseURL,
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