import React from 'react';
import { Music, FileWarning as Running, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSpotify } from '../../context/SpotifyContext';

const Header: React.FC = () => {
  const { session, logout } = useSpotify();

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-white p-2 rounded-full">
              <Running size={24} className="text-cyan-500" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Pacer</span>
          </Link>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-white text-sm hidden sm:inline">{session.user?.email}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-150 ease-in-out"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Music size={20} className="text-white" />
                <span className="text-white font-medium hidden sm:inline">Run to the Beat</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;