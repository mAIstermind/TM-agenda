import React from 'react';
import { AgendaSegment } from '../services/gemini';
import { MeetingDetails, Member } from '../types';
import logoFinal from '../assets/tm-logo-final.png';

interface StitchAgendaProps {
  segments: AgendaSegment[];
  details: MeetingDetails & { sessionNum: string; announcements: string };
  wotd: { word: string; meaning: string; example: string };
  members: Member[];
  onEditSegment?: (index: number, field: string, value: string) => void;
  onEditDetail?: (field: string, value: string) => void;
}

export const StitchAgenda: React.FC<StitchAgendaProps> = ({ 
  segments, 
  details, 
  wotd, 
  members,
  onEditSegment,
  onEditDetail
}) => {
  const roles = [
    'President', 
    'VP Education', 
    'VP Membership', 
    'VP Public Relations', 
    'Secretary', 
    'Treasurer', 
    'Sergeant at Arms'
  ];
  
  const officers = roles.map(role => ({
    role,
    name: members.find(m => (m.committeeRole || '').toLowerCase().includes(role.toLowerCase()))?.name || '---'
  }));

  return (
    <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden font-['Montserrat',sans-serif] mx-auto print:shadow-none print:border-none print:m-0 print:w-[210mm] print:h-[297mm] printable-area" 
         style={{ width: '210mm', height: '297mm', padding: '0', display: 'flex', flexDirection: 'column' }} id="agenda-page">
      <header className="bg-[#004165] text-white p-5 print:bg-[#004165] print:text-white relative shrink-0">
        <div className="flex justify-between items-center gap-8">
          <div className="flex items-center gap-6 shrink-0">
            <img alt="TM Logo" className="h-16 w-auto object-contain" src={logoFinal}/>
            <div className="text-left border-l border-white/20 pl-6">
              <h1 className="text-2xl font-black tracking-tighter leading-tight uppercase">Toastmasters</h1>
              <p className="text-[9px] tracking-[0.3em] font-light -mt-1 uppercase opacity-80">International</p>
            </div>
          </div>
          
          <div className="flex-1 text-right min-w-0">
            <h2 className="text-xl font-black uppercase tracking-tight truncate">Inspiring Speakers PDC</h2>
            <div className="flex justify-end gap-x-2 mt-1 text-xs font-medium">
              <span className="opacity-60 text-[9px] font-black uppercase tracking-widest shrink-0">Theme:</span>
              <input 
                className="bg-transparent border-none text-tm-gold font-bold w-full text-right focus:outline-none p-0 italic text-xs" 
                value={details.theme}
                onChange={(e) => onEditDetail?.('theme', e.target.value)}
                style={{ color: '#F2DF74' }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 py-1 bg-white/10 border-t border-b border-white/10 text-center">
          <span className="text-[10px] uppercase tracking-widest font-black opacity-90">Session: </span>
          <input 
            className="bg-transparent border-none text-white font-black w-12 text-center focus:outline-none p-0" 
            value={details.sessionNum}
            onChange={(e) => onEditDetail?.('sessionNum', e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="agenda-sidebar w-[180px] bg-[#772432] text-white flex-shrink-0 flex flex-col print:bg-[#772432]">
          <div className="p-6 space-y-6 flex-1">
            <div className="text-center mb-6 pb-4 border-b border-white/10">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Meeting Date</p>
              <div className="font-black text-xs text-white">
                {(() => {
                  // FIX: Parse date without timezone shift
                  const parts = details.date.split('-');
                  if (parts.length !== 3) return details.date;
                  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  
                  if (isNaN(d.getTime())) return details.date;
                  const day = d.getDate();
                  const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
                  return `${day}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
                })()}
              </div>
            </div>
            <div className="space-y-4">
              {officers.map(off => (
                <div key={off.role} className="text-center">
                  <p className="text-[8px] uppercase tracking-widest opacity-50 mb-0.5">{off.role}</p>
                  <p className="font-black text-[11px] text-[#F2DF74]">{off.name}</p>
                </div>
              ))}
            </div>
            <div className="pt-6 mt-6 border-t border-white/20 text-center space-y-4">
              <p className="text-[9px] font-semibold leading-relaxed opacity-70">
                Join us at the Aloft Playa del Carmen every Thursday evening at 7 pm
              </p>
              <p className="text-[9px] font-black tracking-widest text-[#F2DF74] uppercase">InspiringSpeakersPDC.com</p>
            </div>
          </div>

          <div className="bg-black/20 p-6 space-y-4">
            <h3 className="italic text-lg font-black text-[#F2DF74]">Word of the Day</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Word:</p>
                <input 
                  className="font-black text-xs bg-white/10 rounded px-2 py-1 w-full text-white border-none focus:ring-0" 
                  value={wotd.word}
                  onChange={(e) => onEditDetail?.('word', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest opacity-50">Definition:</p>
                <textarea 
                  className="text-[10px] italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none" 
                  rows={4} 
                  value={wotd.meaning}
                  onChange={(e) => onEditDetail?.('meaning', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest opacity-50">Example:</p>
                <textarea 
                  className="text-[10px] italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none" 
                  rows={4} 
                  value={wotd.example}
                  onChange={(e) => onEditDetail?.('example', e.target.value)}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 bg-white agenda-main flex flex-col overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-2 text-left text-[9px] uppercase tracking-widest text-slate-500 font-bold w-16">Time</th>
                <th className="py-2 text-left text-[9px] uppercase tracking-widest text-slate-500 font-bold w-16">Dur</th>
                <th className="py-2 text-left text-[9px] uppercase tracking-widest text-slate-500 font-bold">Agenda Item</th>
                <th className="py-2 text-right text-[9px] uppercase tracking-widest text-slate-500 font-bold">Speaker / Role</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-b border-gray-100 group print:bg-transparent`}>
                  <td className="text-left font-black text-[#004165] py-3 text-xs">
                    <span className="block w-full">{seg.time}</span>
                  </td>
                  <td className="text-center py-2">
                    <span className="block w-full text-gray-400 font-bold text-[10px]">{seg.duration}</span>
                  </td>
                  <td className="px-3 py-2 overflow-hidden">
                    <div className="font-black text-[#004165] uppercase tracking-tight leading-tight whitespace-normal break-words">
                      {seg.segment}
                    </div>
                    {seg.details && (
                      <div className="text-[9px] text-gray-500 font-medium leading-tight whitespace-normal break-words mt-0.5">
                        {seg.details}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 overflow-hidden">
                    <div className="font-black text-[#772432] leading-tight whitespace-normal break-words">
                      {seg.assignedTo === 'N/A' || seg.assignedTo === 'n/a' ? '' : seg.assignedTo}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className="p-4 border-t border-gray-100 mt-auto shrink-0 print:border-t-2 print:border-slate-100">
            <div className="text-center max-w-xl mx-auto">
              <h4 className="text-[9px] uppercase tracking-[0.4em] font-black text-gray-500 mb-2 print:text-black">Announcements</h4>
              <p className="w-full text-center font-bold text-xs italic whitespace-pre-wrap print:text-black">
                {details.announcements}
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
