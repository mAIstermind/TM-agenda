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
  
  const officers = roles.map(role => {
    let match: any;
    if (role === 'Sergeant at Arms') {
      match = members.find(m => {
        const cRole = (m.committeeRole || '').toLowerCase();
        return cRole.includes('sergeant at arms') || cRole === 'saa';
      });
    } else {
      match = members.find(m => (m.committeeRole || '').toLowerCase().includes(role.toLowerCase()));
    }
    return {
      role,
      name: match?.name || '---'
    };
  });

  return (
    <div className="bg-white shadow-2xl border border-gray-200 font-['Montserrat',sans-serif] mx-auto print:shadow-none print:border-none print:m-0 print:w-[210mm] printable-area" 
         style={{ width: '210mm', minHeight: '297mm', height: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }} id="agenda-page">
      <header className="bg-[#004165] text-white p-5 print:bg-[#004165] print:text-white relative shrink-0 agenda-header">
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
                className="bg-transparent border-none text-tm-gold font-bold w-full text-right focus:outline-none p-0 italic text-xs print:hidden" 
                value={details.theme}
                onChange={(e) => onEditDetail?.('theme', e.target.value)}
                style={{ color: '#F2DF74' }}
              />
              <div className="hidden print:block text-[#F2DF74] font-bold italic text-xs text-right break-words">
                {details.theme}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 py-1 bg-white/10 border-t border-b border-white/10 text-center">
          <span className="text-[10px] uppercase tracking-widest font-black opacity-90">Session: </span>
          <input 
            className="bg-transparent border-none text-white font-black w-12 text-center focus:outline-none p-0 print:hidden" 
            value={details.sessionNum}
            onChange={(e) => onEditDetail?.('sessionNum', e.target.value)}
          />
          <div className="hidden print:inline-block text-white font-black w-12 text-center">
            {details.sessionNum}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="agenda-sidebar w-[180px] bg-[#772432] text-white flex-shrink-0 flex flex-col print:bg-[#772432]">
          <div className="p-6 space-y-6">
            <div className="text-center mb-6 pb-4 border-b border-white/10">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Meeting Date</p>
              <input 
                type="date"
                className="font-black text-xs text-white bg-transparent border-none focus:outline-none w-full text-center print:hidden cursor-pointer"
                value={details.date ? details.date.split('T')[0] : ''}
                onChange={(e) => onEditDetail?.('date', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
              <div className="hidden print:block font-black text-xs text-white">
                {(() => {
                  const val = details.date ? details.date.split('T')[0] : '';
                  if (!val) return 'TBD';
                  const parts = val.split('-');
                  if (parts.length !== 3) return val;
                  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  
                  if (isNaN(d.getTime())) return val;
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

          <div className="bg-black/20 p-6 space-y-4 flex-1">
            <h3 className="italic text-lg font-black text-[#F2DF74]">Word of the Day</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Word:</p>
                <input 
                  className="font-black text-xs bg-white/10 rounded px-2 py-1 w-full text-white border-none focus:ring-0 print:hidden" 
                  value={wotd.word}
                  onChange={(e) => onEditDetail?.('word', e.target.value)}
                />
                <div className="hidden print:block font-black text-xs text-white break-words">
                  {wotd.word}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest opacity-50">Definition:</p>
                <textarea 
                  className="text-[10px] italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none print:hidden overflow-hidden" 
                  rows={2} 
                  value={wotd.meaning}
                  onChange={(e) => onEditDetail?.('meaning', e.target.value)}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  style={{ minHeight: '60px' }}
                />
                <div className="hidden print:block text-[10px] italic font-medium leading-snug text-white whitespace-pre-wrap break-words">
                  {wotd.meaning}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest opacity-50">Example:</p>
                <textarea 
                  className="text-[10px] italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none print:hidden overflow-hidden" 
                  rows={2} 
                  value={wotd.example}
                  onChange={(e) => onEditDetail?.('example', e.target.value)}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  style={{ minHeight: '60px' }}
                />
                <div className="hidden print:block text-[10px] italic font-medium leading-snug text-white whitespace-pre-wrap break-words">
                  {wotd.example}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 p-6 space-y-3 shrink-0 mt-auto flex-1">
            <h4 className="text-[9px] uppercase tracking-[0.3em] font-black text-[#F2DF74] text-center">Announcements</h4>
            <div className="w-full text-center font-bold text-[10px] italic text-slate-200 whitespace-pre-wrap break-words leading-tight">
              {details.announcements}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 bg-white agenda-main flex flex-col">
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
              {segments.map((seg, idx) => {
                const isSpeaker = seg.segment.toLowerCase().startsWith('speaker #');
                return (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-b border-gray-100 group print:bg-transparent`}>
                    <td className="text-left font-black text-[#004165] py-3 text-xs w-20">
                      {isSpeaker && <span className="block text-[8px] uppercase tracking-widest text-slate-400 mb-0.5">{seg.segment}</span>}
                      <span className="block w-full">{seg.time}</span>
                    </td>
                    <td className="text-center py-2 w-16">
                      <span className="block w-full text-gray-400 font-bold text-[10px]">{seg.duration}</span>
                    </td>
                    <td className="px-3 py-2 overflow-hidden">
                      {isSpeaker ? (
                        <div className="font-black text-[#004165] text-xs leading-tight whitespace-pre-wrap break-words print:text-black">
                          {seg.details}
                        </div>
                      ) : (
                        <>
                          <div className="font-black text-[#004165] uppercase tracking-tight leading-tight whitespace-normal break-words">
                            {seg.segment}
                          </div>
                          {seg.details && (
                            <div className="text-[9px] text-gray-500 font-medium leading-tight whitespace-pre-wrap break-words mt-0.5 print:text-black">
                              {seg.details}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 overflow-hidden">
                      <div className="font-black text-[#772432] leading-tight whitespace-normal break-words">
                        {seg.assignedTo === 'N/A' || seg.assignedTo === 'n/a' ? '' : seg.assignedTo}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};
