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
  readOnly?: boolean;
}

export const StitchAgenda: React.FC<StitchAgendaProps> = ({ 
  segments, 
  details, 
  wotd, 
  members,
  onEditSegment,
  onEditDetail,
  readOnly = false
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

  const officers = roles.map(role => {
    const match = members.find(m => hasOfficerRole(m.committeeRole || '', role));
    return {
      role,
      name: match?.name || '---'
    };
  });

  return (
    <div className="bg-white shadow-2xl border border-gray-200 font-['Montserrat',sans-serif] mx-auto print:shadow-none print:border-none print:m-0 print-page printable-area flex flex-col h-full" 
         id="agenda-page">
      <header className="bg-[#004165] text-white p-5 print:p-3 print:bg-[#004165] print:text-white relative shrink-0 agenda-header">
        <div className="flex justify-between items-center gap-8 print:gap-4">
          <div className="flex items-center gap-6 shrink-0 print:gap-4">
            <img alt="TM Logo" className="h-16 w-auto object-contain print:h-12" src={logoFinal}/>
            <div className="text-left border-l border-white/20 pl-6 print:pl-4">
              <h1 className="text-2xl print:text-[18px] font-black tracking-tighter leading-tight uppercase">Toastmasters</h1>
              <p className="text-[9px] print:text-[8px] tracking-[0.3em] font-light -mt-1 uppercase opacity-80">International</p>
            </div>
          </div>
          
          <div className="flex-1 text-right min-w-0">
            <h2 className="text-xl print:text-[16px] font-black uppercase tracking-tight truncate">Inspiring Speakers PDC</h2>
            <div className="text-[10px] print:text-[9px] text-[#F2DF74] tracking-widest font-bold mt-0.5 print:mt-0.5 leading-none">CLUB 28677134</div>
          </div>
        </div>

        {/* Unified Sub-header Row for Session, Date and Theme */}
        <div className="mt-3 print:mt-2.5 py-1.5 print:py-1 px-3 bg-white/10 border-t border-b border-white/10 flex flex-col md:flex-row md:justify-between items-center gap-2 print:flex-row print:justify-between print:items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] print:text-[9px] uppercase tracking-widest font-black opacity-90">Session:</span>
            <input 
              className={`bg-transparent border-none text-white font-black w-12 text-center focus:outline-none p-0 ${readOnly ? 'hidden' : 'print:hidden'}`}
              value={details.sessionNum}
              onChange={(e) => onEditDetail?.('sessionNum', e.target.value)}
            />
            <div className={`${readOnly ? 'inline-block' : 'hidden print:inline-block'} text-white font-black print:text-[10px]`}>
              {details.sessionNum}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] print:text-[9px] uppercase tracking-widest font-black opacity-90">Date:</span>
            <input 
              type="date"
              className={`font-black text-xs text-white bg-transparent border-none focus:outline-none cursor-pointer ${readOnly ? 'hidden' : 'print:hidden'}`}
              value={details.date ? details.date.split('T')[0] : ''}
              onChange={(e) => onEditDetail?.('date', e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            <div className={`${readOnly ? 'block' : 'hidden print:block'} font-black print:text-[10px] text-white`}>
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
        </div>

        {/* Large Prominent Theme Box */}
        <div className="mt-3 print:mt-2 bg-black/20 rounded-xl p-3 print:p-2 text-center">
          <span className="block text-[9px] print:text-[8px] font-black uppercase tracking-[0.2em] text-[#F2DF74] opacity-90 mb-1">Meeting Theme</span>
          <div className="flex justify-center items-center gap-2">
            <input 
              className={`bg-transparent border-none text-tm-gold font-bold w-full text-center focus:outline-none p-0 italic text-sm md:text-base ${readOnly ? 'hidden' : 'print:hidden'}`}
              value={details.theme}
              onChange={(e) => onEditDetail?.('theme', e.target.value)}
              style={{ color: '#F2DF74' }}
            />
            <div className={`${readOnly ? 'block' : 'hidden print:block'} text-[#F2DF74] font-black italic text-sm md:text-base print:text-[14px] text-center break-words leading-tight w-full`}>
              "{details.theme}"
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar set to exactly 33% width */}
        <aside className="agenda-sidebar w-[33%] bg-[#772432] text-white flex-shrink-0 flex flex-col print:bg-[#772432]">
          <div className="p-6 print:p-4 space-y-6 print:space-y-4">
            <div className="space-y-4 print:space-y-3">
              <p className="text-xs print:text-[10px] font-black uppercase tracking-widest text-[#F2DF74] text-center pb-1 border-b border-white/10">Club Officers</p>
              <div className="grid grid-cols-1 gap-2.5 print:gap-1.5">
                {officers.map(off => (
                  <div key={off.role} className="text-center">
                    <p className="opacity-60 font-medium uppercase tracking-wider text-[9px] print:text-[8px] mb-0.5 leading-none">{off.role}</p>
                    <p className="font-black text-[#F2DF74] text-sm print:text-[12px] leading-tight truncate px-1">{off.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 print:pt-3 border-t border-white/20 text-center space-y-3 print:space-y-2">
              <p className="text-xs print:text-[10px] font-semibold leading-relaxed print:leading-tight opacity-70">
                Join us at the Aloft Playa del Carmen every Thursday evening at 7 pm
              </p>
              <p className="text-[11px] print:text-[9px] font-black tracking-wider text-[#F2DF74] uppercase">InspiringSpeakersPDC.com</p>
            </div>
          </div>

          <div className="bg-black/20 p-6 print:p-4 space-y-4 print:space-y-3 flex-1">
            <h3 className="italic text-xl print:text-[18px] font-black text-[#F2DF74] print:leading-none">Word of the Day</h3>
            <div className="space-y-4 print:space-y-3">
              <div>
                <p className="text-xs print:text-[10px] uppercase tracking-widest opacity-50 mb-1 print:mb-0">Word:</p>
                <input 
                  className={`font-black text-sm bg-white/10 rounded px-2 py-1 w-full text-white border-none focus:ring-0 ${readOnly ? 'hidden' : 'print:hidden'}`}
                  value={wotd.word}
                  onChange={(e) => onEditDetail?.('word', e.target.value)}
                />
                <div className={`${readOnly ? 'block' : 'hidden print:block'} font-black text-2xl print:text-[24px] text-white break-words print:leading-none`}>
                  {wotd.word}
                </div>
              </div>
              <div className="space-y-1 print:space-y-0.5">
                <p className="text-xs print:text-[10px] uppercase tracking-widest opacity-50">Definition:</p>
                <textarea 
                  className={`text-xs italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none overflow-hidden ${readOnly ? 'hidden' : 'print:hidden'}`}
                  rows={2} 
                  value={wotd.meaning}
                  onChange={(e) => onEditDetail?.('meaning', e.target.value)}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  style={{ minHeight: '60px' }}
                />
                <div className={`${readOnly ? 'block' : 'hidden print:block'} text-sm print:text-[14px] italic font-medium leading-tight text-white whitespace-pre-wrap break-words`}>
                  {wotd.meaning}
                </div>
              </div>
              <div className="space-y-1 print:space-y-0.5">
                <p className="text-xs print:text-[10px] uppercase tracking-widest opacity-50">Example:</p>
                <textarea 
                  className={`text-xs italic font-medium leading-snug bg-white/5 rounded p-2 w-full text-slate-200 border-none focus:ring-0 resize-none overflow-hidden ${readOnly ? 'hidden' : 'print:hidden'}`}
                  rows={2} 
                  value={wotd.example}
                  onChange={(e) => onEditDetail?.('example', e.target.value)}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  style={{ minHeight: '60px' }}
                />
                <div className={`${readOnly ? 'block' : 'hidden print:block'} text-sm print:text-[14px] italic font-medium leading-tight text-white whitespace-pre-wrap break-words`}>
                  {wotd.example}
                </div>
              </div>
            </div>
          </div>

          {details.showMission !== false && (
            <div className="p-6 print:p-4 shrink-0 border-t border-white/10 mt-auto">
              <h4 className="text-[10px] print:text-[9px] uppercase tracking-[0.2em] font-black text-white/60 text-center mb-1 print:mb-0.5">Club Mission</h4>
              <div className="w-full text-center font-bold text-xs print:text-[10.5px] text-slate-200 tracking-wide leading-tight">
                The mission of a Toastmasters club is to provide a mutually supportive and positive learning environment in which every individual member has the opportunity to develop oral communication and leadership skills, which in turn foster self-confidence and personal growth.
              </div>
            </div>
          )}

          {details.showValues !== false && (
            <div className={`p-6 print:p-4 shrink-0 border-t border-white/10 ${details.showMission === false ? 'mt-auto' : ''}`}>
              <h4 className="text-[10px] print:text-[9px] uppercase tracking-[0.2em] font-black text-white/60 text-center mb-1 print:mb-0.5">Toastmasters Core Values</h4>
              <div className="w-full text-center font-black text-xs print:text-[11px] text-[#F2DF74] tracking-wide leading-tight">
                Integrity, Respect, Service, and Excellence
              </div>
            </div>
          )}
        </aside>

        {/* Main table set to exactly 67% width */}
        <main className="w-[67%] p-5 print:p-3 bg-white agenda-main flex flex-col h-full overflow-hidden">
          <table className="w-full border-collapse h-full">
            <thead className="print:h-[22px]">
              <tr className="border-b-2 border-gray-100 print:border-gray-800">
                <th className="py-2 print:py-0.5 text-left text-[9px] print:text-[8px] uppercase tracking-widest text-slate-500 print:text-black font-bold w-16 print:w-16">Time</th>
                <th className="py-2 print:py-0.5 text-center text-[9px] print:text-[8px] uppercase tracking-widest text-slate-500 print:text-black font-bold w-16 print:w-12">Dur</th>
                <th className="py-2 print:py-0.5 px-3 text-left text-[9px] print:text-[8px] uppercase tracking-widest text-slate-500 print:text-black font-bold">Agenda Item</th>
                <th className="py-2 print:py-0.5 px-3 text-right text-[9px] print:text-[8px] uppercase tracking-widest text-slate-500 print:text-black font-bold">Speaker / Role</th>
              </tr>
            </thead>
            <tbody className="print:text-black">
              {segments.map((seg, idx) => {
                const isSpeaker = seg.segment.toLowerCase().startsWith('speaker #');
                return (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-b border-gray-100 group print:bg-transparent print:border-gray-200 print:h-[28px]`}>
                    {/* Time column font size scaled up to approx 90% of row height with minimal padding */}
                    <td className="text-left font-black text-[#004165] print:text-black py-3 print:py-0.5 text-xs print:text-[18px] print:leading-none w-20 print:w-16 align-middle">
                      {isSpeaker && <span className="block text-[8px] print:text-[6px] uppercase tracking-widest text-slate-400 print:text-gray-600 mb-0.5 print:mb-0">{seg.segment}</span>}
                      <span className="block w-full font-black tracking-tight">{seg.time}</span>
                    </td>
                    <td className="text-center py-2 print:py-0.5 w-16 print:w-12 align-middle">
                      <span className="block w-full text-gray-400 print:text-gray-900 font-bold text-[10px] print:text-[11px]">{seg.duration}</span>
                    </td>
                    <td className="px-3 print:px-1 py-2 print:py-0.5 overflow-hidden align-middle">
                      {isSpeaker ? (
                        <div className="font-black text-[#004165] text-xs print:text-[10px] leading-tight print:leading-[1.1] whitespace-pre-wrap break-words print:text-black">
                          {seg.details}
                        </div>
                      ) : (
                        <>
                          <div className="font-black text-[#004165] print:text-black print:text-[10px] uppercase tracking-tight leading-tight print:leading-[1.1] whitespace-normal break-words">
                            {seg.segment}
                          </div>
                          {seg.details && (
                            <div className="text-[9px] print:text-[8px] text-gray-500 print:text-gray-800 font-medium leading-tight print:leading-[1.1] whitespace-pre-wrap break-words mt-0.5 print:mt-0">
                              {seg.details}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 print:px-1 py-2 print:py-0.5 overflow-hidden align-middle text-right">
                      <div className="font-black text-[#772432] print:text-black print:text-[10px] leading-tight print:leading-[1.1] whitespace-normal break-words inline-block">
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

      {/* Full-width Footer for Announcements */}
      {details.showAnnouncements !== false && details.announcements && (
        <footer className="bg-[#004165] text-white p-4 print:p-3.5 shrink-0 border-t-2 border-[#772432] text-center">
          <div className="max-w-5xl mx-auto space-y-1">
            <h4 className="text-xs print:text-[10px] uppercase tracking-[0.3em] font-black text-[#F2DF74] leading-none">Announcements</h4>
            <div className="text-sm print:text-[13px] font-black italic text-white whitespace-pre-wrap break-words leading-tight">
              {details.announcements}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
