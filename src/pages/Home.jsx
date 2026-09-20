import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#050811] text-white font-sans selection:bg-emerald-500 selection:text-black pb-20">
      
      {/* 
        CHANGED: max-w-5xl is now max-w-7xl (1280px wide). 
        Added lg:px-12 to perfectly align with standard wide navbars. 
      */}
      <main className="max-w-7xl mx-auto pt-12 px-6 lg:px-12 flex flex-col gap-10 w-full">
        
        {/* Header Section */}
        <div className="text-center mt-8 mb-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Select Your Game
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl mx-auto">
            Choose your game to generate custom tournament brackets, manage live scores, and track player standings.
          </p>
        </div>

        {/* FC 26 Active Card */}
        <Link 
          to="/dashboard" 
          className="group relative w-full h-[300px] rounded-3xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-500 block shadow-lg hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] bg-[#0a0f1c]"
        >
          {/* Background Image with Smooth Zoom */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/262/346/355/ea-sports-fc-26-sergio-busquets-football-inter-miami-cf-playstation-5-hd-wallpaper-preview.jpg')" }}
          ></div>
          
          {/* Refined Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Card Content Area */}
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
            <div className="flex justify-between items-end w-full">
              
              {/* Left Side: Titles */}
              <div className="flex flex-col gap-3 transform transition-transform duration-500 group-hover:-translate-y-2">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white italic tracking-widest drop-shadow-md">
                  EA SPORTS FC 26
                </h2>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-500/10 backdrop-blur-md px-4 py-2 rounded-full w-fit border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ACTIVE • CUSTOM LEAGUE
                </div>
              </div>
              
              {/* Right Side: Button */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-8 rounded-full group-hover:bg-emerald-500 group-hover:text-[#050811] group-hover:border-emerald-500 transition-all duration-300 text-sm shadow-xl transform group-hover:scale-105 flex items-center gap-2">
                Manage League 
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>

            </div>
          </div>
        </Link>

        {/* Valorant Coming Soon Card */}
        <div className="relative w-full h-[220px] rounded-3xl overflow-hidden border border-white/5 opacity-70 grayscale cursor-not-allowed group bg-[#0a0f1c]">
          
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltc94ce70de92ba877/637d402cefd216447814b77f/Valorant_2022_EP5-3_PlayVALORANT_Content-Article_1920x1080.jpg')" }}
          ></div>
          
          {/* Heavy Frosted Overlay */}
          <div className="absolute inset-0 bg-[#050811]/70 backdrop-blur-[2px]"></div>
          
          {/* Card Content - Centered */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8">
             <div className="bg-white/5 text-gray-400 text-[10px] font-black px-4 py-2 rounded-full mb-4 tracking-[0.3em] uppercase border border-white/10 backdrop-blur-md shadow-inner">
                COMING SOON
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-white/50 tracking-[0.2em] uppercase drop-shadow-sm">
                VALORANT
             </h2>
             <p className="text-gray-500 mt-3 max-w-md text-sm font-medium">
                Bracket management, agent stats, and custom score tracking for competitive 5v5 custom lobbies.
             </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Home;