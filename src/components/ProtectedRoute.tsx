import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = authService.getToken();

        if (!token) {
          setIsAuthenticated(false);
          setIsVerifying(false);
          return;
        }

        // Verify token with backend
        await authService.verifyToken();
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication verification failed:', error);
        setIsAuthenticated(false);
        authService.signout();
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[rgb(152,16,250)] mx-auto" />
          <p className="text-slate-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
