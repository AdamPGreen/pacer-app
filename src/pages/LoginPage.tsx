import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';

const LoginPage: React.FC = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { error, clearError } = useSpotify();

  useEffect(() => {
    console.log('LoginPage useEffect triggered. Session:', session);
    if (session) {
      console.log('Session found in LoginPage, navigating to /');
      navigate('/', { replace: true }); // Redirect if session exists
    }
  }, [session, navigate]);

  // Clear previous errors when component mounts
  useEffect(() => {
    clearError();
    return () => clearError(); // Cleanup on unmount
  }, [clearError]);

  // Don't render login form if session exists (avoids flash)
  if (session) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Pacer</h1>
          <p className="mt-2 text-gray-600">Sign in to create your perfect running playlist</p>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            Error: {error}
          </div>
        )}
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1DB954', // Spotify green
                  brandAccent: '#1AA34A',
                },
              },
            },
          }}
          providers={['spotify']}
          // Ensure scopes match what your app needs & Edge Functions expect
          queryParams={{
            scope: 'playlist-modify-public user-read-private user-read-email',
          }}
          // Only show Spotify button
          onlyThirdPartyProviders={true}
          // Optional: Redirect URL after successful login by Supabase
          // redirectTo={`${import.meta.env.VITE_APP_URL || window.location.origin}/`}
        />
      </div>
    </div>
  );
};

export default LoginPage; 