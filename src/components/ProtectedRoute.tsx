import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';

const ProtectedRoute: React.FC = () => {
  const session = useSession();
  const isLoading = session === undefined; // useSession is undefined initially

  console.log('ProtectedRoute render. isLoading:', isLoading, 'Session:', session);

  if (isLoading) {
    console.log('ProtectedRoute showing loading');
    // Optional: Show a loading spinner/page while session is checked
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>;
  }

  if (!session) {
    console.log('ProtectedRoute redirecting to /login');
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute rendering Outlet');
  // User is logged in, render the nested routes (children)
  return <Outlet />;
};

export default ProtectedRoute; 