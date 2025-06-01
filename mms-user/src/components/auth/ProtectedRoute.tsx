import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../props/Loading';
import { protectedView } from './endpoints';

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, false = not auth, true = auth

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await protectedView()
        if (auth) {
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        // If get_user fails (likely 401), cookies are invalid or missing.
        console.error('Authentication check failed:', error.response?.data || error.message);
        if (axios.isAxiosError(error)) {
          console.error("Axios error data:", error.response?.data);
          console.error("Axios error status:", error.response?.status);
        }
        setIsAuthenticated(false);
        navigate('/login', { replace: true }); // Redirect to login
      }
    };
    checkAuth();
  }, []);

  // Render loading state while checking, null if not authenticated (will redirect), or children if authenticated
  if (isAuthenticated === null) {
    return <Loading />
  }

  return isAuthenticated && <Outlet />
};

export default ProtectedRoute;