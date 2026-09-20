import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = ({ currentUser, onSwitchUser }) => {
  const [savedAccounts, setSavedAccounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('clashx_accounts')) || [];
    setSavedAccounts(accounts);
  }, []);

  const handleSwitch = (acc) => {
    const sessionUser = { username: acc.username, avatar: acc.avatar };
    localStorage.setItem('clashx_user', JSON.stringify(sessionUser));
    onSwitchUser(sessionUser);
    navigate('/dashboard');
  };

  // --- DELETE ACCOUNT LOGIC ---
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${currentUser.username}"? This will permanently erase this account and all its isolated tournament data and master rosters.`
    );

    if (confirmDelete) {
      const userKey = currentUser.username;

      // 1. Remove user from saved accounts list
      const accounts = JSON.parse(localStorage.getItem('clashx_accounts')) || [];
      const updatedAccounts = accounts.filter(acc => acc.username !== userKey);
      localStorage.setItem('clashx_accounts', JSON.stringify(updatedAccounts));

      // 2. Wipe isolated storage files for this specific user
      localStorage.removeItem(`clashx_v3_title_${userKey}`);
      localStorage.removeItem(`clashx_v3_roster_${userKey}`);
      localStorage.removeItem(`clashx_v3_league_${userKey}`);
      localStorage.removeItem(`clashx_v3_matches_${userKey}`);
      localStorage.removeItem(`clashx_v3_elim_enabled_${userKey}`);
      localStorage.removeItem(`clashx_v3_elim_threshold_${userKey}`);

      // 3. Clear active session and log out
      localStorage.removeItem('clashx_user');
      onSwitchUser(null);
      navigate('/');
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">No Active Commander Found</h2>
        <p className="text-gray-400 mb-6">Please log in or create an account to view your profile.</p>
        <button onClick={() => navigate('/')} className="bg-[#00e58c] text-black font-bold px-6 py-3 rounded-lg">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Active Profile Card */}
      <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-6">
        <img 
          src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.username}&backgroundColor=1f2937&textColor=00e58c`} 
          alt={currentUser.username} 
          className="w-24 h-24 rounded-full border-4 border-[#00e58c] object-cover shadow-[0_0_20px_rgba(0,229,140,0.3)]"
        />
        <div className="text-center md:text-left flex-1">
          <span className="text-xs font-bold text-[#00e58c] uppercase tracking-widest bg-[#00e58c]/10 px-3 py-1 rounded-full border border-[#00e58c]/20">Active Profile</span>
          <h1 className="text-3xl font-black text-white mt-2">{currentUser.username}</h1>
          <p className="text-gray-400 text-sm mt-1">All tournament rosters and matches stored under this profile are completely isolated.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold px-5 py-3 rounded-xl transition-all text-sm shadow-lg"
          >
            Open Dashboard
          </button>
          
          {/* Delete Account Button */}
          <button 
            onClick={handleDeleteAccount}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold px-5 py-3 rounded-xl transition-all text-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Multiple Accounts Switcher Section */}
      <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Switch Offline Account</h2>
        <p className="text-sm text-gray-400 mb-6">Select another registered profile on this PC to load their distinct tournament progression.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedAccounts.map((acc) => {
            const isCurrent = acc.username === currentUser.username;
            return (
              <div 
                key={acc.username} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCurrent ? 'bg-[#1b2b22]/40 border-[#00e58c]/50' : 'bg-[#12141a]/50 border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3">
                  <img src={acc.avatar} alt={acc.username} className="w-10 h-10 rounded-full border border-white/10 object-cover bg-gray-800" />
                  <div>
                    <h3 className="font-bold text-white text-sm">{acc.username}</h3>
                    <span className="text-[10px] text-gray-400">{isCurrent ? 'Currently Active' : 'Saved Offline Account'}</span>
                  </div>
                </div>

                {!isCurrent && (
                  <button 
                    onClick={() => handleSwitch(acc)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    Switch
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Profile;