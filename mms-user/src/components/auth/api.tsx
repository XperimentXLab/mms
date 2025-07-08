import axios, { type AxiosRequestConfig } from "axios"
import { updateUserDetails } from "./endpoints";

export const baseURL = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000/server'
const tokenURL = `${baseURL}/token/refresh/`

export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return Math.random().toString(36).substring(2, 15);
  }

  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  return canvas.toDataURL().slice(-16);
};

import { useEffect } from 'react';

export const useAutoLogout = () => {
  useEffect(() => {
    const resetTimer = () => {
      clearTimeout((window as any).inactivityTimer);
      (window as any).inactivityTimer = setTimeout(() => {
        sessionStorage.clear();
        window.location.href = '/login';
      }, 30 * 60 * 1000); // 30 minutes
    };

    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout((window as any).inactivityTimer);
    };
  }, []);
};


const api = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 3000,
})

// Request interceptor for auth headers
api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('access_token')
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${accessToken}`;
    config.headers['X-Device-Fingerprint'] = generateDeviceFingerprint();
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => response, async (error) => {

  const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
  const refreshToken = sessionStorage.getItem('refresh_token');

  if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
    originalRequest._retry = true;
    
    try {
      const response = await axios.post<{ access: string; refresh?: string }>(
        tokenURL,
        { refresh: refreshToken }
      );

      const newTokens = {
        access: response.data.access,
        refresh: response.data.refresh || refreshToken,
      };

      // Update storage
      sessionStorage.setItem('access_token', newTokens.access);
      sessionStorage.setItem('refresh_token', newTokens.refresh);

      // Update axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;

      // Update the original request header
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
      }

      return api(originalRequest)

    } catch (refreshError) {
      // Clear tokens on refresh failure
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
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

const cloudinary_url = import.meta.env.VITE_CLOUDINARY_URL
export const uploadToCloudinary = async (file: File, user_id: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'verification-mms');
  formData.append('cloud_name', 'ddv9fqfxw');

  const customPublicId = `verification/mms-doc/${user_id}-${file.name.replace(/\.[^/.]+$/, "")}`;
  formData.append('public_id', customPublicId);

  const res = await fetch(cloudinary_url, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.secure_url) {
    updateUserDetails({
      verificationStatus: 'UNDER_REVIEW',
      ic_document_url: data.secure_url
    });
    alert('Document uploaded successfully.');
  }
};


/*
const getRecaptchaToken = async (action: string): Promise<string> => {
  return new Promise((resolve) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action }).then((token) => {
        resolve(token);
      });
    });
  });
};

Send Both CAPTCHA Tokens to Backend
const handleSubmit = async () => {
  const sliderPassed = true; // Set based on slider completion
  const recaptchaToken = await getRecaptchaToken("login");

  const response = await fetch("/api/verify-captchas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sliderPassed, recaptchaToken }),
  });

  console.log("Server Response:", await response.json());
};

Verify CAPTCHA in Django Backend.. In views.py, verify both Slider CAPTCHA and reCAPTCHA v3:
def verify_captchas(request):
    if request.method == "POST":
        data = json.loads(request.body)
        slider_passed = data.get("sliderPassed")
        recaptcha_token = data.get("recaptchaToken")

        if not slider_passed:
            return JsonResponse({"error": "Slider CAPTCHA failed"}, status=400)

        secret_key = settings.RECAPTCHA_SECRET_KEY
        url = f"https://www.google.com/recaptcha/api/siteverify?secret={secret_key}&response={recaptcha_token}"
        
        responseCaptcha = requests.post(url)
        resultCaptcha = responseCaptcha.json()

        if not resultCaptcha.get("success") or resultCaptcha.get("score", 0) < 0.5:
            return JsonResponse({"error": "reCAPTCHA verification failed"}, status=400)

        return JsonResponse({"success": True, "message": "CAPTCHA verification passed!"})

    return JsonResponse({"error": "Invalid request"}, status=400)

*/
