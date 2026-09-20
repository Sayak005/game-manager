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
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('');
  const fileInputRef = useRef(null);
  
  const [matchGroup, setMatchGroup] = useState('');
  const [player1, setPlayer1] = useState('');
  const [score1, setScore1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [score2, setScore2] = useState('');

  // --- LOCAL STORAGE ---
  useEffect(() => {
    setTournamentName(localStorage.getItem(`clashx_v11_title_${userKey}`) || 'FC 26 ELITE LEAGUE');
    setRoster(JSON.parse(localStorage.getItem(`clashx_v11_roster_${userKey}`)) || []);
    setGroups(JSON.parse(localStorage.getItem(`clashx_v11_groups_${userKey}`)) || [
      { id: 'g1', name: 'Group A', playerIds: [] },
      { id: 'g2', name: 'Group B', playerIds: [] }
    ]);
    setGroupStandings(JSON.parse(localStorage.getItem(`clashx_v11_standings_${userKey}`)) || {});
    setMatches(JSON.parse(localStorage.getItem(`clashx_v11_matches_${userKey}`)) || []);
    setKnockoutRounds(JSON.parse(localStorage.getItem(`clashx_v11_knockouts_${userKey}`)) || []);
    setQualifiersPerGroup(JSON.parse(localStorage.getItem(`clashx_v11_qualifiers_${userKey}`)) || 2);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`clashx_v11_title_${userKey}`, tournamentName);
    localStorage.setItem(`clashx_v11_roster_${userKey}`, JSON.stringify(roster));
    localStorage.setItem(`clashx_v11_groups_${userKey}`, JSON.stringify(groups));
    localStorage.setItem(`clashx_v11_standings_${userKey}`, JSON.stringify(groupStandings));
    localStorage.setItem(`clashx_v11_matches_${userKey}`, JSON.stringify(matches));
    localStorage.setItem(`clashx_v11_knockouts_${userKey}`, JSON.stringify(knockoutRounds));
    localStorage.setItem(`clashx_v11_qualifiers_${userKey}`, JSON.stringify(qualifiersPerGroup));
  }, [tournamentName, roster, groups, groupStandings, matches, knockoutRounds, qualifiersPerGroup, userKey]);

  const getPlayerInfo = (id) => roster.find(r => r.id === id) || { name: 'Unknown', avatar: '' };

  // --- FIXED IMAGE UPLOAD HANDLER ---
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
    if (window.confirm("Delete this group?")) {
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

  // --- 🎲 RANDOMIZE & DISTRIBUTE ALL PLAYERS INTO GROUPS ---
  const handleRandomizeGroups = () => {
    if (roster.length === 0) {
      alert("Master roster is empty! Add players before randomizing.");
      return;
    }

    // 1. Shuffle player array randomly (Fisher-Yates shuffle)
    const shuffled = [...roster].map(p => p.id);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 2. Distribute evenly across current groups
    const newGroups = groups.map(g => ({ ...g, playerIds: [] }));
    const newStandings = { ...groupStandings };

    shuffled.forEach((playerId, index) => {
      const targetGroupIndex = index % newGroups.length;
      newGroups[targetGroupIndex].playerIds.push(playerId);

      if (!newStandings[playerId]) {
        newStandings[playerId] = { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      }
    });

    setGroups(newGroups);
    setGroupStandings(newStandings);
    alert(`Successfully randomized ${shuffled.length} players across ${newGroups.length} groups!`);
  };

  // --- ROSTER ACTIONS ---
  const handleCreatePlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    const avatarUrl = (newPlayerAvatar && newPlayerAvatar.trim() !== '') 
      ? newPlayerAvatar 
      : `https://api.dicebear.com/7.x/initials/svg?seed=${newPlayerName}&backgroundColor=1f2937&textColor=00e58c`;

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

  // --- FULLY DYNAMIC POWER-OF-2 BRACKET GENERATOR ---
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
        `Total qualifiers is ${qualifiers.length}. For a clean knockout bracket, it's recommended to have a power of 2 (e.g., 2, 4, 8, 16). Click OK to automatically trim to top ${targetSize} players, or Cancel to adjust.`
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
            alert("Knockout matches cannot end in a draw! Extra time or penalties needed.");
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

  return (
    <div className="min-h-screen bg-[#050811] text-gray-200 font-sans pt-28 pb-16 px-6 lg:px-12 relative selection:bg-[#00e58c] selection:text-black">
      
      <div className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/262/346/355/ea-sports-fc-26-sergio-busquets-football-inter-miami-cf-playstation-5-hd-wallpaper-preview.jpg')" }}></div>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="bg-[#22252e] border border-[#00e58c] text-white text-xl md:text-2xl font-black uppercase px-3 py-1 rounded outline-none" />
                <button onClick={() => { if (tempTitle.trim()) { setTournamentName(tempTitle.trim().toUpperCase()); setIsEditingTitle(false); } }} className="bg-[#00e58c] text-black font-bold px-3 py-2 rounded text-xs uppercase">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { setTempTitle(tournamentName); setIsEditingTitle(true); }}>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white group-hover:text-[#00e58c] transition-colors">{tournamentName}</h1>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-[#00e58c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('groups')} className={`px-4 py-2 rounded-md font-bold text-xs uppercase transition-all ${activeTab === 'groups' ? 'bg-[#00e58c] text-black shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>Group Stage</button>
            <button onClick={() => setActiveTab('knockouts')} className={`px-4 py-2 rounded-md font-bold text-xs uppercase transition-all ${activeTab === 'knockouts' ? 'bg-[#00e58c] text-black shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>Knockout Brackets</button>
            <button onClick={handleFlushLeague} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold py-2 px-4 rounded-md transition-colors">Flush Table</button>
          </div>
        </div>

        {/* ================= TAB 1: GROUP STAGE ================= */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Group Standings Tables */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Add Group Bar & Randomize Button */}
              <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                <form onSubmit={handleAddGroup} className="flex items-center gap-2 flex-1 min-w-[250px]">
                  <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Add Group Pair Name (e.g. Group C & D)" className="bg-[#22252e] border border-white/10 text-sm rounded px-3 py-2 text-white outline-none focus:border-[#00e58c] flex-1" />
                  <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded transition-colors">+ Add Pair</button>
                </form>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRandomizeGroups} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2"
                    title="Randomly distribute all roster players into groups"
                  >
                    🎲 Randomize Groups
                  </button>
                  <label className="text-xs text-gray-400 font-semibold uppercase">Top (N):</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={qualifiersPerGroup} 
                    onChange={(e) => setQualifiersPerGroup(Math.max(1, parseInt(e.target.value) || 1))} 
                    className="w-16 bg-[#22252e] border border-white/10 text-white text-xs font-bold text-center rounded px-2 py-2 outline-none focus:border-[#00e58c]"
                  />
                </div>
              </div>

              {/* Render Each Group */}
              {groups.map((group) => {
                const groupPlayers = group.playerIds.map(id => {
                  const stats = groupStandings[id] || { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
                  return { id, ...stats, ...getPlayerInfo(id) };
                }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

                return (
                  <div key={group.id} className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-4 bg-[#12141a] border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-extrabold uppercase text-white tracking-wider text-sm">{group.name}</h3>
                      <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-500 hover:text-red-400 text-xs font-semibold">Delete Group</button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-[11px] uppercase tracking-wider bg-black/20">
                            <th className="py-2 px-3 w-16">Pos</th>
                            <th className="py-2 px-3">Team / Player</th>
                            <th className="py-2 px-3 text-center">MP</th>
                            <th className="py-2 px-3 text-center">W</th>
                            <th className="py-2 px-3 text-center">D</th>
                            <th className="py-2 px-3 text-center">L</th>
                            <th className="py-2 px-3 text-center">GF</th>
                            <th className="py-2 px-3 text-center">GA</th>
                            <th className="py-2 px-3 text-center">GD</th>
                            <th className="py-2 px-3 text-center text-white">Pts</th>
                            <th className="py-2 px-3 text-center w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {groupPlayers.length === 0 ? (
                            <tr>
                              <td colSpan="11" className="text-center py-6 text-gray-500">No players assigned to this group yet. Use Randomize or assign manually.</td>
                            </tr>
                          ) : (
                            groupPlayers.map((p, idx) => (
                              <tr key={p.id} className={`border-b border-white/5 hover:bg-white/5 ${idx < qualifiersPerGroup ? 'bg-[#1b2b22]/30' : ''}`}>
                                <td className="py-2.5 px-3 font-bold">
                                  {idx < qualifiersPerGroup ? <span className="text-[#00e58c]">Q {idx + 1}</span> : <span>{idx + 1}</span>}
                                </td>
                                <td className="py-2.5 px-3 flex items-center gap-2">
                                  <img 
                                    src={p.avatar} 
                                    alt={p.name} 
                                    className="w-6 h-6 rounded-full object-cover bg-gray-800 border border-white/10 shrink-0" 
                                    onError={(e) => {
                                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}&backgroundColor=1f2937&textColor=00e58c`;
                                    }}
                                  />
                                  <span className="font-medium text-white">{p.name}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-gray-400">{p.mp}</td>
                                <td className="py-2.5 px-3 text-center">{p.w}</td>
                                <td className="py-2.5 px-3 text-center text-gray-400">{p.d}</td>
                                <td className="py-2.5 px-3 text-center text-red-400 font-bold">{p.l}</td>
                                <td className="py-2.5 px-3 text-center text-gray-400">{p.gf}</td>
                                <td className="py-2.5 px-3 text-center text-gray-400">{p.ga}</td>
                                <td className="py-2.5 px-3 text-center text-gray-300">{p.gd}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-white">{p.pts}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <button onClick={() => removePlayerFromGroup(p.id, group.id)} className="text-gray-500 hover:text-red-400" title="Remove from Group">×</button>
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

              <div className="text-center pt-2">
                <button onClick={generateKnockouts} className="bg-[#00e58c] hover:bg-[#00c97b] text-black font-extrabold px-8 py-3 rounded-xl shadow-lg text-sm tracking-wider">
                  Generate Knockout Brackets (Top {qualifiersPerGroup} per Group) ➔
                </button>
              </div>

            </div>

            {/* Right Col: Match Center & Roster Manager */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Log Group Match */}
              <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Log Group Match</h3>
                <form onSubmit={handleLogMatch} className="flex flex-col gap-3">
                  <select required value={matchGroup} onChange={(e) => setMatchGroup(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-sm rounded p-2.5 outline-none text-white focus:border-[#00e58c]">
                    <option value="" disabled>Select Group</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>

                  {matchGroup && (
                    <>
                      <select required value={player1} onChange={(e) => setPlayer1(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-sm rounded p-2.5 outline-none text-white">
                        <option value="" disabled>Player 1</option>
                        {groups.find(g => g.id === matchGroup)?.playerIds.map(id => (
                          <option key={id} value={id}>{getPlayerInfo(id).name}</option>
                        ))}
                      </select>

                      <select required value={player2} onChange={(e) => setPlayer2(e.target.value)} className="w-full bg-[#22252e] border border-white/10 text-sm rounded p-2.5 outline-none text-white">
                        <option value="" disabled>Player 2</option>
                        {groups.find(g => g.id === matchGroup)?.playerIds.map(id => {
                          if (id === player1) return null;
                          return <option key={id} value={id}>{getPlayerInfo(id).name}</option>;
                        })}
                      </select>

                      <div className="flex items-center gap-2">
                        <input required type="number" min="0" value={score1} onChange={(e) => setScore1(e.target.value)} placeholder="Score 1" className="w-full bg-[#22252e] border border-white/10 text-center rounded p-2.5 text-white outline-none" />
                        <span className="font-bold text-gray-500">-</span>
                        <input required type="number" min="0" value={score2} onChange={(e) => setScore2(e.target.value)} placeholder="Score 2" className="w-full bg-[#22252e] border border-white/10 text-center rounded p-2.5 text-white outline-none" />
                      </div>

                      <button type="submit" className="w-full bg-[#00e58c] text-black font-bold py-2.5 rounded mt-2 text-sm shadow">Record Match</button>
                    </>
                  )}
                </form>
              </div>

              {/* Master Roster Creator & Assign to Group */}
              <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Master Roster & Assignment</h3>
                
                <form onSubmit={handleCreatePlayer} className="flex flex-col gap-3 mb-6">
                  <input type="text" required value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Player Name" className="bg-[#22252e] border border-white/10 text-sm rounded px-3 py-2 text-white outline-none" />
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="text-xs text-gray-400 border border-white/10 rounded p-1 bg-[#12141a] cursor-pointer" />
                  <button type="submit" className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded text-xs">Create Player</button>
                </form>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {roster.map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-[#12141a] p-2.5 rounded border border-white/5">
                      <div className="flex items-center gap-2">
                        <img 
                          src={player.avatar} 
                          alt={player.name} 
                          className="w-6 h-6 rounded-full object-cover bg-gray-800 border border-white/10 shrink-0" 
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${player.name}&backgroundColor=1f2937&textColor=00e58c`;
                          }}
                        />
                        <span className="text-xs font-medium text-white">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select onChange={(e) => { if(e.target.value) assignPlayerToGroup(player.id, e.target.value); e.target.value = ""; }} defaultValue="" className="bg-[#22252e] border border-white/10 text-[10px] text-gray-300 rounded p-1 outline-none">
                          <option value="" disabled>+ Group</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <button onClick={() => deleteFromRoster(player.id)} className="text-gray-500 hover:text-red-400 text-xs">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: DYNAMIC MULTI-STAGE KNOCKOUTS ================= */}
        {activeTab === 'knockouts' && (
          <div className="bg-[#1a1d24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase text-white tracking-widest">Dynamic Multi-Stage Knockout Brackets</h2>
              <p className="text-xs text-gray-400 mt-1">Rounds expand dynamically (Round of 16 ➔ QFs ➔ Semis ➔ Finals) based on your qualified count.</p>
            </div>

            {knockoutRounds.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No knockout rounds generated yet.</p>
                <button onClick={() => setActiveTab('groups')} className="mt-4 bg-[#00e58c] text-black font-bold px-6 py-2.5 rounded-lg text-xs uppercase">Go to Group Stage to Generate</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {knockoutRounds.map((round, roundIdx) => (
                  <div key={roundIdx} className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold uppercase text-[#00e58c] tracking-wider text-center border-b border-white/10 pb-2">{round.title}</h3>
                    
                    <div className="flex flex-col gap-4">
                      {round.matches.map((m, matchIdx) => (
                        <div key={m.id} className="bg-[#12141a] border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Match {matchIdx + 1}</span>
                          
                          {/* Player 1 */}
                          <div className={`flex justify-between items-center text-sm p-1.5 rounded ${m.loserId === m.p1Id ? 'bg-red-950/30 opacity-40 line-through' : ''}`}>
                            <span className={m.winnerId === m.p1Id ? "font-bold text-[#00e58c]" : "text-gray-300"}>{getPlayerInfo(m.p1Id).name}</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={m.s1 !== '' ? m.s1 : ''} 
                              onChange={(e) => updateKnockoutScore(roundIdx, m.id, e.target.value === '' ? '' : parseInt(e.target.value), m.s2)} 
                              placeholder="0"
                              className="w-14 bg-[#22252e] border border-white/20 text-center rounded text-white text-xs py-1.5 font-bold outline-none focus:border-[#00e58c]" 
                            />
                          </div>

                          {/* Player 2 */}
                          <div className={`flex justify-between items-center text-sm p-1.5 rounded ${m.loserId === m.p2Id ? 'bg-red-950/30 opacity-40 line-through' : ''}`}>
                            <span className={m.winnerId === m.p2Id ? "font-bold text-[#00e58c]" : "text-gray-300"}>{getPlayerInfo(m.p2Id).name}</span>
                            <input 
                              type="number" 
                              min="0" 
                              value={m.s2 !== '' ? m.s2 : ''} 
                              onChange={(e) => updateKnockoutScore(roundIdx, m.id, m.s1, e.target.value === '' ? '' : parseInt(e.target.value))} 
                              placeholder="0"
                              className="w-14 bg-[#22252e] border border-white/20 text-center rounded text-white text-xs py-1.5 font-bold outline-none focus:border-[#00e58c]" 
                            />
                          </div>
                          
                          {m.loserId && <span className="text-[10px] text-red-400 font-semibold text-center">❌ Eliminated: {getPlayerInfo(m.loserId).name}</span>}
                          
                          {round.title.includes('Grand Final') && m.winnerId && (
                            <div className="text-center bg-[#00e58c]/10 py-2 rounded text-[#00e58c] font-black text-[11px] uppercase tracking-wider mt-1 border border-[#00e58c]/30 animate-pulse">
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