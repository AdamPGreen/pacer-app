import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Pacer App. All rights reserved.
            </p>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <span>Made with</span>
            <Heart size={16} className="mx-1 text-red-500" />
            <span>for runners everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;