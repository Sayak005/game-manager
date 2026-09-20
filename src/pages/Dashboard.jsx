import React, { useState, useEffect, useRef } from 'react';

const Dashboard = ({ currentUser }) => {
  const userKey = currentUser ? currentUser.username : 'guest';

  // --- STATE ARCHITECTURE ---
  const [tournamentName, setTournamentName] = useState('FC 26 ELITE LEAGUE');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('FC 26 ELITE LEAGUE');

  const [roster, setRoster] = useState([]); 
  const [league, setLeague] = useState([]); 
  const [matches, setMatches] = useState([]); 
  
  // Elimination Settings State
  const [isEliminationEnabled, setIsEliminationEnabled] = useState(false);
  const [eliminationThreshold, setEliminationThreshold] = useState(3);
  
  // Forms & UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('');
  const fileInputRef = useRef(null);
  
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerAvatar, setEditPlayerAvatar] = useState('');
  
  const [player1, setPlayer1] = useState('');
  const [score1, setScore1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [score2, setScore2] = useState('');

  // --- LOCAL STORAGE (User-Isolated) ---
  useEffect(() => {
    setTournamentName(localStorage.getItem(`clashx_v3_title_${userKey}`) || 'FC 26 ELITE LEAGUE');
    setRoster(JSON.parse(localStorage.getItem(`clashx_v3_roster_${userKey}`)) || []);
    setLeague(JSON.parse(localStorage.getItem(`clashx_v3_league_${userKey}`)) || []);
    setMatches(JSON.parse(localStorage.getItem(`clashx_v3_matches_${userKey}`)) || []);
    setIsEliminationEnabled(JSON.parse(localStorage.getItem(`clashx_v3_elim_enabled_${userKey}`)) || false);
    setEliminationThreshold(JSON.parse(localStorage.getItem(`clashx_v3_elim_threshold_${userKey}`)) || 3);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`clashx_v3_title_${userKey}`, tournamentName);
    localStorage.setItem(`clashx_v3_roster_${userKey}`, JSON.stringify(roster));
    localStorage.setItem(`clashx_v3_league_${userKey}`, JSON.stringify(league));
    localStorage.setItem(`clashx_v3_matches_${userKey}`, JSON.stringify(matches));
    localStorage.setItem(`clashx_v3_elim_enabled_${userKey}`, JSON.stringify(isEliminationEnabled));
    localStorage.setItem(`clashx_v3_elim_threshold_${userKey}`, JSON.stringify(eliminationThreshold));
  }, [tournamentName, roster, league, matches, isEliminationEnabled, eliminationThreshold, userKey]);

  // --- HELPERS ---
  const getPlayerInfo = (id) => roster.find(r => r.id === id) || { name: 'Unknown', avatar: '' };
  
  // Dynamically map and evaluate elimination status based on current losses vs threshold
  const activeStandings = league.map(l => {
    const isEliminated = isEliminationEnabled && l.l >= eliminationThreshold;
    return {
      ...l,
      eliminated: isEliminated,
      name: getPlayerInfo(l.id).name,
      avatar: getPlayerInfo(l.id).avatar
    };
  }).sort((a, b) => {
    // Push eliminated players to the bottom automatically
    if (a.eliminated && !b.eliminated) return 1;
    if (!a.eliminated && b.eliminated) return -1;
    return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
  });

  // Find player(s) with most goals for (GF)
  const topScorers = activeStandings.length > 0 
    ? activeStandings.reduce((maxList, player) => {
        if (maxList.length === 0 || player.gf > maxList[0].gf) return [player];
        if (player.gf === maxList[0].gf && player.gf > 0) return [...maxList, player];
        return maxList;
      }, [])
    : [];

  // --- ACTIONS ---
  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setTournamentName(tempTitle.trim().toUpperCase());
      setIsEditingTitle(false);
    }
  };

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => isEdit ? setEditPlayerAvatar(reader.result) : setNewPlayerAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    const avatarUrl = newPlayerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${newPlayerName}&backgroundColor=1f2937&textColor=00e58c`;
    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatar: avatarUrl,
      c_mp: 0, c_w: 0, c_d: 0, c_l: 0, c_gf: 0, c_ga: 0
    };
    
    setRoster([...roster, newPlayer]);
    setNewPlayerName('');
    setNewPlayerAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const addToLeague = (id) => {
    if (!league.find(l => l.id === id)) {
      setLeague([...league, { id, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]);
    }
  };

  const removeFromLeague = (id) => {
    setLeague(league.filter(l => l.id !== id));
    setMatches(matches.filter(m => m.p1Id !== id && m.p2Id !== id));
  };

  const deleteFromRoster = (id) => {
    if (window.confirm("Permanently delete this player? This removes them from the Master Roster and the Active League.")) {
      setRoster(roster.filter(r => r.id !== id));
      removeFromLeague(id);
    }
  };

  const handleFlushLeague = () => {
    if (window.confirm("Flush active tournament? This clears the standings table and active matches, but keeps all players in the Master Roster.")) {
      setLeague([]);
      setMatches([]);
    }
  };

  const handleLogMatch = (e) => {
    e.preventDefault();
    if (!player1 || !player2 || player1 === player2 || score1 === '' || score2 === '') return;

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    const updatedLeague = league.map(l => {
      let ul = { ...l };
      // Prevent logging matches for already eliminated players
      if (isEliminationEnabled && ul.l >= eliminationThreshold) return ul;

      if (l.id === player1) {
        ul.mp += 1; ul.gf += s1; ul.ga += s2; ul.gd = ul.gf - ul.ga;
        if (s1 > s2) { ul.w += 1; ul.pts += 3; } 
        else if (s1 === s2) { ul.d += 1; ul.pts += 1; } 
        else { ul.l += 1; }
      }
      if (l.id === player2) {
        ul.mp += 1; ul.gf += s2; ul.ga += s1; ul.gd = ul.gf - ul.ga;
        if (s2 > s1) { ul.w += 1; ul.pts += 3; } 
        else if (s2 === s1) { ul.d += 1; ul.pts += 1; } 
        else { ul.l += 1; }
      }
      return ul;
    });

    const updatedRoster = roster.map(r => {
      let ur = { ...r };
      if (r.id === player1) {
        ur.c_mp += 1; ur.c_gf += s1; ur.c_ga += s2;
        if (s1 > s2) ur.c_w += 1; else if (s1 === s2) ur.c_d += 1; else ur.c_l += 1;
      }
      if (r.id === player2) {
        ur.c_mp += 1; ur.c_gf += s2; ur.c_ga += s1;
        if (s2 > s1) ur.c_w += 1; else if (s2 === s1) ur.c_d += 1; else ur.c_l += 1;
      }
      return ur;
    });

    setLeague(updatedLeague);
    setRoster(updatedRoster);
    setMatches([{ id: Date.now(), p1Id: player1, s1, p2Id: player2, s2 }, ...matches]);
    setPlayer1(''); setPlayer2(''); setScore1(''); setScore2('');
  };

  const saveEdit = (id) => {
    if (!editPlayerName.trim()) return;
    setRoster(roster.map(r => r.id === id ? { ...r, name: editPlayerName.trim(), avatar: editPlayerAvatar || r.avatar } : r));
    setEditingPlayerId(null);
  };

  const getMedalIcon = (index, eliminated) => {
    if (eliminated) return <span className="text-red-500 font-bold text-xs uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">Eliminated</span>;
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="pl-1 text-gray-400 print:text-black">{index + 1}</span>;
  };

  const getRowStyle = (index, eliminated) => {
    if (eliminated) return 'opacity-50 bg-red-950/20 border-l-4 border-l-red-600 print:border-l-0';
    if (index === 0) return 'bg-[#1b2b22]/40 border-l-4 border-l-[#00e58c] print:border-l-0 print:bg-transparent print:border-b-2 print:border-gray-200';
    if (index === 1) return 'bg-white/5 border-l-4 border-l-gray-300 print:border-l-0 print:bg-transparent print:border-b-2 print:border-gray-200';
    if (index === 2) return 'bg-orange-900/10 border-l-4 border-l-orange-500 print:border-l-0 print:bg-transparent print:border-b-2 print:border-gray-200';
    return 'border-l-4 border-l-transparent hover:bg-white/5 print:border-l-0 print:bg-transparent print:border-b print:border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 font-sans pt-28 pb-16 px-6 lg:px-12 relative selection:bg-[#00e58c] selection:text-black print:bg-white print:text-black print:p-0 print:m-0">
      
      <div className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none print:hidden" style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/262/346/355/ea-sports-fc-26-sergio-busquets-football-inter-miami-cf-playstation-5-hd-wallpaper-preview.jpg')" }}></div>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-3xl pointer-events-none print:hidden"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto print:max-w-none print:w-full">
        
        {/* Top Header & Custom Tournament Title Editor */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
          
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={tempTitle} 
                  onChange={(e) => setTempTitle(e.target.value)} 
                  className="bg-[#22252e] border border-[#00e58c] text-white text-xl md:text-2xl font-black uppercase tracking-wide px-3 py-1 rounded outline-none"
                />
                <button onClick={handleSaveTitle} className="bg-[#00e58c] text-black font-bold px-3 py-2 rounded text-xs uppercase">Save</button>
                <button onClick={() => setIsEditingTitle(false)} className="bg-gray-700 text-white font-bold px-3 py-2 rounded text-xs uppercase">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setTempTitle(tournamentName); setIsEditingTitle(true); }}>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white group-hover:text-[#00e58c] transition-colors">
                  {tournamentName}
                </h1>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-[#00e58c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleFlushLeague} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Flush League Table
            </button>
            <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export to PDF
            </button>
          </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest text-black mb-2">{tournamentName}</h1>
          {topScorers.length > 0 && topScorers[0].gf > 0 && (
            <div className="mt-3 text-sm font-bold text-black uppercase tracking-wider">
              Most Goals: {topScorers.map(p => p.name).join(', ')} ({topScorers[0].gf} Goals)
            </div>
          )}
        </div>

        {/* GRID: STANDINGS & MATCH CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
          
          {/* ACTIVE STANDINGS TABLE */}
          <div className="lg:col-span-2 bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden print:shadow-none print:border-none print:bg-transparent">
            
            <div className="p-5 border-b border-white/5 flex justify-between items-center print:hidden">
              <h2 className="text-lg font-semibold text-white">Active League Standings</h2>
              {isEliminationEnabled && (
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full font-bold">
                  Auto-Elimination Active ({eliminationThreshold} Losses)
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className={`w-full text-left border-collapse print:text-black ${activeStandings.length > 0 ? 'min-w-[750px]' : 'min-w-full'} print:min-w-full`}>
                <thead className="bg-[#12141a] print:bg-transparent print:border-b-2 print:border-black">
                  <tr className="text-gray-400 print:text-black text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-28">Pos</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 text-center">MP</th>
                    <th className="py-3 px-4 text-center">W</th>
                    <th className="py-3 px-4 text-center">D</th>
                    <th className="py-3 px-4 text-center">L</th>
                    <th className="py-3 px-4 text-center">GF</th>
                    <th className="py-3 px-4 text-center">GA</th>
                    <th className="py-3 px-4 text-center">GD</th>
                    <th className="py-3 px-4 text-center text-white print:text-black">Pts</th>
                    <th className="py-3 px-4 text-center w-24 print:hidden">Remove</th> 
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {activeStandings.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center py-16 text-gray-500 print:text-black">
                        Table flushed. Add players from the Master Roster below to begin a new tournament.
                      </td>
                    </tr>
                  ) : (
                    activeStandings.map((player, index) => (
                      <tr key={player.id} className={`border-b border-white/5 transition-colors group print:text-black ${getRowStyle(index, player.eliminated)}`}>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="text-lg">{getMedalIcon(index, player.eliminated)}</span>
                          {!player.eliminated && <span className="text-gray-400 print:text-black text-xs w-4 text-right">{index + 1}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={player.avatar} alt={player.name} className="w-7 h-7 rounded-full border border-white/10 print:border-gray-300 object-cover bg-gray-800 print:hidden" />
                            <span className={`font-medium ${player.eliminated ? 'line-through text-gray-500' : 'text-gray-200 print:text-black'}`}>{player.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-400 print:text-gray-800">{player.mp}</td>
                        <td className="py-3 px-4 text-center">{player.w}</td>
                        <td className="py-3 px-4 text-center text-gray-400 print:text-gray-800">{player.d}</td>
                        <td className="py-3 px-4 text-center text-red-400 font-bold">{player.l}</td>
                        <td className="py-3 px-4 text-center text-gray-400 print:text-gray-800">{player.gf}</td>
                        <td className="py-3 px-4 text-center text-gray-400 print:text-gray-800">{player.ga}</td>
                        <td className="py-3 px-4 text-center text-gray-300 print:text-gray-800">{player.gd}</td>
                        <td className="py-3 px-4 text-center text-white print:text-black font-bold">{player.pts}</td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <button onClick={() => removeFromLeague(player.id)} className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remove from Active Tournament">
                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-200">
              <span className="font-black text-sm tracking-widest text-black">
                CLASH<span className="text-green-600">X</span>
              </span>
            </div>
          </div>

          {/* MATCH CENTER & ELIMINATION SETTINGS - Hidden on Print */}
          <div className="lg:col-span-1 flex flex-col gap-6 print:hidden">
            
            <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Auto-Elimination</h3>
                <input 
                  type="checkbox" 
                  checked={isEliminationEnabled} 
                  onChange={(e) => setIsEliminationEnabled(e.target.checked)} 
                  className="w-4 h-4 accent-[#00e58c] cursor-pointer"
                />
              </div>
              {isEliminationEnabled && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                  <label className="text-xs text-gray-400">Eliminate after losses:</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={eliminationThreshold} 
                    onChange={(e) => setEliminationThreshold(parseInt(e.target.value) || 1)} 
                    className="w-20 bg-[#22252e] border border-white/10 text-center text-sm rounded px-2 py-1 text-white outline-none focus:border-[#00e58c]"
                  />
                </div>
              )}
            </div>

            <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
              <h2 className="text-lg font-semibold text-white mb-4">Match Center</h2>
              <div className="bg-[#12141a]/50 border border-white/5 rounded-xl p-5 mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Log New Match</h3>
                <form onSubmit={handleLogMatch} className="flex flex-col gap-3">
                  <select required value={player1} onChange={(e) => setPlayer1(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-sm rounded-md p-2.5 focus:border-[#00e58c] outline-none text-white">
                    <option value="" disabled>Player 1</option>
                    {activeStandings.filter(p => !p.eliminated).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select required value={player2} onChange={(e) => setPlayer2(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-sm rounded-md p-2.5 focus:border-[#00e58c] outline-none text-white">
                    <option value="" disabled>Player 2</option>
                    {activeStandings.filter(p => !p.eliminated).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div className="flex items-center gap-2 mt-1">
                    <input required type="number" min="0" value={score1} onChange={(e) => setScore1(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-center rounded-md p-2.5 focus:border-[#00e58c] outline-none text-white" placeholder="Score 1" />
                    <span className="text-gray-500 font-bold">-</span>
                    <input required type="number" min="0" value={score2} onChange={(e) => setScore2(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-center rounded-md p-2.5 focus:border-[#00e58c] outline-none text-white" placeholder="Score 2" />
                  </div>
                  <button type="submit" className="w-full bg-[#00e58c] hover:bg-[#00c97b] text-black font-bold py-2.5 rounded-md mt-3 transition-colors text-sm shadow-lg">
                    Add Match
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white mb-1">Current Tournament Matches</h3>
                {matches.length === 0 ? (
                  <p className="text-gray-500 text-sm">No matches logged yet.</p>
                ) : (
                  matches.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex justify-between items-center text-sm px-2">
                      <span className="font-medium text-gray-300 w-1/3 truncate text-left">{getPlayerInfo(m.p1Id).name}</span>
                      <span className="font-bold text-white whitespace-nowrap tracking-widest">{m.s1} - {m.s2}</span>
                      <span className="font-medium text-gray-300 w-1/3 truncate text-right">{getPlayerInfo(m.p2Id).name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Create New Player</h3>
              <form onSubmit={handleCreatePlayer} className="flex flex-col gap-3">
                <input type="text" required value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Player Name" className="w-full bg-[#22252e] border border-white/10 text-sm rounded-md px-3 py-2.5 focus:border-[#00e58c] outline-none text-white" />
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#22252e] file:text-white hover:file:bg-[#2a2e39] cursor-pointer outline-none border border-white/10 rounded-md p-1" />
                <p className="text-[10px] text-gray-500 -mt-2">Leave image blank to generate avatar</p>
                <button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-md font-bold transition-colors text-sm">
                  Add to Master Roster
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* MASTER ROSTER & CAREER PANEL - Hidden on Print */}
        <div className="mt-8 bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col shadow-2xl overflow-hidden print:hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Master Roster & Lifetime Career Stats</h2>
            <p className="text-sm text-gray-400 mt-1">Manage all created players and add them to the active tournament above.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse ${roster.length > 0 ? 'min-w-[850px]' : 'min-w-full'}`}>
              <thead className="bg-[#12141a]">
                <tr className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Player</th>
                  <th className="py-3 px-4 text-center">Career MP</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Draws</th>
                  <th className="py-3 px-4 text-center">Losses</th>
                  <th className="py-3 px-4 text-center">Goals For</th>
                  <th className="py-3 px-4 text-center">Goals Against</th>
                  <th className="py-3 px-5 text-right">Actions</th> 
                </tr>
              </thead>
              <tbody className="text-sm">
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      Master roster is empty. Create a player using the form above.
                    </td>
                  </tr>
                ) : (
                  roster.map((player) => (
                    <React.Fragment key={player.id}>
                      {editingPlayerId === player.id ? (
                        <tr className="bg-white/10 border-b border-white/5">
                          <td colSpan="8" className="py-3 px-5">
                            <div className="flex flex-wrap items-center gap-4 bg-[#12141a]/80 p-2 rounded-lg border border-[#00e58c]/30">
                              <img src={editPlayerAvatar || player.avatar} alt="preview" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="text-xs text-gray-400 w-48 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#22252e] file:text-white hover:file:bg-[#2a2e39] cursor-pointer outline-none" />
                              <input type="text" value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)} className="flex-1 bg-[#22252e] border border-white/10 px-3 py-1.5 rounded text-white text-sm outline-none focus:border-[#00e58c]" placeholder="Player Name" />
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(player.id)} className="bg-[#00e58c] text-black px-4 py-1.5 rounded font-bold text-xs hover:bg-[#00c97b] transition-colors shadow-lg">Save</button>
                                <button onClick={() => setEditingPlayerId(null)} className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded font-bold text-xs hover:bg-red-500/40 transition-colors">Cancel</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full border border-white/10 object-cover bg-gray-800" />
                              <span className="text-gray-200 font-medium">{player.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-white font-bold">{player.c_mp}</td>
                          <td className="py-3 px-4 text-center text-[#00e58c]">{player.c_w}</td>
                          <td className="py-3 px-4 text-center text-gray-400">{player.c_d}</td>
                          <td className="py-3 px-4 text-center text-red-400">{player.c_l}</td>
                          <td className="py-3 px-4 text-center text-gray-300">{player.c_gf}</td>
                          <td className="py-3 px-4 text-center text-gray-500">{player.c_ga}</td>
                          <td className="py-3 px-5 flex items-center justify-end gap-4 h-full mt-1">
                            
                            {league.some(l => l.id === player.id) ? (
                              <span className="text-xs font-bold text-[#00e58c] bg-[#00e58c]/10 px-3 py-1.5 rounded-full border border-[#00e58c]/20">Active in League</span>
                            ) : (
                              <button onClick={() => addToLeague(player.id)} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/20">
                                + Add to League
                              </button>
                            )}

                            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                              <button onClick={() => { setEditingPlayerId(player.id); setEditPlayerName(player.name); setEditPlayerAvatar(player.avatar); }} className="text-gray-500 hover:text-white transition-colors" title="Edit Profile">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              </button>
                              <button onClick={() => deleteFromRoster(player.id)} className="text-gray-500 hover:text-red-500 transition-colors" title="Delete from Database">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;