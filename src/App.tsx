/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  CalendarDays, 
  Users, 
  UserCircle, 
  Sparkles,
  ChevronRight,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  History,
  Eye,
  Loader2,
  Send,
  MessageSquare,
  Printer,
  AlertTriangle,
  Megaphone,
  Settings2,
  Timer as TimerIcon
} from 'lucide-react';
import { 
  fetchMeetingRoster,
  fetchMembers,
  deleteRosterRoles,
  addRosterRole,
  deleteRosterRole,
  unassignRole,
  addMember,
  deleteMember,
  updateMeetingRole,
  updateRoleTitle
} from './services/teable';
import { generateMeetingAgenda, editAgendaWithAI, AgendaSegment } from './services/gemini';
import { MeetingRole, Member } from './types';
import { StitchAgenda } from './components/StitchAgenda';

// --- Components ---

const TopBar = ({ connectionError }: { connectionError: string | null }) => (
  <header className="fixed top-0 left-0 w-full z-50 flex flex-col md:flex-row justify-between items-start md:items-end px-4 md:px-8 pt-4 md:pt-8 pb-3 md:pb-4 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 no-print">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600">TM-PRO v2.8 (TITANIUM STABILITY)</span>
      </div>
      <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-800">Inspiring Speakers PDC</h1>
    </div>
    <div className="flex gap-4 items-center mt-4 md:mt-0">
      <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400">Database</span>
        <span className="text-sm font-semibold text-slate-700">Teable Cloud</span>
      </div>
      <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
          <span className={`text-sm font-semibold ${connectionError ? 'text-red-600' : 'text-emerald-600'}`}>
            {connectionError ? 'Offline' : 'Connected'}
          </span>
        </div>
      </div>
    </div>
  </header>
);

