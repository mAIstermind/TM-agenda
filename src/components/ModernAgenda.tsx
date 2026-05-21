import React from 'react';
import { AgendaSegment } from '../services/gemini';
import { MeetingDetails, Member } from '../types';
import logo from '../assets/tm-logos.png';

interface ModernAgendaProps {
  segments: AgendaSegment[];
  details: MeetingDetails & { sessionNum: number };
  wotd: { word: string; meaning: string; example: string };
  members: Member[];
}

export const ModernAgenda: React.FC<ModernAgendaProps> = ({ segments, details, wotd, members }) => {
  // Extract officers
  const roles = [
    'President', 
    'VP Education', 
    'VP Membership', 
    'VP Public Relations', 
    'Secretary', 
    'Treasurer', 
    'Sergeant at Arms'
  ];
  
  const hasOfficerRole = (memberRoleStr: string, officerRole: string): boolean => {
    const normalizedMemberRoles = memberRoleStr
      .toLowerCase()
      .split(/[\/&+,]|\band\b/)
      .map(r => r.trim());

    const normOfficer = officerRole.toLowerCase();

    return normalizedMemberRoles.some(r => {
      if (normOfficer === 'sergeant at arms') {
        return r === 'sergeant at arms' || r === 'saa';
      }
      if (normOfficer === 'vp education') {
        return r === 'vp education' || r === 'vpe';
      }
      if (normOfficer === 'vp membership') {
        return r === 'vp membership' || r === 'vpm';
      }
      if (normOfficer === 'vp public relations') {
        return r === 'vp public relations' || r === 'vppr' || r === 'vp pr';
      }
      return r === normOfficer || r.includes(normOfficer);
    });
  };

  const officers = roles.map(role => ({
    role,
    name: members.find(m => hasOfficerRole(m.committeeRole || '', role))?.name || '---'
  }));

  return (
    <div className="agenda-page bg-white text-slate-800 font-sans shadow-2xl border border-slate-200 overflow-hidden mx-auto print:shadow-none print:border-none" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <header className="bg-tm-navy p-8 flex justify-between items-center text-white relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-white p-2 rounded-lg">
             <img src={logo} alt="TM Logo" className="h-20 w-auto object-contain" />
          </div>
          <div className="h-16 w-px bg-white/20 mx-2"></div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-tight">Inspiring Speakers PDC</h1>
            <p className="text-tm-gold font-bold text-sm tracking-widest uppercase">Club No. 28677134</p>
          </div>
        </div>
        
        <div className="text-right relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tm-gold/80 mb-1">Meeting Theme</p>
            <p className="text-lg font-bold italic leading-tight">"{details.theme}"</p>
          </div>
          <div className="mt-3 flex justify-end gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest bg-tm-maroon px-3 py-1 rounded-full">Session #{details.sessionNum}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(297mm-160px)]">
        {/* Sidebar */}
        <aside className="w-1/4 flex flex-col border-r border-slate-100">
          <div className="bg-tm-maroon p-8 text-white flex-1 space-y-8">
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Meeting Date</p>
               <p className="text-xl font-black leading-tight">
                 {(() => {
                   const d = new Date(details.date);
                   const day = d.getDate();
                   const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                   return `${day}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
                 })()}
               </p>
            </div>
            
            <div className="space-y-5">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tm-gold/60 pb-2 border-b border-white/10">Club Officers</p>
               {officers.map(off => (
                 <div key={off.role} className="space-y-0.5">
                   <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{off.role}</p>
                   <p className="text-xs font-black text-tm-gold leading-tight">{off.name}</p>
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-white/10">
               <p className="text-[10px] leading-relaxed opacity-60">Join us at the Aloft Playa del Carmen every Thursday evening at 7 pm</p>
               <p className="mt-2 text-[10px] font-black text-tm-gold uppercase tracking-widest">InspiringSpeakersPDC.com</p>
            </div>
          </div>

          <div className="bg-tm-navy p-8 text-white space-y-6 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-tm-gold rounded-full"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tm-gold/80">Word of the Day</p>
              </div>
              <p className="text-xl font-black text-white">{wotd.word || '---'}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Definition</p>
               <p className="text-[11px] leading-snug font-medium text-slate-300 max-h-32 overflow-y-auto pr-2 custom-scrollbar">{wotd.meaning || '---'}</p>
            </div>
            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5 italic">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-tm-gold/60 not-italic mb-1">Example</p>
               <p className="text-[11px] text-slate-200 leading-snug">"{wotd.example || '---'}"</p>
            </div>
          </div>
        </aside>

        {/* Main Agenda Table */}
        <main className="flex-1 p-0 flex flex-col bg-slate-50/30">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest w-24 text-slate-500">Time</th>
                <th className="py-4 px-2 text-center text-[10px] font-black uppercase tracking-widest w-20 text-slate-500">Dur</th>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Segment / Role</th>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase tracking-widest w-48 text-slate-500">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, idx) => (
                <tr key={idx} className={`border-b border-slate-100 group transition-colors hover:bg-tm-navy/[0.02] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="py-4 px-6 text-xs font-black text-tm-navy tracking-tighter">{seg.time}</td>
                  <td className="py-4 px-2 text-center">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase">{seg.duration}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tight">{seg.segment}</p>
                    {seg.details && (
                      <div className="mt-1.5 p-2 bg-tm-navy/[0.03] rounded border-l-2 border-tm-navy/20">
                        <p className="text-[10px] text-slate-500 font-bold leading-tight">{seg.details}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-black text-tm-maroon">{seg.assignedTo}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-auto p-10 flex justify-between items-end border-t border-slate-100">
            <div className="max-w-md">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Secretary's Notes</p>
               <p className="text-xs italic text-slate-500 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                 The club will have special gatherings for the 25th and January 1st. Please confirm your attendance on Easy-Speak.
               </p>
            </div>
            <div className="text-right opacity-20 grayscale scale-75 origin-right">
               <img src={logo} alt="TM Badge" className="h-16 w-auto" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
