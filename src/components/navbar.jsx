import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentUser, onOpenAuth, onLogout }) => {
  return (
    <nav className="fixed top-4 left-2 right-2 z-50 px-6 py-4 flex items-center justify-between rounded-2xl bg-[#050811]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)] hover:border-white/20 transition-all duration-500">
      
      {/* 1. Left Section: Logo & Icon */}
      <Link to="/" className="flex-1 flex justify-start items-center gap-3 cursor-pointer group">
        <svg 
          className="w-6 h-6 text-[#00e58c] group-hover:scale-110 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <div className="font-extrabold text-2xl tracking-widest text-white group-hover:text-gray-200 transition-colors duration-300">
          CLASH<span className="text-[#00e58c]">X</span>
        </div>
      </Link>

      {/* 2. Center Section: Navigation Links */}
      <div className="hidden md:flex justify-center gap-10 text-sm font-bold tracking-[0.15em] text-gray-400">
        <Link to="/" className="hover:text-white transition-colors duration-300">HOME</Link>
        <Link to="/about" className="hover:text-white transition-colors duration-300">ABOUT US</Link>
        <Link to="/contact" className="hover:text-white transition-colors duration-300">CONTACT US</Link>
      </div>

      {/* 3. Right Section: Auth & Profile */}
      <div className="flex-1 flex justify-end items-center gap-6">
        {currentUser ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-gray-400 block uppercase tracking-wider">Commander</span>
              <span className="text-sm font-bold text-[#00e58c]">{currentUser.username}</span>
            </div>
            
            <button 
              onClick={onLogout}
              className="bg-white/10 hover:bg-red-500/20 hover:border-red-500/40 border border-white/20 text-gray-300 hover:text-red-400 text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
            >
              LOG OUT
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold text-xs tracking-wider px-6 py-3 rounded shadow-[0_0_15px_rgba(0,229,140,0.3)] hover:shadow-[0_0_25px_rgba(0,229,140,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            CREATE ACCOUNT
          </button>
        )}
        
        {/* Dynamic User Profile Avatar or Fallback Icon linked to Profile Page */}
        <Link to="/profile" className="cursor-pointer flex items-center group" title="View Profile">
          {currentUser && currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.username} 
              className="w-9 h-9 rounded-full border-2 border-[#00e58c] object-cover shadow-[0_0_10px_rgba(0,229,140,0.3)] group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="text-gray-400 group-hover:text-[#00e58c] transition-colors duration-300">
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </Link>
      </div>

    </nav>
  );
};

export default Navbar;