const RoleCard = ({ role, onClaim, onEdit, onDelete, onUnassign, showDuration }: { 
  role: MeetingRole, 
  onClaim: (id: string) => void, 
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onUnassign: (id: string) => void,
  showDuration?: boolean
}) => {
  // Local hybrid storage for durations
  const intro = role.intro_duration || localStorage.getItem(`tm_intro_${role.id}`) || '';
  const report = role.report_duration || localStorage.getItem(`tm_report_${role.id}`) || '';
  
  return (
    <div className={`group flex items-center justify-between p-5 rounded-[2rem] transition-all hover:translate-y-[-2px] ${
      role.status === 'Confirmed' ? 'bg-white shadow-md border border-blue-50' : 'bg-slate-50 border-2 border-dashed border-slate-200'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-1"></div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
          role.status === 'Confirmed' ? 'bg-[#004165] text-white shadow-lg' : 'bg-slate-200 text-slate-400'
        }`}>
          {role.role.toLowerCase().includes('speaker') ? <Users className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight">{role.role}</p>
            {showDuration && (intro || report) && (
              <div className="flex gap-1">
                {intro && <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-100">Intro: {intro}m</span>}
                {report && <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100">Rep: {report}m</span>}
              </div>
            )}
          </div>
          <p className={`text-base ${role.status === 'Confirmed' && role.name ? 'font-extrabold text-slate-800' : 'font-bold italic text-blue-500'}`}>
            {role.status === 'Confirmed' && role.name ? role.name : 'VACANT'}
          </p>
          <div className="flex gap-2 items-center">
            {role.speech_title && <span className="text-[10px] font-bold text-[#772432] truncate max-w-[150px]">"{role.speech_title}"</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {role.status === 'Confirmed' ? (
            <button onClick={() => onUnassign(role.id)} className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Unassign"><UserCircle className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => onClaim(role.id)} className="px-5 py-2 bg-[#004165] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg active:scale-95 mr-2">Claim</button>
          )}
          <button onClick={() => onEdit(role.id)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Role"><Settings2 className="w-5 h-5" /></button>
          <button onClick={() => onDelete(role.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Role"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roster, setRoster] = useState<MeetingRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agenda, setAgendaDraft] = useState<AgendaSegment[] | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);
  
  // Modals state
  const [modalType, setModalType] = useState<'claim' | 'add-role' | 'edit-role' | 'add-member' | 'edit-member' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [inputData, setInputData] = useState<any>({});

  // Persistent Meeting Config
  const [theme, setTheme] = useState(() => localStorage.getItem('tm_theme') || 'Friendship, How to make them happen');
  const [meetingDate, setMeetingDate] = useState(() => localStorage.getItem('tm_date') || '2026-05-07');
  const [sessionNum, setSessionNum] = useState(() => localStorage.getItem('tm_session_num') || '132');
  const [announcements, setAnnouncements] = useState(() => localStorage.getItem('tm_announcements') || 'We meet every Thursday at 7pm prompt. Please aim to arrive for 6:45pm');
  const [wordOfTheDay, setWordOfTheDay] = useState(() => localStorage.getItem('tm_wotd') || 'Benevolence');
  const [wordMeaning, setWordMeaning] = useState(() => localStorage.getItem('tm_meaning') || 'Disposition to do good.');
  const [wordExample, setWordExample] = useState(() => localStorage.getItem('tm_example') || 'He was known for his benevolence.');

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sync to LocalStorage
  useEffect(() => localStorage.setItem('tm_theme', theme), [theme]);
  useEffect(() => localStorage.setItem('tm_date', meetingDate), [meetingDate]);
  useEffect(() => localStorage.setItem('tm_session_num', sessionNum), [sessionNum]);
  useEffect(() => localStorage.setItem('tm_announcements', announcements), [announcements]);
  useEffect(() => localStorage.setItem('tm_wotd', wordOfTheDay), [wordOfTheDay]);
  useEffect(() => localStorage.setItem('tm_meaning', wordMeaning), [wordMeaning]);
  useEffect(() => localStorage.setItem('tm_example', wordExample), [wordExample]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [rosterData, membersData] = await Promise.all([ fetchMeetingRoster(), fetchMembers() ]);
      
      // HYDRATE ROSTER WITH LOCAL CACHE FOR TIMES
      const hydratedRoster = (rosterData || []).map(r => ({
        ...r,
        intro_duration: r.intro_duration || localStorage.getItem(`tm_intro_${r.id}`) || '',
        report_duration: r.report_duration || localStorage.getItem(`tm_report_${r.id}`) || ''
      }));
      
      setRoster(hydratedRoster);
      setMembers([...(membersData || [])].sort((a, b) => a.name.localeCompare(b.name)));
      
      const savedUserId = localStorage.getItem('tm_user_id');
      if (savedUserId && membersData?.length > 0) {
        const user = membersData.find((m: Member) => m.id === savedUserId);
        if (user) setCurrentUser(user);
      }
      setConnectionError(null);
    } catch (err) { setConnectionError("Offline"); }
    finally { setIsLoading(false); }
  };

  const handleClaimRole = async (id: string) => { 
    await refreshData();
    setTargetId(id); 
    setModalType('claim'); 
  };

  const openEditRole = async (role: MeetingRole) => {
    await refreshData();
    const rName = role.role.toLowerCase();
    const isEvaluator = rName.includes('evaluator') || rName.includes('grammarian') || rName.includes('timer') || rName.includes('ah-counter');
    
    // Intelligent Defaults
    const defaultIntro = isEvaluator || rName.includes('president') || rName.includes('saa') ? '1' : '';
    const defaultReport = rName.includes('general evaluator') ? '5' : 
                           rName.includes('president') ? '5' :
                           isEvaluator ? '2-3' : '';

    setTargetId(role.id); 
    setInputData({ 
      title: role.role, 
      duration: role.duration, 
      intro_duration: role.intro_duration || localStorage.getItem(`tm_intro_${role.id}`) || defaultIntro, 
      report_duration: role.report_duration || localStorage.getItem(`tm_report_${role.id}`) || defaultReport,
      pathway: role.pathway,
      level: role.level,
      project_number: role.project_number,
      speech_title: role.speech_title
    }); 
    setModalType('edit-role');
  };
  
  const executeClaim = async (member: Member) => {
    if (!targetId) return;
    const alreadyAssigned = roster.find(r => r.name.toLowerCase() === member.name.toLowerCase());
    if (alreadyAssigned) {
      if (!confirm(`⚠️ WARNING: ${member.name} is already assigned to "${alreadyAssigned.role}". Proceed?`)) return;
    }
    const role = roster.find(r => r.id === targetId);
    if (!role) return;
    
    const rName = role.role.toLowerCase();
    const isEvaluator = rName.includes('evaluator') || rName.includes('grammarian') || rName.includes('timer') || rName.includes('ah-counter');
    
    const intro = role.intro_duration || localStorage.getItem(`tm_intro_${targetId}`) || (isEvaluator || rName.includes('president') || rName.includes('saa') ? '1' : '');
    const report = role.report_duration || localStorage.getItem(`tm_report_${targetId}`) || (
      rName.includes('saa') || rName.includes('toastmaster') ? '' :
      rName.includes('general evaluator') ? '5' :
      rName.includes('president') ? '5' : // President Club News 5m
      rName.includes('voting') ? '15' : // Special Voting Session 15m
      isEvaluator || rName.includes('vpe') ? '2-3' : ''
    );

    const extra: any = { Intro_Duration: intro, Report_Duration: report };
    
    // Save locally immediately to be safe
    localStorage.setItem(`tm_intro_${targetId}`, intro);
    localStorage.setItem(`tm_report_${targetId}`, report);

    if (rName.includes('speaker')) {
      const isIcebreaker = !member.latestSpeechNumber || member.latestSpeechNumber === '0';
      extra.Duration = role.duration || (isIcebreaker ? '4-6' : '5-7');
      extra.Speech_Title = member.latestSpeechTitle || ""; extra.Pathway = member.currentPathway || "";
      extra.Level = member.currentLevel || ""; extra.Project_Number = member.latestSpeechNumber || "";
    }
    
    setIsLoading(true);
    await updateMeetingRole(targetId, member.name, extra);
    setIsLoading(false);
    setModalType(null); refreshData();
  };

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);
    try {
      // Merge member profile data into the roster for better speaker details
      const enrichedRoster = roster.map(r => {
        if (!r.name || r.status !== 'Confirmed') return r;
        const member = members.find(m => m.name === r.name);
        if (!member) return r;

        return {
          ...r,
          pathway: r.pathway || member.currentPathway || '',
          level: r.level || member.currentLevel || '',
          speech_title: r.speech_title || member.latestSpeechTitle || ''
        };
      });

      const segments = await generateMeetingAgenda(enrichedRoster, { 
        theme, 
        date: meetingDate, 
        time: "19:00", 
        location: "Aloft Playa", 
        sessionNum, 
        announcements,
        wordOfTheDay,
        wordMeaning,
        wordExample
      });
      setAgendaDraft(segments);
      setActiveTab('agenda');
    } catch (error: any) { 
      const msg = error.message.toLowerCase();
      const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('demand');
      alert(`Generation failed: ${isOverloaded ? "AI capacity reached. I am retrying with a stable backup... please wait 10 seconds." : error.message}`); 
    }
    finally { setIsGenerating(false); }
  };

  const handleChatEdit = async () => {
    if (!chatInput.trim() || !agenda) return;
    setIsChatting(true);
    try {
      const next = await editAgendaWithAI(agenda, chatInput);
      setAgendaDraft(next);
      setChatInput('');
    } catch (err: any) { alert("AI Edit failed: " + err.message); }
    finally { setIsChatting(false); }
  };

  if (isLoading && roster.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#004165] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      <TopBar connectionError={connectionError} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meeting Theme</label>
                        <input value={theme} onChange={e => setTheme(e.target.value)} className="text-xl md:text-3xl font-black text-slate-800 w-full focus:outline-none bg-transparent"/>
                      </div>
                      <div className="w-20 md:w-24">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Session</label>
                        <input value={sessionNum} onChange={e => setSessionNum(e.target.value)} className="text-xl md:text-3xl font-black text-blue-600 w-full focus:outline-none bg-transparent"/>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                       <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#004165]"/>
                          <div className="flex flex-col">
                            <input 
                              type="date" 
                              value={meetingDate} 
                              onChange={e => setMeetingDate(e.target.value)} 
                              className="font-bold text-slate-400 focus:outline-none bg-transparent text-sm border-none p-0 cursor-pointer"
                            />
                            {meetingDate && (() => {
                              const parts = meetingDate.split('-');
                              if (parts.length !== 3) return null;
                              const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                              if (isNaN(d.getTime())) return null;
                              const day = d.getDate();
                              const suffix = ["th","st","nd","rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                              const formatted = `${day}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
                              return <span className="text-[10px] font-black text-[#004165] tracking-wider">{formatted}</span>;
                            })()}
                          </div>
                       </div>
                       <div className="flex-1 flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                          <Megaphone className="w-4 h-4 text-blue-600 shrink-0"/>
                          <input value={announcements} onChange={e => setAnnouncements(e.target.value)} placeholder="Main Announcements..." className="bg-transparent border-none focus:outline-none text-sm font-bold text-blue-700 w-full placeholder:text-blue-300"/>
                       </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex gap-4 flex-wrap items-center">
                    <div className="flex flex-col gap-1">
                      <button onClick={handleGenerateAgenda} disabled={isGenerating} className="px-8 py-4 bg-[#004165] text-white rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-900 transition-all active:scale-95">
                        {isGenerating ? <Loader2 className="animate-spin w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
                        Generate Agenda
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">do this after you complete the roles</span>
                    </div>
                    <button onClick={refreshData} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-[#004165] transition-all"><History/></button>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 space-y-4 border border-slate-100">
                  <h3 className="italic text-lg font-black text-[#004165]">Word of the Day</h3>
                  <div className="space-y-3">
                    <input value={wordOfTheDay} onChange={e => setWordOfTheDay(e.target.value)} className="font-black text-sm bg-white rounded-xl px-4 py-2 w-full shadow-sm" placeholder="Word"/>
                    <textarea value={wordMeaning} onChange={e => setWordMeaning(e.target.value)} className="text-xs italic bg-white rounded-xl px-4 py-2 w-full shadow-sm resize-none" rows={3} placeholder="Definition"/>
                    <textarea value={wordExample} onChange={e => setWordExample(e.target.value)} className="text-xs italic bg-white rounded-xl px-4 py-2 w-full shadow-sm resize-none" rows={3} placeholder="Example"/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {roster.slice(0, 9).map(r => (
                   <RoleCard 
                    key={r.id} 
                    role={r} 
                    onClaim={handleClaimRole} 
                    onEdit={() => openEditRole(r)} 
                    onDelete={async (id) => { if(confirm("Remove?")) { const res = await deleteRosterRole(id); if(res === true) refreshData(); else alert(`⚠️ Delete failed: ${JSON.stringify((res as any)?.details || "Connection Error")}`); } }} 
                    onUnassign={async (id) => { await unassignRole(id); refreshData(); }} 
                   />
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 bg-white rounded-[3rem] p-6 md:p-12 shadow-sm border border-slate-100">
              <header className="flex justify-between items-end flex-wrap gap-3">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">Roles & Directory</h2>
                <div className="flex gap-2">
                  <button onClick={() => setModalType('add-role')} className="px-5 py-2 bg-[#004165] text-white rounded-xl text-xs font-black">+ Role</button>
                  <button onClick={() => setModalType('add-member')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black">+ Member</button>
                </div>
              </header>
              <div className="grid grid-cols-1 gap-4">
                {roster.map(r => (
                  <RoleCard 
                    key={r.id} 
                    role={r} 
                    onClaim={handleClaimRole} 
                    onEdit={() => openEditRole(r)} 
                    onDelete={async (id) => { if(confirm("Remove?")) { const res = await deleteRosterRole(id); if(res === true) refreshData(); else alert(`⚠️ Delete failed: ${JSON.stringify((res as any)?.details || "Connection Error")}`); } }} 
                    onUnassign={async (id) => { await unassignRole(id); refreshData(); }} 
                    showDuration 
                  />
                ))}
              </div>
              
              <div className="mt-20 pt-20 border-t border-slate-100">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-10">Club Directory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map(m => (
                    <div key={m.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group relative transition-all hover:bg-white hover:shadow-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#004165] rounded-2xl flex items-center justify-center text-white font-black text-xl">{m.name[0]}</div>
                        <div>
                          <p className="font-black text-slate-800 text-base">{m.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{m.committeeRole || 'Member'}</p>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={async () => { await refreshData(); setTargetId(m.id); setInputData({ name: m.name, role: m.committeeRole, profiles_recd: m.profilesRecd, confirmation_msg: m.confirmationMsg }); setModalType('edit-member'); }} className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={async () => { if(confirm(`Remove ${m.name}?`)) { const success = await deleteMember(m.id); if(success) refreshData(); else alert("Failed to delete."); } }} className="p-2 bg-white rounded-xl shadow-sm text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="agenda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8 items-start relative">
              <div className="flex-1 w-full bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 overflow-x-auto">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-10 no-print">
                   <div className="flex gap-3">
                     <button onClick={() => window.print()} className="px-6 md:px-8 py-3 bg-[#004165] text-white rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer className="w-4 h-4"/> Print A4</button>
                     <button onClick={() => setAgendaDraft(null)} className="px-4 md:px-6 py-3 bg-slate-100 rounded-2xl text-slate-500 font-bold">Discard</button>
                     <button onClick={() => setShowAssistant(!showAssistant)} className="px-4 md:px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold border border-blue-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        {showAssistant ? 'Hide AI' : 'Show Assistant'}
                     </button>
                   </div>
                </div>
                {agenda && (
                  <div className="min-w-fit">
                    <StitchAgenda 
                      segments={agenda} 
                      details={{ theme, date: meetingDate, time: "19:00", location: "Aloft Playa", sessionNum, announcements }} 
                      wotd={{ word: wordOfTheDay, meaning: wordMeaning, example: wordExample }} 
                      members={members}
                      onEditSegment={(idx, field, val) => { const next = [...agenda]; (next[idx] as any)[field] = val; setAgendaDraft(next); }}
                      onEditDetail={(field, val) => {
                        if (field === 'theme') setTheme(val); if (field === 'sessionNum') setSessionNum(val);
                        if (field === 'date') setMeetingDate(val); if (field === 'announcements') setAnnouncements(val);
                        if (field === 'word') setWordOfTheDay(val); if (field === 'meaning') setWordMeaning(val);
                        if (field === 'example') setWordExample(val);
                      }}
                    />
                  </div>
                )}
              </div>
              
              {showAssistant && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[380px] bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl space-y-6 lg:sticky lg:top-32 no-print shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center"><MessageSquare className="w-5 h-5"/></div>
                        <div><p className="font-black text-lg">AI Assistant</p><p className="text-[10px] text-blue-400 font-bold uppercase">Ready</p></div>
                    </div>
                    <button onClick={() => setShowAssistant(false)} className="text-slate-500 hover:text-white transition-colors"><X/></button>
                  </div>
                  <div className="space-y-4">
                      <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChatEdit()} placeholder="Type request..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" rows={3} />
                      <button onClick={handleChatEdit} disabled={isChatting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                        {isChatting ? <Loader2 className="animate-spin w-5 h-5"/> : <Send className="w-5 h-5"/>} Apply
                      </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-12 py-10">
               {currentUser ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-[#004165] rounded-[3rem] p-12 text-white shadow-2xl space-y-8 text-center">
                      <div className="w-24 h-24 bg-[#772432] rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto shadow-2xl">{currentUser.name[0]}</div>
                      <p className="text-4xl font-black">{currentUser.name}</p>
                      <button onClick={() => { setCurrentUser(null); localStorage.removeItem('tm_user_id'); }} className="text-slate-400 font-bold text-sm">Switch User</button>
                   </div>
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-6">
                       <h3 className="text-xl font-black text-slate-800">My Speech Details</h3>
                       <div className="grid grid-cols-2 gap-4">
                         <input value={currentUser.currentPathway || ''} onChange={e => setCurrentUser({...currentUser, currentPathway: e.target.value})} placeholder="Pathway" className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-none"/>
                         <input value={currentUser.currentLevel || ''} onChange={e => setCurrentUser({...currentUser, currentLevel: e.target.value})} placeholder="Level" className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-none"/>
                       </div>
                       <input value={currentUser.latestSpeechTitle || ''} onChange={e => setCurrentUser({...currentUser, latestSpeechTitle: e.target.value})} placeholder="Next Title" className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-none"/>
                       
                       <button onClick={async () => { 
                         setIsLoading(true);
                         const ok = await updateMeetingRole(currentUser.id, currentUser.name, { 
                           Pathway: currentUser.currentPathway,
                           Level: currentUser.currentLevel,
                           Speech_Title: currentUser.latestSpeechTitle
                         }, true); 
                         setIsLoading(false);
                         if (ok) {
                           alert("✅ Profile saved!");
                           refreshData();
                         } else {
                           alert("⚠️ Save failed — check your connection. Profile was NOT updated.");
                         }
                       }} className="w-full py-5 bg-[#004165] text-white rounded-2xl font-black shadow-xl">Save Profile</button>
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {members.map(m => (
                     <button key={m.id} onClick={() => { setCurrentUser(m); localStorage.setItem('tm_user_id', m.id); }} className="p-8 bg-white rounded-[2rem] border border-slate-100 hover:border-[#004165] transition-all text-left group">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-400 group-hover:bg-[#004165] group-hover:text-white transition-colors font-black">{m.name[0]}</div>
                        <p className="font-black text-slate-800 text-lg leading-tight">{m.name}</p>
                     </button>
                   ))}
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] px-6 md:px-8 py-3 md:py-4 shadow-2xl z-50 flex items-center gap-6 md:gap-10 no-print">
        {['dashboard', 'roles', 'profile'].map(id => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === id ? 'text-[#004165] bg-blue-50/50 font-bold' : 'text-slate-400'}`}>
            {id === 'dashboard' ? <BarChart3/> : id === 'roles' ? <Users/> : <UserCircle/>}
            <span className="text-[10px] mt-1 uppercase tracking-tighter">{id}</span>
          </button>
        ))}
      </nav>

      {/* --- Modals --- */}
      <Modal title="Select Member" isOpen={modalType === 'claim'} onClose={() => setModalType(null)}>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {members.map(m => {
            const hasRole = roster.find(r => r.name.toLowerCase() === m.name.toLowerCase());
            return (
              <button key={m.id} onClick={() => executeClaim(m)} className={`w-full flex justify-between items-center p-5 rounded-3xl border transition-all group ${hasRole ? 'bg-red-50 border-red-100 hover:bg-red-100' : 'bg-slate-50 border-slate-100 hover:bg-blue-50'}`}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2"><p className={`font-black ${hasRole ? 'text-red-700' : 'text-slate-800 group-hover:text-blue-600'}`}>{m.name}</p>{hasRole && <AlertTriangle className="w-3 h-3 text-red-500"/>}</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{m.committeeRole || 'Member'}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${hasRole ? 'text-red-300' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal title="Add Role" isOpen={modalType === 'add-role'} onClose={() => setModalType(null)}>
        <div className="space-y-6">
          <input value={inputData.title || ''} onChange={e => setInputData({...inputData, title: e.target.value})} placeholder="Role Name" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none focus:ring-2 focus:ring-blue-600"/>
          <button onClick={async () => { if(!inputData.title) return; setIsLoading(true); await addRosterRole(inputData.title); setIsLoading(false); setModalType(null); refreshData(); }} className="w-full py-5 bg-[#004165] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Add to Roster</button>
        </div>
      </Modal>

      <Modal title="Edit Role Details" isOpen={modalType === 'edit-role'} onClose={() => setModalType(null)}>
        <div className="space-y-6">
          <input value={inputData.title || ''} onChange={e => setInputData({...inputData, title: e.target.value})} placeholder="Role Name" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-black border-none text-xl"/>
          
          <div className="bg-blue-50 p-6 rounded-3xl space-y-4">
             <div className="flex items-center gap-4">
                <TimerIcon className="w-5 h-5 text-blue-600"/>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Introduction Phase</label>
                  <input value={inputData.intro_duration || ''} onChange={e => setInputData({...inputData, intro_duration: e.target.value})} placeholder="e.g. 1" className="w-full bg-white rounded-xl px-4 py-2 font-bold text-blue-600 border border-blue-100 mt-1"/>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <TimerIcon className="w-5 h-5 text-emerald-600"/>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Report Phase</label>
                  <input value={inputData.report_duration || ''} onChange={e => setInputData({...inputData, report_duration: e.target.value})} placeholder="e.g. 2-3" className="w-full bg-white rounded-xl px-4 py-2 font-bold text-emerald-600 border border-emerald-100 mt-1"/>
                </div>
             </div>
          </div>

          {inputData.title?.toLowerCase().includes('speaker') && (
            <div className="bg-orange-50 p-6 rounded-3xl space-y-4 border border-orange-100">
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3"/> Speaker Details</p>
               <div className="grid grid-cols-2 gap-3">
                  <input value={inputData.pathway || ''} onChange={e => setInputData({...inputData, pathway: e.target.value})} placeholder="Pathway" className="w-full bg-white rounded-xl px-4 py-2 text-xs font-bold border border-orange-100"/>
                  <input value={inputData.level || ''} onChange={e => setInputData({...inputData, level: e.target.value})} placeholder="Level (e.g. 1)" className="w-full bg-white rounded-xl px-4 py-2 text-xs font-bold border border-orange-100"/>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <input value={inputData.project_number || ''} onChange={e => setInputData({...inputData, project_number: e.target.value})} placeholder="Proj #" className="w-full bg-white rounded-xl px-4 py-2 text-xs font-bold border border-orange-100"/>
                  <input value={inputData.duration || ''} onChange={e => setInputData({...inputData, duration: e.target.value})} placeholder="Dur (e.g. 5-7)" className="w-full bg-white rounded-xl px-4 py-2 text-xs font-bold border border-orange-100"/>
               </div>
               <input value={inputData.speech_title || ''} onChange={e => setInputData({...inputData, speech_title: e.target.value})} placeholder="Speech Title" className="w-full bg-white rounded-xl px-4 py-2 text-xs font-bold border border-orange-100"/>
            </div>
          )}

          <button onClick={async () => { 
            if(!targetId) return; 
            localStorage.setItem(`tm_intro_${targetId}`, inputData.intro_duration || '');
            localStorage.setItem(`tm_report_${targetId}`, inputData.report_duration || '');
            
            const extra: any = { 
              Intro_Duration: inputData.intro_duration, 
              Report_Duration: inputData.report_duration 
            };

            if (inputData.title?.toLowerCase().includes('speaker')) {
              extra.Pathway = inputData.pathway;
              extra.Level = inputData.level;
              extra.Project_Number = inputData.project_number;
              extra.Speech_Title = inputData.speech_title;
              extra.Duration = inputData.duration;
            }

            setIsLoading(true); 
            const response = await updateMeetingRole(targetId, undefined, { 
              ...extra, 
              Role: inputData.title 
            }); 
            setIsLoading(false);
            
            if (response !== true) {
              const details = (response as any)?.details ? JSON.stringify((response as any).details) : "Connection error";
              alert(`⚠️ Save failed: ${details}`);
              return; 
            }
            setModalType(null); 
            refreshData(); 
          }} className="w-full py-5 bg-[#004165] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Update & Save</button>
        </div>
      </Modal>

      <Modal title="Edit Member" isOpen={modalType === 'edit-member'} onClose={() => setModalType(null)}>
        <div className="space-y-6">
          <input value={inputData.name || ''} onChange={e => setInputData({...inputData, name: e.target.value})} placeholder="Name" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none focus:ring-2 focus:ring-blue-600"/>
          <input value={inputData.role || ''} onChange={e => setInputData({...inputData, role: e.target.value})} placeholder="Committee Role" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none focus:ring-2 focus:ring-blue-600"/>
          

          <button onClick={async () => { 
            if(!targetId) return; 
            setIsLoading(true); 
            const ok = await updateMeetingRole(targetId, inputData.name, { 
              Committee_Role: inputData.role
            }, true); 
            setIsLoading(false);
            if (!ok) {
              alert("⚠️ Save failed — check your connection. Member was NOT updated.");
              return;
            }
            setModalType(null); 
            refreshData(); 
          }} className="w-full py-5 bg-[#004165] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Save Changes</button>
        </div>
      </Modal>

      <Modal title="New Member" isOpen={modalType === 'add-member'} onClose={() => setModalType(null)}>
        <div className="space-y-6">
          <input value={inputData.name || ''} onChange={e => setInputData({...inputData, name: e.target.value})} placeholder="Full Name" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none focus:ring-2 focus:ring-emerald-600"/>
          <input value={inputData.role || ''} onChange={e => setInputData({...inputData, role: e.target.value})} placeholder="Committee Role" className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-none focus:ring-2 focus:ring-emerald-600"/>
          <button onClick={async () => { if(!inputData.name) return; setIsLoading(true); await addMember(inputData.name, inputData.role); setIsLoading(false); setModalType(null); refreshData(); }} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Add to Directory</button>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ title, isOpen, onClose, children }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-800">{title}</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button></div>
        {children}
      </motion.div>
    </div>
  );
}
