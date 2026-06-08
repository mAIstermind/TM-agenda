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
  Timer as TimerIcon,
  ClipboardList
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
  updateRoleTitle,
  updateMeetingDetails,
  saveAgendaJSON
} from './services/teable';
import { generateMeetingAgenda, editAgendaWithAI, AgendaSegment } from './services/gemini';
import { MeetingRole, Member } from './types';
import { StitchAgenda } from './components/StitchAgenda';

// --- Components ---

const NumberBadge = ({ num }: { num: number }) => (
  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 select-none">
    {num}
  </span>
);

const TopBar = ({ connectionError, onOpenChecklist }: { connectionError: string | null, onOpenChecklist: () => void }) => (
  <header className="fixed top-0 left-0 w-full z-50 flex flex-col md:flex-row justify-between items-start md:items-end px-4 md:px-8 pt-4 md:pt-8 pb-3 md:pb-4 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 no-print">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600 flex items-center">TM-PRO v2.8 (TITANIUM STABILITY)</span>
        <button 
          onClick={onOpenChecklist} 
          className="ml-4 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg border border-blue-200 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
          title="Open Toastmaster Checklist"
        >
          <ClipboardList className="w-3 h-3" />
          Checklist
        </button>
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
            <button onClick={() => onUnassign(role.id)} className="p-2 bg-slate-100 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Unassign"><UserCircle className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => onClaim(role.id)} className="px-5 py-2 bg-[#004165] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-all shadow-lg active:scale-95 mr-2">Claim</button>
          )}
          <button onClick={() => onEdit(role.id)} className="p-2 bg-slate-100 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Role"><Settings2 className="w-5 h-5" /></button>
          <button onClick={() => onDelete(role.id)} className="p-2 bg-slate-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Role"><Trash2 className="w-5 h-5" /></button>
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
  const [isLiveView, setIsLiveView] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  
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
  const [showMission, setShowMission] = useState(() => localStorage.getItem('tm_show_mission') !== 'false');
  const [showValues, setShowValues] = useState(() => localStorage.getItem('tm_show_values') !== 'false');
  const [showAnnouncements, setShowAnnouncements] = useState(() => localStorage.getItem('tm_show_announcements') !== 'false');

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Unsaved changes & Database tracking
  const isInitialLoad = React.useRef(true);
  const [dbDetails, setDbDetails] = useState({
    theme: '',
    date: '',
    sessionNum: '',
    announcements: '',
    word: '',
    meaning: '',
    example: ''
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveDetailsSuccess, setSaveDetailsSuccess] = useState<boolean | null>(null);

  const hasUnsavedChanges = 
    theme !== dbDetails.theme ||
    meetingDate !== dbDetails.date ||
    sessionNum !== dbDetails.sessionNum ||
    announcements !== dbDetails.announcements ||
    wordOfTheDay !== dbDetails.word ||
    wordMeaning !== dbDetails.meaning ||
    wordExample !== dbDetails.example;

  // Sync to LocalStorage
  useEffect(() => localStorage.setItem('tm_theme', theme), [theme]);
  useEffect(() => localStorage.setItem('tm_date', meetingDate), [meetingDate]);
  useEffect(() => localStorage.setItem('tm_session_num', sessionNum), [sessionNum]);
  useEffect(() => localStorage.setItem('tm_announcements', announcements), [announcements]);
  useEffect(() => localStorage.setItem('tm_wotd', wordOfTheDay), [wordOfTheDay]);
  useEffect(() => localStorage.setItem('tm_meaning', wordMeaning), [wordMeaning]);
  useEffect(() => localStorage.setItem('tm_example', wordExample), [wordExample]);
  useEffect(() => localStorage.setItem('tm_show_mission', String(showMission)), [showMission]);
  useEffect(() => localStorage.setItem('tm_show_values', String(showValues)), [showValues]);
  useEffect(() => localStorage.setItem('tm_show_announcements', String(showAnnouncements)), [showAnnouncements]);

  useEffect(() => {
    let interval: any;
    if (window.location.hostname.includes('live')) {
      setIsLiveView(true);
      interval = setInterval(() => refreshData(false), 30000);
    }
    refreshData(false);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async (forceReload = false) => {
    setIsLoading(true);
    try {
      const [rosterData, membersData] = await Promise.all([ fetchMeetingRoster(), fetchMembers() ]);
      
      const membersList = [...(membersData || [])].sort((a, b) => a.name.localeCompare(b.name));

      // HYDRATE ROSTER WITH LOCAL CACHE FOR TIMES AND EXACT NAMES
      const hydratedRoster = (rosterData || []).map(r => {
        const memberMatch = membersList.find(m => m.name.toLowerCase() === (r.name || '').toLowerCase());
        return {
          ...r,
          name: memberMatch ? memberMatch.name : r.name,
          intro_duration: r.intro_duration || localStorage.getItem(`tm_intro_${r.id}`) || '',
          report_duration: r.report_duration || localStorage.getItem(`tm_report_${r.id}`) || ''
        };
      });
      
      setRoster(hydratedRoster);
      setMembers(membersList);
      
      // Extract latest values from Teable
      const tmod = hydratedRoster.find(r => r.role.toLowerCase().includes('toastmaster'));
      const gram = hydratedRoster.find(r => r.role.toLowerCase().includes('grammarian'));
      
      const fetchedDetails = {
        theme: tmod?.theme || '',
        date: tmod?.date || '',
        sessionNum: tmod?.sessionNum || '',
        announcements: tmod?.announcements || '',
        word: gram?.wotd || '',
        meaning: gram?.meaning || '',
        example: gram?.example || ''
      };
      
      setDbDetails(fetchedDetails);

      if (tmod && tmod.agenda_json) {
        try {
          setAgendaDraft(JSON.parse(tmod.agenda_json));
        } catch (e) {
          console.error("Failed to parse saved agenda json", e);
        }
      }

      // Check if we should update local React state inputs.
      // We only overwrite local state if it is the initial load, if the user explicitly clicked the force refresh button,
      // if there are no unsaved changes, or if the user is not actively on the dashboard tab editing.
      const shouldSyncState = isInitialLoad.current || forceReload || !hasUnsavedChanges || activeTab !== 'dashboard';
      
      if (shouldSyncState) {
        if (fetchedDetails.theme) setTheme(fetchedDetails.theme);
        if (fetchedDetails.date) setMeetingDate(fetchedDetails.date);
        if (fetchedDetails.sessionNum) setSessionNum(fetchedDetails.sessionNum);
        if (fetchedDetails.announcements) setAnnouncements(fetchedDetails.announcements);
        if (fetchedDetails.word) setWordOfTheDay(fetchedDetails.word);
        if (fetchedDetails.meaning) setWordMeaning(fetchedDetails.meaning);
        if (fetchedDetails.example) setWordExample(fetchedDetails.example);
        
        // Match dbDetails to the newly synced values
        setDbDetails(fetchedDetails);
      }
      
      isInitialLoad.current = false;

      const savedUserId = localStorage.getItem('tm_user_id');
      if (savedUserId && membersData?.length > 0) {
        const user = membersData.find((m: Member) => m.id === savedUserId);
        if (user) setCurrentUser(user);
      }
      setConnectionError(null);
    } catch (err) { setConnectionError("Offline"); }
    finally { setIsLoading(false); }
  };

  const saveMeetingDetails = async () => {
    setIsSavingDetails(true);
    setSaveDetailsSuccess(null);
    try {
      const details = {
        theme,
        date: meetingDate,
        sessionNum,
        announcements,
        word: wordOfTheDay,
        meaning: wordMeaning,
        example: wordExample
      };
      const ok = await updateMeetingDetails(roster, details);
      if (ok) {
        setDbDetails(details);
        setSaveDetailsSuccess(true);
        setTimeout(() => setSaveDetailsSuccess(null), 3000);
      } else {
        setSaveDetailsSuccess(false);
        alert("⚠️ Save failed. Please check your network connection and database configuration.");
      }
    } catch (error) {
      setSaveDetailsSuccess(false);
      alert("⚠️ An error occurred while saving meeting details.");
    } finally {
      setIsSavingDetails(false);
    }
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
    const success = await updateMeetingRole(targetId, member.name, extra);
    setIsLoading(false);
    if (success) {
      setModalType(null); 
      refreshData();
    } else {
      alert("⚠️ Failed to claim role. Please check your network connection and database configuration.");
    }
  };

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);
    try {
      localStorage.setItem('tm_theme', theme);
      localStorage.setItem('tm_date', meetingDate);
      localStorage.setItem('tm_session_num', sessionNum);
      localStorage.setItem('tm_announcements', announcements);
      localStorage.setItem('tm_wotd', wordOfTheDay);
      localStorage.setItem('tm_meaning', wordMeaning);
      localStorage.setItem('tm_example', wordExample);

      const details = { theme, date: meetingDate, sessionNum, announcements, word: wordOfTheDay, meaning: wordMeaning, example: wordExample };
      const ok = await updateMeetingDetails(roster, details);
      if (ok) {
        setDbDetails(details);
      }
      
      // Merge member profile data into the roster ONLY for Speaker roles
      const enrichedRoster = roster.map(r => {
        if (!r.name || r.status !== 'Confirmed') return r;
        const member = members.find(m => m.name === r.name);
        if (!member) return r;

        const isSpeaker = r.role.toLowerCase().includes('speaker');
        return {
          ...r,
          pathway: isSpeaker ? (r.pathway || member.currentPathway || '') : '',
          level: isSpeaker ? (r.level || member.currentLevel || '') : '',
          project_number: isSpeaker ? (r.project_number || member.latestSpeechNumber || '') : '',
          speech_title: isSpeaker ? (r.speech_title || member.latestSpeechTitle || '') : ''
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
      await saveAgendaJSON(enrichedRoster, JSON.stringify(segments));
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
      await saveAgendaJSON(roster, JSON.stringify(next));
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

  if (isLiveView) {
    if (!agenda) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
          <Loader2 className="w-12 h-12 text-[#F2DF74] animate-spin mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#F2DF74] mb-2">Agenda Not Ready</h2>
          <p className="text-slate-400 max-w-md">The agenda has not been published yet. Please wait, this page will automatically refresh.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 py-4 sm:py-8 overflow-auto">
        {!window.location.hostname.includes('live') && (
          <button onClick={() => setIsLiveView(false)} className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-xl transition-all shadow-xl border border-white/20">
            <X className="w-6 h-6"/>
          </button>
        )}
        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl relative mx-auto shrink-0">
          <StitchAgenda 
            readOnly
            segments={agenda} 
            details={{ theme, date: meetingDate, time: "19:00", location: "Aloft Playa", sessionNum, announcements, showMission, showValues, showAnnouncements }} 
            wotd={{ word: wordOfTheDay, meaning: wordMeaning, example: wordExample }} 
            members={members}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      <TopBar connectionError={connectionError} onOpenChecklist={() => setShowChecklistModal(true)} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <NumberBadge num={1} />
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meeting Theme</label>
                          {hasUnsavedChanges && (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                              Unsaved Changes
                            </span>
                          )}
                        </div>
                        <input value={theme} onChange={e => setTheme(e.target.value)} className="text-xl md:text-3xl font-black text-slate-800 w-full focus:outline-none bg-transparent"/>
                      </div>
                      <div className="w-24 md:w-28">
                        <div className="flex items-center gap-2 mb-1">
                          <NumberBadge num={2} />
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Session</label>
                        </div>
                        <input value={sessionNum} onChange={e => setSessionNum(e.target.value)} className="text-xl md:text-3xl font-black text-blue-600 w-full focus:outline-none bg-transparent"/>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                       <div className="flex items-center gap-3">
                          <CalendarDays className="w-5 h-5 text-[#004165] shrink-0 mt-3"/>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <NumberBadge num={3} />
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meeting Date</label>
                            </div>
                            <input 
                              type="date" 
                              value={meetingDate} 
                              onChange={e => setMeetingDate(e.target.value)} 
                              className="font-bold text-slate-450 focus:outline-none bg-transparent text-sm border-none p-0 cursor-pointer"
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
                       <div className="flex-1 flex flex-col gap-2">
                         <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                            <Megaphone className="w-4 h-4 text-blue-600 shrink-0"/>
                            <input value={announcements} onChange={e => setAnnouncements(e.target.value)} placeholder="Main Announcements..." className="bg-transparent border-none focus:outline-none text-sm font-bold text-blue-700 w-full placeholder:text-blue-300"/>
                         </div>
                         <div className="flex gap-4 items-center pl-2">
                           <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                             <input type="checkbox" checked={showAnnouncements} onChange={e => setShowAnnouncements(e.target.checked)} className="rounded text-[#004165] focus:ring-[#004165]" />
                             Show Announcements
                           </label>
                           <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                             <input type="checkbox" checked={showMission} onChange={e => setShowMission(e.target.checked)} className="rounded text-[#004165] focus:ring-[#004165]" />
                             Show Mission
                           </label>
                           <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                             <input type="checkbox" checked={showValues} onChange={e => setShowValues(e.target.checked)} className="rounded text-[#004165] focus:ring-[#004165]" />
                             Show Values
                           </label>
                         </div>
                       </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex gap-4 flex-wrap items-center">
                    <div className="flex flex-col gap-1">
                      <button onClick={handleGenerateAgenda} disabled={isGenerating} className="px-8 py-4 bg-[#004165] text-white rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-900 transition-all active:scale-95">
                        <span className="w-5 h-5 rounded-full bg-white text-[#004165] flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 select-none">6</span>
                        {isGenerating ? <Loader2 className="animate-spin w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
                        Generate Agenda
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">do this after you complete the roles</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={saveMeetingDetails} 
                        disabled={isSavingDetails} 
                        className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl transition-all active:scale-95 ${
                          hasUnsavedChanges 
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200/50' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                        }`}
                      >
                        {isSavingDetails ? (
                          <Loader2 className="animate-spin w-5 h-5"/>
                        ) : saveDetailsSuccess === true ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500"/>
                        ) : saveDetailsSuccess === false ? (
                          <AlertTriangle className="w-5 h-5 text-red-500"/>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-slate-400"/>
                        )}
                        {isSavingDetails ? 'Saving...' : saveDetailsSuccess === true ? 'Details Saved!' : hasUnsavedChanges ? 'Save Details' : 'Details Saved'}
                      </button>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved to cloud'}
                      </span>
                    </div>

                    <button onClick={() => refreshData(true)} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-[#004165] transition-all" title="Force refresh from database"><History/></button>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 space-y-4 border border-slate-100">
                  <h3 className="italic text-lg font-black text-[#004165] flex items-center gap-2">
                    <NumberBadge num={4} />
                    Word of the Day
                  </h3>
                  <div className="space-y-3">
                    <input value={wordOfTheDay} onChange={e => setWordOfTheDay(e.target.value)} className="font-black text-sm bg-white rounded-xl px-4 py-2 w-full shadow-sm" placeholder="Word"/>
                    <textarea value={wordMeaning} onChange={e => setWordMeaning(e.target.value)} className="text-xs italic bg-white rounded-xl px-4 py-2 w-full shadow-sm resize-none" rows={3} placeholder="Definition"/>
                    <textarea value={wordExample} onChange={e => setWordExample(e.target.value)} className="text-xs italic bg-white rounded-xl px-4 py-2 w-full shadow-sm resize-none" rows={3} placeholder="Example"/>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 mb-2">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <NumberBadge num={5} />
                  Roster & Roles
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {roster.map(r => (
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
                        <button onClick={async () => { await refreshData(); setTargetId(m.id); setInputData({ name: m.name, role: m.committeeRole }); setModalType('edit-member'); }} className="p-2 bg-white rounded-xl shadow-sm text-blue-600"><Edit2 className="w-4 h-4"/></button>
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
              <div className="flex-1 w-full bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 overflow-x-auto print:overflow-visible print:p-0 print:border-none print:shadow-none print:bg-transparent">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-10 no-print">
                   <div className="flex gap-3">
                     <button onClick={() => window.print()} className="px-6 md:px-8 py-3 bg-[#004165] text-white rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer className="w-4 h-4"/> Print A4</button>
                     <button onClick={() => setIsLiveView(true)} className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors"><Eye className="w-4 h-4"/> Live View</button>
                     <button onClick={() => setAgendaDraft(null)} className="px-4 md:px-6 py-3 bg-slate-100 rounded-2xl text-slate-500 font-bold">Discard</button>
                     <button onClick={() => setShowAssistant(!showAssistant)} className="px-4 md:px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold border border-blue-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        {showAssistant ? 'Hide AI' : 'Show Assistant'}
                     </button>
                   </div>
                </div>
                {agenda && (
                  <div className="min-w-fit print:min-w-0 print:w-full">
                    <StitchAgenda 
                      segments={agenda} 
                      details={{ theme, date: meetingDate, time: "19:00", location: "Aloft Playa", sessionNum, announcements, showMission, showValues, showAnnouncements }} 
                      wotd={{ word: wordOfTheDay, meaning: wordMeaning, example: wordExample }} 
                      members={members}
                      onEditSegment={(idx, field, val) => { 
                        const next = [...agenda]; 
                        (next[idx] as any)[field] = val; 
                        setAgendaDraft(next); 
                        saveAgendaJSON(roster, JSON.stringify(next));
                      }}
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
                       <div className="flex gap-4">
                         <input value={currentUser.latestSpeechNumber || ''} onChange={e => setCurrentUser({...currentUser, latestSpeechNumber: e.target.value})} placeholder="Speech #" className="w-24 bg-slate-50 rounded-xl px-4 py-3 font-bold border-none"/>
                         <input value={currentUser.latestSpeechTitle || ''} onChange={e => setCurrentUser({...currentUser, latestSpeechTitle: e.target.value})} placeholder="Next Title" className="flex-1 bg-slate-50 rounded-xl px-4 py-3 font-bold border-none"/>
                       </div>
                       
                       <button onClick={async () => { 
                         setIsLoading(true);
                         const ok = await updateMeetingRole(currentUser.id, undefined, { 
                           Pathway: currentUser.currentPathway,
                           Level: currentUser.currentLevel,
                           Project_Number: currentUser.latestSpeechNumber,
                           Speech_Title: currentUser.latestSpeechTitle
                         }, true); 

                         // Sync to Roster Roles if assigned
                         const mySpeakerRoles = roster.filter(r => r.name === currentUser.name && r.role.toLowerCase().includes('speaker'));
                         for (const role of mySpeakerRoles) {
                           await updateMeetingRole(role.id, undefined, {
                             Pathway: currentUser.currentPathway,
                             Level: currentUser.currentLevel,
                             Project_Number: currentUser.latestSpeechNumber,
                             Speech_Title: currentUser.latestSpeechTitle
                           });
                         }

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

            // Sync back to Profile
            const currentRole = roster.find(r => r.id === targetId);
            if (response === true && currentRole && currentRole.name && inputData.title?.toLowerCase().includes('speaker')) {
               const assignedMember = members.find(m => m.name === currentRole.name);
               if (assignedMember) {
                 await updateMeetingRole(assignedMember.id, undefined, {
                   Pathway: inputData.pathway,
                   Level: inputData.level,
                   Project_Number: inputData.project_number,
                   Speech_Title: inputData.speech_title
                 }, true);
               }
            }

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

      <AnimatePresence>
        {showChecklistModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowChecklistModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            {/* Modal container */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 max-w-2xl w-full relative max-h-[85vh] overflow-y-auto z-10"
            >
              <button 
                onClick={() => setShowChecklistModal(false)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Toastmaster Checklist</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Before you generate the agenda</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <p className="text-sm font-semibold text-slate-500">Ensure the following details are prepared on the dashboard:</p>
                  
                  <div className="space-y-3">
                    {[
                      { num: 1, label: "Meeting Theme", desc: "Define the theme/tone of the Toastmasters session." },
                      { num: 2, label: "Session Number", desc: "Confirm it matches the sequential count of the club meetings." },
                      { num: 3, label: "Meeting Date", desc: "Check that the scheduled date matches your target session." },
                      { num: 4, label: "Word of the Day", desc: "Specify a word, its lexical definition, and a usage example." },
                      { num: 5, label: "Roster Roles", desc: "Assign members to roles. Ensure speaker details are up to date." }
                    ].map(item => (
                      <div key={item.num} className="flex gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">{item.num}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{item.label}</h4>
                          <p className="text-xs text-slate-400 font-semibold">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speakers Section */}
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Speakers & Allocated Time</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                    {roster.filter(r => r.role.toLowerCase().includes('speaker') && r.status === 'Confirmed').length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold italic">No confirmed speakers in roster.</p>
                    ) : (
                      roster.filter(r => r.role.toLowerCase().includes('speaker') && r.status === 'Confirmed').map((s, idx) => {
                        const memberMatch = members.find(m => m.name === s.name);
                        const pathway = s.pathway || memberMatch?.currentPathway || '---';
                        const level = s.level || memberMatch?.currentLevel ? `Level ${s.level || memberMatch?.currentLevel}` : '---';
                        const title = s.speech_title || memberMatch?.latestSpeechTitle || '---';
                        const duration = s.duration || (s.level === '1' ? '4-6 min' : '5-7 min');
                        return (
                          <div key={s.id} className="flex justify-between items-start border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                            <div>
                              <p className="text-xs font-black text-[#004165] uppercase">Speaker #{idx + 1}: {s.name}</p>
                              <p className="text-[11px] font-bold text-slate-500">
                                {pathway !== '---' || level !== '---' ? `${pathway} (${level})` : 'No Pathway details'}
                              </p>
                              <p className="text-[11px] italic text-[#772432] font-semibold">"{title}"</p>
                            </div>
                            <span className="text-xs font-bold bg-blue-100/60 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                              {duration.includes('min') ? duration : `${duration} min`}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* AI Assistant Info */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 space-y-3 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 text-white mt-1 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                      <MessageSquare className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider">AI Assistant Chatbot</h4>
                      <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                        Unusual discrepancies or custom changes can be handled after generation by typing instructions to the **AI Assistant chatbot**. It supports **any preferred language** and is found in the right sidebar under the **Agenda** tab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
