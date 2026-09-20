import React from 'react';

const Contact = () => {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-14 shadow-2xl">
        
        <div className="w-16 h-16 bg-[#00e58c]/10 border border-[#00e58c]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#00e58c]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <span className="text-xs font-bold text-[#00e58c] uppercase tracking-widest bg-[#00e58c]/10 px-3 py-1 rounded-full border border-[#00e58c]/20">
          Support Desk
        </span>
        
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4 mb-4">
            Don;t need to contact us, we are not real. This is a demo project for learning React.
        </h1>
        
        <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8">
          
        </p>

        <a 
          href="/" 
          className="inline-block bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold text-sm tracking-wider px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,229,140,0.3)] transition-all hover:scale-105"
        >
          Return to Dashboard
        </a>

      </div>
    </div>
  );
};

export default Contact;