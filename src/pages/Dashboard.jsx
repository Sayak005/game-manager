import React, { useState, useEffect, useRef } from 'react';

const Dashboard = ({ currentUser }) => {
  const userKey = currentUser ? currentUser.username : 'guest';

  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'knockouts'

  // --- TOURNAMENT TITLE & CONFIG ---
  const [tournamentName, setTournamentName] = useState('FC 26 ELITE LEAGUE');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('FC 26 ELITE LEAGUE');

  // --- DATA STATES ---
  const [roster, setRoster] = useState([]); 
  const [groups, setGroups] = useState([
    { id: 'g1', name: 'Group A', playerIds: [] },
    { id: 'g2', name: 'Group B', playerIds: [] }
  ]); 
  const [groupStandings, setGroupStandings] = useState({}); 
  const [matches, setMatches] = useState([]); 
  const [knockoutRounds, setKnockoutRounds] = useState([]);

  // User configurable custom Top K qualifiers per group
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);

  // Forms & UI State
  const [newGroupName, setNewGroupName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState('85'); // New Skill Rating (out of 100)
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('');
  const fileInputRef = useRef(null);
  
  const [matchGroup, setMatchGroup] = useState('');
  const [player1, setPlayer1] = useState('');
  const [score1, setScore1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [score2, setScore2] = useState('');

  // --- LOCAL STORAGE ---
  useEffect(() => {
    setTournamentName(localStorage.getItem(`clashx_v13_title_${userKey}`) || 'FC 26 ELITE LEAGUE');
    setRoster(JSON.parse(localStorage.getItem(`clashx_v13_roster_${userKey}`)) || []);
    setGroups(JSON.parse(localStorage.getItem(`clashx_v13_groups_${userKey}`)) || [
      { id: 'g1', name: 'Group A', playerIds: [] },
      { id: 'g2', name: 'Group B', playerIds: [] }
    ]);
    setGroupStandings(JSON.parse(localStorage.getItem(`clashx_v13_standings_${userKey}`)) || {});
    setMatches(JSON.parse(localStorage.getItem(`clashx_v13_matches_${userKey}`)) || []);
    setKnockoutRounds(JSON.parse(localStorage.getItem(`clashx_v13_knockouts_${userKey}`)) || []);
    setQualifiersPerGroup(JSON.parse(localStorage.getItem(`clashx_v13_qualifiers_${userKey}`)) || 2);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`clashx_v13_title_${userKey}`, tournamentName);
    localStorage.setItem(`clashx_v13_roster_${userKey}`, JSON.stringify(roster));
    localStorage.setItem(`clashx_v13_groups_${userKey}`, JSON.stringify(groups));
    localStorage.setItem(`clashx_v13_standings_${userKey}`, JSON.stringify(groupStandings));
    localStorage.setItem(`clashx_v13_matches_${userKey}`, JSON.stringify(matches));
    localStorage.setItem(`clashx_v13_knockouts_${userKey}`, JSON.stringify(knockoutRounds));
    localStorage.setItem(`clashx_v13_qualifiers_${userKey}`, JSON.stringify(qualifiersPerGroup));
  }, [tournamentName, roster, groups, groupStandings, matches, knockoutRounds, qualifiersPerGroup, userKey]);

  const getPlayerInfo = (id) => roster.find(r => r.id === id) || { name: 'Unknown', avatar: '', rating: 75 };

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPlayerAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- GROUP ACTIONS ---
  const handleAddGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    const updatedGroups = [
      ...groups, 
      { id: Date.now().toString(), name: newGroupName.trim(), playerIds: [] },
      { id: (Date.now() + 1).toString(), name: `${newGroupName.trim()} (Pair)`, playerIds: [] }
    ];
    
    setGroups(updatedGroups);
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupId) => {
    if (groups.length <= 2) {
      alert("Tournaments must maintain at least 2 groups to structure brackets properly!");
      return;
    }
    if (window.confirm("Delete this group pair?")) {
      setGroups(groups.filter(g => g.id !== groupId));
    }
  };

  const assignPlayerToGroup = (playerId, groupId) => {
    const updated = groups.map(g => {
      const filteredIds = g.playerIds.filter(id => id !== playerId);
      if (g.id === groupId) {
        return { ...g, playerIds: [...filteredIds, playerId] };
      }
      return { ...g, playerIds: filteredIds };
    });
    setGroups(updated);

    if (!groupStandings[playerId]) {
      setGroupStandings({
        ...groupStandings,
        [playerId]: { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
      });
    }
  };

  const removePlayerFromGroup = (playerId, groupId) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, playerIds: g.playerIds.filter(id => id !== playerId) };
      }
      return g;
    });
    setGroups(updated);
  };

  // --- ⚖️ SKILL-BALANCED RANDOMIZER ALGORITHM ---
  const handleBalancedRandomize = () => {
    if (roster.length === 0) {
      alert("Master roster is empty! Add players with ratings before balancing.");
      return;
    }

    // Sort players by rating (highest to lowest) to implement snake draft balancing
    const sortedRoster = [...roster].sort((a, b) => b.rating - a.rating);
    const newGroups = groups.map(g => ({ ...g, playerIds: [] }));
    const newStandings = { ...groupStandings };

    // Snake draft distribution (ensures fair team strength spread across groups)
    let forward = true;
    let groupIdx = 0;

    sortedRoster.forEach((player) => {
      newGroups[groupIdx].playerIds.push(player.id);

      if (!newStandings[player.id]) {
        newStandings[player.id] = { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      }

      if (forward) {
        groupIdx++;
        if (groupIdx >= newGroups.length) {
          groupIdx = newGroups.length - 1;
          forward = false;
        }
      } else {
        groupIdx--;
        if (groupIdx < 0) {
          groupIdx = 0;
          forward = true;
        }
      }
    });

    setGroups(newGroups);
    setGroupStandings(newStandings);
    alert("Successfully created skill-balanced groups based on player ratings!");
  };

  // --- ROSTER ACTIONS ---
  const handleCreatePlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    const avatarUrl = (newPlayerAvatar && newPlayerAvatar.trim() !== '') 
      ? newPlayerAvatar 
      : `https://api.dicebear.com/7.x/initials/svg?seed=${newPlayerName}&backgroundColor=1f2937&textColor=00e58c`;

    const parsedRating = Math.min(100, Math.max(1, parseInt(newPlayerRating) || 75));

    const newPlayer = { 
      id: Date.now().toString(), 
      name: newPlayerName.trim(), 
      rating: parsedRating,
      avatar: avatarUrl, 
      c_mp: 0, c_w: 0, c_d: 0, c_l: 0, c_gf: 0, c_ga: 0 
    };
    
    setRoster([...roster, newPlayer]);
    setNewPlayerName('');
    setNewPlayerRating('85');
    setNewPlayerAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteFromRoster = (id) => {
    if (window.confirm("Delete player from master roster?")) {
      setRoster(roster.filter(r => r.id !== id));
      setGroups(groups.map(g => ({ ...g, playerIds: g.playerIds.filter(pId => pId !== id) })));
    }
  };

  // --- MATCH LOGGING ---
  const handleLogMatch = (e) => {
    e.preventDefault();
    if (!matchGroup || !player1 || !player2 || player1 === player2 || score1 === '' || score2 === '') return;

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    const updateStats = (statsObj, pId, goalsFor, goalsAgainst, won, drawn, lost) => {
      const current = statsObj[pId] || { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      const newMp = current.mp + 1;
      const newGf = current.gf + goalsFor;
      const newGa = current.ga + goalsAgainst;
      const newL = current.l + (lost ? 1 : 0);
      return {
        ...current,
        mp: newMp,
        w: current.w + (won ? 1 : 0),
        d: current.d + (drawn ? 1 : 0),
        l: newL,
        gf: newGf,
        ga: newGa,
        gd: newGf - newGa,
        pts: current.pts + (won ? 3 : drawn ? 1 : 0)
      };
    };

    const newStandings = { ...groupStandings };
    const p1Won = s1 > s2;
    const p2Won = s2 > s1;
    const isDraw = s1 === s2;

    newStandings[player1] = updateStats(newStandings, player1, s1, s2, p1Won, isDraw, !p1Won && !isDraw);
    newStandings[player2] = updateStats(newStandings, player2, s2, s1, p2Won, isDraw, !p2Won && !isDraw);

    setGroupStandings(newStandings);
    setMatches([{ id: Date.now(), groupId: matchGroup, p1Id: player1, s1, p2Id: player2, s2 }, ...matches]);
    setPlayer1(''); setPlayer2(''); setScore1(''); setScore2('');
  };

  const handleFlushLeague = () => {
    if (window.confirm("Reset all group standings and match logs?")) {
      setGroupStandings({});
      setMatches([]);
      setKnockoutRounds([]);
    }
  };

  // --- KNOCKOUT BRACKET GENERATOR ---
  const generateKnockouts = () => {
    let qualifiers = [];
    groups.forEach(g => {
      const sortedGroupPlayers = g.playerIds
        .map(id => ({ id, ...(groupStandings[id] || { pts: 0, gd: 0, gf: 0 }) }))
        .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      
      const topK = sortedGroupPlayers.slice(0, qualifiersPerGroup);
      qualifiers.push(...topK);
    });

    if (qualifiers.length < 2) {
      alert("At least 2 qualified players are required across groups to build knockout brackets!");
      return;
    }

    let targetSize = 2;
    while (targetSize * 2 <= qualifiers.length) {
      targetSize *= 2;
    }
    
    if (qualifiers.length !== targetSize) {
      const proceed = window.confirm(
        `Total qualifiers is ${qualifiers.length}. Trim automatically to top ${targetSize} players for clean pairing?`
      );
      if (!proceed) return;
      qualifiers = qualifiers.slice(0, targetSize);
    }

    const firstRoundMatches = [];
    for (let i = 0; i < qualifiers.length; i += 2) {
      if (qualifiers[i + 1]) {
        firstRoundMatches.push({
          id: Date.now() + i,
          p1Id: qualifiers[i].id,
          s1: '',
          p2Id: qualifiers[i + 1].id,
          s2: '',
          winnerId: null,
          loserId: null
        });
      }
    }

    let roundTitle = "Quarterfinals";
    if (firstRoundMatches.length === 1) roundTitle = "Grand Final";
    else if (firstRoundMatches.length === 2) roundTitle = "Semifinals";
    else if (firstRoundMatches.length === 4) roundTitle = "Quarterfinals";
    else if (firstRoundMatches.length >= 8) roundTitle = "Round of 16";

    setKnockoutRounds([{ title: roundTitle, matches: firstRoundMatches }]);
    setActiveTab('knockouts');
  };

  const updateKnockoutScore = (roundIndex, matchId, s1, s2) => {
    const updatedRounds = [...knockoutRounds];
    const currentRound = updatedRounds[roundIndex];

    const updatedMatches = currentRound.matches.map(m => {
      if (m.id === matchId) {
        let winner = null;
        let loser = null;
        if (s1 !== '' && s2 !== '' && !isNaN(s1) && !isNaN(s2)) {
          if (s1 === s2) {
            alert("Knockout matches cannot end in a draw!");
            return m;
          }
          winner = s1 > s2 ? m.p1Id : m.p2Id;
          loser = s1 > s2 ? m.p2Id : m.p1Id;
        }
        return { ...m, s1, s2, winnerId: winner, loserId: loser };
      }
      return m;
    });

    updatedRounds[roundIndex].matches = updatedMatches;

    if (updatedMatches.every(m => m.winnerId !== null)) {
      updatedRounds.splice(roundIndex + 1);

      const winners = updatedMatches.map(m => m.winnerId);
      if (winners.length > 1) {
        const nextRoundMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
          if (winners[i + 1]) {
            nextRoundMatches.push({
              id: Date.now() + i,
              p1Id: winners[i],
              s1: '',
              p2Id: winners[i + 1],
              s2: '',
              winnerId: null,
              loserId: null
            });
          }
        }

        let nextTitle = "Semifinals";
        if (nextRoundMatches.length === 1) nextTitle = "🏆 Grand Final";
        else if (nextRoundMatches.length === 2) nextTitle = "Semifinals";
        else if (nextRoundMatches.length === 4) nextTitle = "Quarterfinals";

        updatedRounds.push({ title: nextTitle, matches: nextRoundMatches });
      }
    }

    setKnockoutRounds(updatedRounds);
  };

  const totalMatchesLogged = matches.length;
  const totalPlayersInGroups = groups.reduce((acc, g) => acc + g.playerIds.length, 0);
  const estimatedGroupMatches = Math.max(1, Math.floor((totalPlayersInGroups * (totalPlayersInGroups - 1)) / 2));
  const completionPercentage = Math.min(100, Math.round((totalMatchesLogged / estimatedGroupMatches) * 100));

  return (
    <div className="min-h-screen bg-[#060913] text-gray-100 font-sans pt-28 pb-16 px-6 lg:px-12 relative selection:bg-[#00e58c] selection:text-black">
      
      <div className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop')" }}></div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#060913]/80 via-[#060913]/95 to-[#060913] pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-[#121622]/60 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="bg-[#1a1f2c] border border-[#00e58c] text-white text-xl md:text-2xl font-black uppercase px-4 py-2 rounded-xl outline-none" />
                <button onClick={() => { if (tempTitle.trim()) { setTournamentName(tempTitle.trim().toUpperCase()); setIsEditingTitle(false); } }} className="bg-[#00e58c] text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase shadow-[0_0_15px_rgba(0,229,140,0.4)]">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setTempTitle(tournamentName); setIsEditingTitle(true); }}>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white group-hover:text-[#00e58c] transition-colors">
                  TOURNAMENT: <span className="text-[#00e58c]">{tournamentName}</span>
                </h1>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-[#00e58c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setActiveTab('groups')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'groups' ? 'bg-[#00e58c] text-black shadow-[0_0_20px_rgba(0,229,140,0.4)]' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>Group Stage</button>
            <button onClick={() => setActiveTab('knockouts')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'knockouts' ? 'bg-[#00e58c] text-black shadow-[0_0_20px_rgba(0,229,140,0.4)]' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>Knockout Brackets</button>
            <button onClick={handleFlushLeague} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors">Flush Table</button>
          </div>
        </div>

        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span>Tournament Group Stage Progress</span>
                  <span className="text-[#00e58c]">{completionPercentage}% Completed</span>
                </div>
                <div className="w-full bg-[#1a1f2c] h-3 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-[#00b06b] to-[#00e58c] h-full transition-all duration-500 shadow-[0_0_12px_rgba(0,229,140,0.5)]" style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>

              <div className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                <form onSubmit={handleAddGroup} className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Add Group Pair Name (e.g. Group C & D)" className="bg-[#1a1f2c] border border-white/10 text-sm rounded-xl px-4 py-3 text-white outline-none focus:border-[#00e58c] flex-1 transition-colors" />
                  <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all border border-white/10">+ Add Pair</button>
                </form>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBalancedRandomize} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-indigo-400/30"
                    title="Skill-balanced distribution using player ratings"
                  >
                    ⚖️ Balanced Randomize
                  </button>
                  <div className="flex items-center gap-2 bg-[#1a1f2c] border border-white/10 px-3 py-2 rounded-xl">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Top (N):</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={qualifiersPerGroup} 
                      onChange={(e) => setQualifiersPerGroup(Math.max(1, parseInt(e.target.value) || 1))} 
                      className="w-12 bg-transparent text-white text-xs font-black text-center outline-none"
                    />
                  </div>
                </div>
              </div>

              {groups.map((group) => {
                const groupPlayers = group.playerIds.map(id => {
                  const stats = groupStandings[id] || { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
                  return { id, ...stats, ...getPlayerInfo(id) };
                }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

                return (
                  <div key={group.id} className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-5 bg-[#1a1f2c]/50 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-black uppercase text-white tracking-widest text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00e58c] shadow-[0_0_8px_rgba(0,229,140,0.8)]"></span>
                        {group.name}
                      </h3>
                      <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-400 hover:text-red-400 text-xs font-semibold transition-colors">Delete Group</button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-[11px] uppercase tracking-wider bg-[#0a0e17]/60 border-b border-white/5">
                            <th className="py-3 px-4 w-20">Pos</th>
                            <th className="py-3 px-4">Player</th>
                            <th className="py-3 px-4 text-center">OVR</th>
                            <th className="py-3 px-4 text-center">MP</th>
                            <th className="py-3 px-4 text-center">W</th>
                            <th className="py-3 px-4 text-center">D</th>
                            <th className="py-3 px-4 text-center">L</th>
                            <th className="py-3 px-4 text-center">GF</th>
                            <th className="py-3 px-4 text-center">GA</th>
                            <th className="py-3 px-4 text-center">GD</th>
                            <th className="py-3 px-4 text-center text-white">Pts</th>
                            <th className="py-3 px-4 text-center w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {groupPlayers.length === 0 ? (
                            <tr>
                              <td colSpan="12" className="text-center py-8 text-gray-500 italic">No players assigned to this group yet.</td>
                            </tr>
                          ) : (
                            groupPlayers.map((p, idx) => (
                              <tr key={p.id} className={`border-b border-white/5 transition-colors ${idx < qualifiersPerGroup ? 'bg-[#14261f]/50 border-l-4 border-l-[#00e58c]' : 'hover:bg-white/5'}`}>
                                <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                  {idx < qualifiersPerGroup && <span className="text-[10px] text-[#00e58c] font-black uppercase ml-1 bg-[#00e58c]/10 px-2 py-0.5 rounded border border-[#00e58c]/20">Q</span>}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={p.avatar} 
                                      alt={p.name} 
                                      className="w-8 h-8 rounded-full object-cover bg-gray-800 border border-white/10 shrink-0 shadow-md" 
                                      onError={(e) => {
                                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}&backgroundColor=1f2937&textColor=00e58c`;
                                      }}
                                    />
                                    <span className="font-bold text-white">{p.name}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center font-black text-indigo-400">{p.rating || 75}</td>
                                <td className="py-3.5 px-4 text-center text-gray-400">{p.mp}</td>
                                <td className="py-3.5 px-4 text-center font-semibold text-white">{p.w}</td>
                                <td className="py-3.5 px-4 text-center text-gray-400">{p.d}</td>
                                <td className="py-3.5 px-4 text-center text-red-400 font-semibold">{p.l}</td>
                                <td className="py-3.5 px-4 text-center text-gray-400">{p.gf}</td>
                                <td className="py-3.5 px-4 text-center text-gray-400">{p.ga}</td>
                                <td className="py-3.5 px-4 text-center text-gray-300 font-medium">{p.gd > 0 ? `+${p.gd}` : p.gd}</td>
                                <td className="py-3.5 px-4 text-center font-black text-white">{p.pts}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <button onClick={() => removePlayerFromGroup(p.id, group.id)} className="text-gray-500 hover:text-red-400 font-bold p-1 rounded transition-colors" title="Remove from Group">✕</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div className="text-center pt-4">
                <button onClick={generateKnockouts} className="bg-[#00e58c] hover:bg-[#00c97b] text-black font-black px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,229,140,0.4)] text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95">
                  Generate Knockout Brackets (Top {qualifiersPerGroup} per Group) ➔
                </button>
              </div>

            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              
              <div className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Match Center</h3>
                <div className="bg-[#0a0e17]/60 border border-white/5 rounded-2xl p-5 mb-5 shadow-inner">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Log New Match</h4>
                  <form onSubmit={handleLogMatch} className="flex flex-col gap-3.5">
                    <select required value={matchGroup} onChange={(e) => setMatchGroup(e.target.value)} className="w-full bg-[#1a1f2c] border border-white/10 text-sm rounded-xl p-3 outline-none text-white focus:border-[#00e58c] transition-colors">
                      <option value="" disabled>Select Group</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>

                    {matchGroup && (
                      <>
                        <select required value={player1} onChange={(e) => setPlayer1(e.target.value)} className="w-full bg-[#1a1f2c] border border-white/10 text-sm rounded-xl p-3 outline-none text-white focus:border-[#00e58c] transition-colors">
                          <option value="" disabled>Player 1</option>
                          {groups.find(g => g.id === matchGroup)?.playerIds.map(id => (
                            <option key={id} value={id}>{getPlayerInfo(id).name}</option>
                          ))}
                        </select>

                        <select required value={player2} onChange={(e) => setPlayer2(e.target.value)} className="w-full bg-[#1a1f2c] border border-white/10 text-sm rounded-xl p-3 outline-none text-white focus:border-[#00e58c] transition-colors">
                          <option value="" disabled>Player 2</option>
                          {groups.find(g => g.id === matchGroup)?.playerIds.map(id => {
                            if (id === player1) return null;
                            return <option key={id} value={id}>{getPlayerInfo(id).name}</option>;
                          })}
                        </select>

                        <div className="flex items-center gap-3">
                          <input required type="number" min="0" value={score1} onChange={(e) => setScore1(e.target.value)} placeholder="0" className="w-full bg-[#1a1f2c] border border-white/10 text-center rounded-xl p-3 text-white font-bold outline-none focus:border-[#00e58c]" />
                          <span className="font-black text-gray-500">-</span>
                          <input required type="number" min="0" value={score2} onChange={(e) => setScore2(e.target.value)} placeholder="0" className="w-full bg-[#1a1f2c] border border-white/10 text-center rounded-xl p-3 text-white font-bold outline-none focus:border-[#00e58c]" />
                        </div>

                        <button type="submit" className="w-full bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold py-3.5 rounded-xl mt-2 text-sm shadow-[0_0_20px_rgba(0,229,140,0.3)] transition-all">Add Match</button>
                      </>
                    )}
                  </form>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Recent Matches</h4>
                  {matches.length === 0 ? (
                    <p className="text-gray-500 text-xs italic">No matches logged yet.</p>
                  ) : (
                    matches.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex justify-between items-center text-xs bg-[#1a1f2c]/50 p-3 rounded-xl border border-white/5">
                        <span className="font-bold text-gray-200 w-1/3 truncate text-left">{getPlayerInfo(m.p1Id).name}</span>
                        <span className="font-black text-[#00e58c] whitespace-nowrap px-2 py-1 bg-black/40 rounded-lg">{m.s1} - {m.s2}</span>
                        <span className="font-bold text-gray-200 w-1/3 truncate text-right">{getPlayerInfo(m.p2Id).name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Master Roster with Rating Input */}
              <div className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Master Roster & Ratings</h3>
                <form onSubmit={handleCreatePlayer} className="flex flex-col gap-3.5 mb-6">
                  <div className="flex gap-2">
                    <input type="text" required value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Player Name" className="bg-[#1a1f2c] border border-white/10 text-sm rounded-xl px-4 py-3 text-white outline-none focus:border-[#00e58c] flex-1 transition-colors" />
                    <div className="flex flex-col w-20">
                      <input type="number" min="1" max="100" title="Overall Rating (1-100)" value={newPlayerRating} onChange={(e) => setNewPlayerRating(e.target.value)} placeholder="OVR" className="bg-[#1a1f2c] border border-white/10 text-sm rounded-xl px-2 py-3 text-center text-indigo-400 font-black outline-none focus:border-[#00e58c]" />
                    </div>
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="text-xs text-gray-400 border border-white/10 rounded-xl p-2 bg-[#1a1f2c] cursor-pointer" />
                  <button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all">Create Player</button>
                </form>

                <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {roster.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-[#1a1f2c]/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={player.avatar} 
                          alt={player.name} 
                          className="w-8 h-8 rounded-full object-cover bg-gray-800 border border-white/10 shrink-0 shadow-md" 
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.name}&backgroundColor=1f2937&textColor=00e58c`;
                          }}
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{player.name}</span>
                          <span className="text-[10px] font-black text-indigo-400">OVR: {player.rating || 75}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select onChange={(e) => { if(e.target.value) assignPlayerToGroup(player.id, e.target.value); e.target.value = ""; }} defaultValue="" className="bg-[#121622] border border-white/10 text-[11px] text-gray-300 font-bold rounded-lg p-2 outline-none cursor-pointer">
                          <option value="" disabled>+ Group</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <button onClick={() => deleteFromRoster(player.id)} className="text-gray-500 hover:text-red-400 font-bold text-sm px-1.5 py-0.5 rounded transition-colors" title="Delete">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'knockouts' && (
          <div className="bg-[#121622]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-extrabold text-[#00e58c] uppercase tracking-widest bg-[#00e58c]/10 px-4 py-1.5 rounded-full border border-[#00e58c]/20">Championship Brackets</span>
              <h2 className="text-3xl font-black uppercase text-white tracking-widest mt-3">Dynamic Multi-Stage Knockouts</h2>
              <p className="text-xs text-gray-400 mt-1">Losers are instantly eliminated per round. Winners advance to the next bracket level.</p>
            </div>

            {knockoutRounds.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-sm">No knockout rounds generated yet.</p>
                <button onClick={() => setActiveTab('groups')} className="mt-4 bg-[#00e58c] text-black font-extrabold px-8 py-3 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,140,0.3)]">Go to Group Stage to Generate</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {knockoutRounds.map((round, roundIdx) => (
                  <div key={roundIdx} className="flex flex-col gap-4">
                    <h3 className="text-xs font-black uppercase text-[#00e58c] tracking-widest text-center border-b border-white/10 pb-3">{round.title}</h3>
                    
                    <div className="flex flex-col gap-4">
                      {round.matches.map((m, matchIdx) => (
                        <div key={m.id} className="bg-[#0a0e17]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">Match {matchIdx + 1}</span>
                          
                          <div className={`flex justify-between items-center text-sm p-2 rounded-xl bg-[#1a1f2c]/50 border border-white/5 ${m.loserId === m.p1Id ? 'bg-red-950/20 opacity-30 line-through' : ''}`}>
                            <span className={m.winnerId === m.p1Id ? "font-black text-[#00e58c]" : "text-gray-200"}>{getPlayerInfo(m.p1Id).name}</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={m.s1 !== '' ? m.s1 : ''} 
                              onChange={(e) => updateKnockoutScore(roundIdx, m.id, e.target.value === '' ? '' : parseInt(e.target.value), m.s2)} 
                              placeholder="0"
                              className="w-14 bg-[#121622] border border-white/20 text-center rounded-lg text-white text-xs py-2 font-black outline-none focus:border-[#00e58c]" 
                            />
                          </div>

                          <div className={`flex justify-between items-center text-sm p-2 rounded-xl bg-[#1a1f2c]/50 border border-white/5 ${m.loserId === m.p2Id ? 'bg-red-950/20 opacity-30 line-through' : ''}`}>
                            <span className={m.winnerId === m.p2Id ? "font-black text-[#00e58c]" : "text-gray-200"}>{getPlayerInfo(m.p2Id).name}</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={m.s2 !== '' ? m.s2 : ''} 
                              onChange={(e) => updateKnockoutScore(roundIdx, m.id, m.s1, e.target.value === '' ? '' : parseInt(e.target.value))} 
                              placeholder="0"
                              className="w-14 bg-[#121622] border border-white/20 text-center rounded-lg text-white text-xs py-2 font-black outline-none focus:border-[#00e58c]" 
                            />
                          </div>
                          
                          {m.loserId && <span className="text-[10px] text-red-400 font-extrabold text-center bg-red-500/10 py-1 rounded-lg border border-red-500/20">❌ Eliminated: {getPlayerInfo(m.loserId).name}</span>}
                          
                          {round.title.includes('Grand Final') && m.winnerId && (
                            <div className="text-center bg-[#00e58c]/15 py-3 rounded-xl text-[#00e58c] font-black text-xs uppercase tracking-widest mt-1 border border-[#00e58c]/40 shadow-[0_0_15px_rgba(0,229,140,0.3)] animate-pulse">
                              🎉 Champion: {getPlayerInfo(m.winnerId).name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;