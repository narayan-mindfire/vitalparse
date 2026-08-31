import React from 'react';
import { Activity } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            <span className="font-bold text-xl text-gray-900 tracking-tight">VitalParse</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
