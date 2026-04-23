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
  Info,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Menu,
  Bell
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MeetingRole, MeetingDetails } from './types';
import { fetchMeetingRoster } from './services/teable';
import { generateMeetingAgenda } from './services/gemini';

// --- Components ---

const TopBar = () => (
  <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="w-4 h-4 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-pulse"></div>
      <div>
        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 leading-none mb-1">TM-PRO Agenda</div>
        <div className="text-slate-900 font-extrabold text-2xl tracking-tighter leading-none">Toastmaster Architect</div>
      </div>
    </div>
    <div className="flex items-center gap-5">
      <div className="hidden md:flex bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex-col">
        <span className="text-[10px] uppercase font-black text-slate-400">Database</span>
        <span className="text-xs font-bold text-slate-700">Teable Connected</span>
      </div>
      <button className="p-2.5 hover:bg-slate-50 rounded-2xl transition-all relative group active:scale-90">
        <Bell className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
      </button>
      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
        <UserCircle className="text-blue-600 w-7 h-7" />
      </div>
    </div>
  </header>
);

const BottomNav = ({ active, onChange }: { active: string, onChange: (v: string) => void }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(15,23,42,0.04)] px-4 pb-safe md:hidden">
    {[
      { id: 'dashboard', icon: BarChart3, label: 'Board' },
      { id: 'agenda', icon: CalendarDays, label: 'Agenda' },
      { id: 'roles', icon: Users, label: 'Roles' },
      { id: 'profile', icon: UserCircle, label: 'Profile' },
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => onChange(item.id)}
        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 ${
          active === item.id ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-400'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span className="text-[10px] mt-1 uppercase tracking-tighter">{item.label}</span>
      </button>
    ))}
  </nav>
);

const RoleCard = ({ role }: { role: MeetingRole }) => (
  <div className={`group flex items-center justify-between p-4 rounded-3xl transition-all hover:translate-y-[-2px] ${
    role.status === 'Confirmed' ? 'bg-blue-50/40 shadow-sm' : 'bg-white border-2 border-dashed border-slate-100 hover:border-blue-100'
  }`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
        role.status === 'Confirmed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-300'
      }`}>
        {role.role.includes('Speaker') ? <Users className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 leading-tight mb-0.5">{role.role}</p>
        <p className={`text-sm ${role.status === 'Confirmed' ? 'font-extrabold text-slate-800' : 'font-bold italic text-slate-300'}`}>
          {role.status === 'Confirmed' ? role.name : 'VACANT'}
        </p>
      </div>
    </div>
    {role.status === 'Confirmed' ? (
      <div className="w-6 h-6 bg-blue-100 rounded-xl flex items-center justify-center">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 font-bold" />
      </div>
    ) : (
      <button className="bg-slate-800 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200 uppercase tracking-widest">
        Claim
      </button>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roster, setRoster] = useState<MeetingRole[]>([]);
  const [agenda, setAgenda] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const data = await fetchMeetingRoster();
      setRoster(data);
      setIsLoading(false);
    }
    init();
  }, []);

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);
    const result = await generateMeetingAgenda(roster);
    setAgenda(result);
    setIsGenerating(false);
    setActiveTab('agenda');
  };

  const confirmedCount = roster.filter(r => r.status === 'Confirmed').length;
  const fillPercentage = roster.length > 0 ? Math.round((confirmedCount / roster.length) * 100) : 0;
  const vacantRoles = roster.filter(r => r.status === 'Open' || r.status === 'Vacant');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-8">
      <TopBar />
      
      <main className="pt-28 px-6 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Header Block */}
              <div className="md:col-span-12 mb-2">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Master Meeting Architect</h1>
                    <p className="text-slate-500 font-medium mt-1">Tuesday, October 24, 2023 • Inspiring Speakers PDC</p>
                  </div>
                  <button 
                    onClick={handleGenerateAgenda}
                    disabled={isGenerating}
                    className="bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 text-white font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300"
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isGenerating ? 'Synthesizing...' : 'Regenerate Agenda'}
                  </button>
                </div>
              </div>

              {/* Main Agenda Preview / Roster Block (Col 1-8) */}
              <div className="md:col-span-8 bg-white rounded-4xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Live Agenda Draft</h2>
                      <p className="text-xs font-mono text-slate-400">Gemini 1.5 Lite Optimized</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">Draft v2.4</span>
                  </div>
                </div>

                <div className="flex-grow">
                  {agenda ? (
                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown>{agenda}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-400">Ready to synthesize</h3>
                      <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Click regenerate to apply 25 years of expertise into a high-energy meeting script.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Panels (Col 9-12) */}
              <div className="md:col-span-4 flex flex-col gap-6">
                {/* Confirmed Roster Block */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Confirmed Roster</h3>
                  <div className="space-y-2">
                    {roster.filter(r => r.status === 'Confirmed').slice(0, 4).map(role => (
                      <div key={role.id} className="flex justify-between items-center text-sm p-3 bg-blue-50/40 rounded-xl">
                        <span className="font-medium text-slate-600">{role.role}</span>
                        <span className="font-extrabold text-blue-700">{role.name.split(',')[0]}</span>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveTab('roles')}
                      className="w-full py-2 text-[10px] uppercase font-black text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      View Full Roster
                    </button>
                  </div>
                </div>

                {/* AI Intelligence Block */}
                <div className="bg-slate-900 rounded-3xl p-7 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-16 h-16 rotate-12" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-[10px] font-black opacity-50 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      AI Intelligence Layer
                    </h3>
                    <p className="text-xl font-bold leading-tight">Applying 25-year expertise for high-energy transitions.</p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 relative z-10 pt-4 border-t border-white/10">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs ring-4 ring-blue-600/20">G</div>
                    <span className="text-[10px] font-mono opacity-60 tracking-wider">GEMINI_3_FLASH_ACTIVE</span>
                  </div>
                </div>

                {/* Vacancies Block */}
                <div className="bg-amber-100 rounded-3xl border-2 border-amber-200 p-6 flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Vacancies</h3>
                    <div className="px-2 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded uppercase tracking-widest">Urgent</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {vacantRoles.length > 0 ? vacantRoles.map(vr => (
                      <span key={vr.id} className="bg-white px-3 py-1.5 rounded-full text-[10px] font-extrabold text-amber-800 border border-amber-200 shadow-sm">
                        {vr.role}
                      </span>
                    )) : (
                      <span className="text-amber-800 font-bold text-xs italic">All roles filled! 🎉</span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-700 font-bold mb-6">Building next week's momentum starts with filling these slots today.</p>
                  <button className="mt-auto w-full bg-amber-900 text-white py-4 rounded-2xl font-extrabold hover:bg-amber-950 transition-all active:scale-95 text-xs shadow-lg shadow-amber-900/10">
                    Generate Recruitment Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'roles' || activeTab === 'profile') && (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 min-h-[60vh]"
            >
               {activeTab === 'roles' ? (
                  <div className="space-y-8">
                    <header>
                      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Meeting Roster</h2>
                      <p className="text-slate-400 font-medium uppercase text-xs tracking-widest mt-1">October 24 Session</p>
                    </header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roster.map(role => (
                        <RoleCard key={role.id} role={role} />
                      ))}
                    </div>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-32 h-32 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-8">
                      <UserCircle className="w-16 h-16 text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Dynamic Mike</h2>
                    <p className="text-slate-400 font-medium">Distinguished Toastmaster (DTM Candidate)</p>
                    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <span className="text-2xl font-black text-blue-600">42</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Speeches</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <span className="text-2xl font-black text-amber-600">12</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Roles</span>
                      </div>
                    </div>
                  </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
