import React from 'react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8">
        
        {/* Astolfo Picture */}
        <div className="w-full md:w-1/3 flex justify-center">
          <img 
            src="https://i.pinimg.com/736x/e5/93/d8/e593d8634ca2f33dcd93c4fb6bfcdc07.jpg" 
            alt="Astolfo" 
            className="w-48 h-48 md:w-60 md:h-60 rounded-2xl border-2 border-[#00e58c] object-cover shadow-[0_0_30px_rgba(0,229,140,0.3)]"
          />
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <span className="text-xs font-bold text-[#00e58c] uppercase tracking-widest bg-[#00e58c]/10 px-3 py-1 rounded-full border border-[#00e58c]/20">
            About CLASHX
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-3 mb-4">
            The Ultimate Tournament Dashboard
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4">
            :3
          </p>
          <p className="text-gray-400 text-xs italic">
            
          </p>
        </div>

      </div>
    </div>
  );
};

export default About;