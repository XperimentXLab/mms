import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from './api';

const ProtectedRoute = () => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.get('/token/verify/');
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    };

    verifyToken();
  }, []);

  if (isValid === null) return <p>Loading...</p>;
  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

