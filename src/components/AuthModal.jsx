import React, { useState, useRef } from 'react';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result); // Base64 string for local storage
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    const savedAccounts = JSON.parse(localStorage.getItem('clashx_accounts')) || [];

    if (isLogin) {
      const foundUser = savedAccounts.find(
        (acc) => acc.username.toLowerCase() === username.trim().toLowerCase() && acc.password === password
      );

      if (foundUser) {
        const sessionUser = { username: foundUser.username, avatar: foundUser.avatar };
        localStorage.setItem('clashx_user', JSON.stringify(sessionUser));
        onLoginSuccess(sessionUser);
        onClose();
        resetForm();
      } else {
        setErrorMsg('Invalid username or password.');
      }
    } else {
      const userExists = savedAccounts.some(
        (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (userExists) {
        setErrorMsg('Username already exists. Choose a different name or log in.');
        return;
      }

      // Fallback avatar if user didn't upload one
      const userAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=1f2937&textColor=00e58c`;

      const newAccount = { username: username.trim(), password, avatar: userAvatar };
      const updatedAccounts = [...savedAccounts, newAccount];
      localStorage.setItem('clashx_accounts', JSON.stringify(updatedAccounts));

      const sessionUser = { username: newAccount.username, avatar: newAccount.avatar };
      localStorage.setItem('clashx_user', JSON.stringify(sessionUser));
      
      onLoginSuccess(sessionUser);
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setAvatar('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div className="relative z-10 w-full max-w-md bg-[#1a1d24]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="font-extrabold text-2xl tracking-widest text-white mb-1">
            CLASH<span className="text-[#00e58c]">X</span>
          </div>
          <p className="text-sm text-gray-400">
            {isLogin ? 'Log in to your offline profile.' : 'Register a new offline gamer profile.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold p-3 rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Username</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="e.g. StrikerOne" 
              className="w-full bg-[#12141a] border border-white/10 text-sm rounded-lg px-4 py-3 text-white outline-none focus:border-[#00e58c] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full bg-[#12141a] border border-white/10 text-sm rounded-lg px-4 py-3 text-white outline-none focus:border-[#00e58c] transition-colors"
            />
          </div>

          {/* Profile Picture Upload (Only shown on Sign Up) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Profile Picture (Optional)</label>
              <div className="flex items-center gap-3">
                <img 
                  src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=preview&backgroundColor=1f2937&textColor=00e58c`} 
                  alt="avatar preview" 
                  className="w-10 h-10 rounded-full border border-white/10 object-cover bg-gray-800"
                />
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload} 
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#22252e] file:text-white hover:file:bg-[#2a2e39] cursor-pointer outline-none border border-white/10 rounded-lg p-1 bg-[#12141a]"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold py-3 rounded-lg mt-2 transition-all text-sm tracking-wider shadow-[0_0_20px_rgba(0,229,140,0.3)] hover:scale-[1.02] active:scale-95"
          >
            {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            {isLogin ? "Need a new account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
              className="text-[#00e58c] font-bold hover:underline ml-1"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;