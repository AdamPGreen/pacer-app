import React from 'react';
import { Music, FileWarning as Running } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
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
          <div className="flex items-center space-x-2">
            <Music size={20} className="text-white" />
            <span className="text-white font-medium">Run to the Beat</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;