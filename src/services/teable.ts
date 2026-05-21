/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole } from '../types';

const TABLE_ID = (import.meta as any).env.VITE_TEABLE_TABLE_ID || "tblDuv3Ddyl8DNHojBL";
const MEMBERS_TABLE_ID = (import.meta as any).env.VITE_TEABLE_MEMBERS_TABLE_ID || "tblDYLMQO3BfzVZftsz";

async function teableFetch(path: string, method: string, body?: any): Promise<any> {
  try {
    const response = await fetch(`/api/teable-proxy?cb=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, method, body })
    });
    
    // Log the raw response status for debugging
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Teable API Error [${path}]:`, response.status, errorData);
      return { ok: false, status: response.status, data: errorData };
    }
    
    return response;
  } catch (err: any) {
    console.error(`Teable Connection Exception:`, err.message);
    return { ok: false, status: 500 };
  }
}


export async function fetchMembers(): Promise<any[]> {
  try {
    const response = await teableFetch(`/table/${MEMBERS_TABLE_ID}/record`, 'GET');
    if (!response || !response.ok) return [];
    
    const data = await (response as Response).json();
    return (data.records || []).map((r: any) => {
      const f = r.fields || {};
      return {
        id: r.id,
        name: f.Name || f.name || f["Full Name"] || '',
        status: f.Status || f.status || '',
        committeeRole: f.Committee_Role || f["Committee Role"] || f.committee_role || '',
        currentPathway: f.Pathway || f.pathway || f.Current_Pathway || f["Current Pathway"] || '',
        currentLevel: f.Level || f.level || f.Current_Level || f["Current Level"] || '',
        latestSpeechNumber: f.Project_Number || f["Project Number"] || f["Proj #"] || f.Latest_Speech_Number || '',
        latestSpeechTitle: f.Speech_Title || f["Speech Title"] || f.Title || f.latest_speech_title || f["Next Title"] || '',
        latestSpeechDuration: f.Duration || f.duration || f.Dur || f.latest_speech_duration || ''
      };
    }).filter((m: any) => (m.name && String(m.name).trim() !== '') || (m.id)); 
  } catch (error) { 
    return []; 
  }
}

export async function fetchMeetingRoster(): Promise<MeetingRole[]> {
  try {
    const response = await teableFetch(`/table/${TABLE_ID}/record`, 'GET');
    if (!response || !response.ok) return getMockRoster();
    
    const data = await (response as Response).json();
    const records = (data.records || []).map((record: any) => {
      const f = record.fields || {};
      return {
        id: record.id,
        role: f.Role || f.role || 'Unassigned Role',
        name: f.Name || f.name || f["Full Name"] || '',
        status: f.Status || f.status || 'Vacant',
        date: f.Date || '',
        duration: f.Duration || f.duration || f.Dur || '',
        // Aggressive mapping for Speaker Intros
        intro_duration: f.Intro_Duration || f["Intro Duration"] || f.Intro || '',
        report_duration: f.Report_Duration || f["Report Duration"] || f.Report || '',
        // Aggressive mapping for Speaker Details
        speech_title: f.Speech_Title || f["Speech Title"] || f.Title || f.title || f["Next Title"] || '',
        pathway: f.Pathway || f.pathway || f.Current_Pathway || f["Current Pathway"] || '',
        level: f.Level || f.level || f.Current_Level || f["Current Level"] || '',
        project_number: f.Project_Number || f["Project Number"] || f.Project || f["Proj #"] || '',
        theme: f.Theme || f.theme || '',
        wotd: f.Word_of_the_Day || f["Word of the Day"] || '',
        meaning: f.Word_Meaning || f["Word Meaning"] || '',
        example: f.Word_Example || f["Word Example"] || '',
        agenda_json: f.Agenda_JSON || f.agenda_json || '',
        sessionNum: f.Session || f.session || f.SessionNum || '',
        announcements: f.Announcements || f.announcements || ''
      };
    });

    // LLM Fix: Purge any localStorage keys for IDs no longer in the roster
    // to prevent 404s when updating stale cached items.
    const validIds = new Set(records.map((r: any) => r.id));
    Object.keys(localStorage)
      .filter(k => k.startsWith('tm_intro_') || k.startsWith('tm_report_'))
      .forEach(k => {
        const id = k.replace('tm_intro_', '').replace('tm_report_', '');
        if (!validIds.has(id)) {
          console.log(`Purging stale cache for ID: ${id}`);
          localStorage.removeItem(k);
        }
      });

    return records;
  } catch (error) { 
    return getMockRoster(); 
  }
}

export async function addRosterRoles(roles: string[]): Promise<boolean> {
  try {
    const records = roles.map((role) => ({ fields: { Role: role, Status: 'Vacant' } }));
    const response = await teableFetch(`/table/${TABLE_ID}/record`, 'POST', { records, typecast: true });
    return response.ok || response;
  } catch (error) { return false; }
}

export async function addRosterRole(role: string): Promise<boolean> {
  return addRosterRoles([role]);
}

export async function deleteRosterRoles(recordIds: string[]): Promise<boolean> {
  try {
    const params = recordIds.map(id => `recordIds[]=${id}`).join('&');
    const response = await teableFetch(`/table/${TABLE_ID}/record?${params}`, 'DELETE');
    return response.ok || response;
  } catch (error) { return false; }
}

export async function deleteRosterRole(recordId: string): Promise<boolean> {
  return deleteRosterRoles([recordId]);
}

export async function updateMeetingRole(recordId: string, name: string | undefined, extraFields: any = {}, isMember: boolean = false): Promise<boolean> {
  const targetTableId = isMember ? MEMBERS_TABLE_ID : TABLE_ID;
  const fields: any = {};
  if (name !== undefined) fields.Name = name;
  if (!isMember && name !== undefined) fields.Status = String(name).trim() ? 'Confirmed' : 'Vacant';

  // Helper to convert to number if possible, or null if empty
  const toNum = (val: any) => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? val : n;
  };

  if (isMember) {
    // Members Table Schema: ["Name", "Committee Role", "Status", "Pathway", "Level"]
    if (extraFields.Committee_Role || extraFields.role || extraFields.Role) {
      fields["Committee Role"] = extraFields.Committee_Role || extraFields.role || extraFields.Role;
    }
    const p = extraFields.Pathway || extraFields.pathway || extraFields.Current_Pathway;
    if (p !== undefined) fields.Pathway = p;
    
    const l = extraFields.Level || extraFields.level || extraFields.Current_Level;
    if (l !== undefined) fields.Level = toNum(l);

    const st = extraFields.Speech_Title || extraFields.latestSpeechTitle || extraFields.speech_title;
    if (st !== undefined) fields["Speech Title"] = st;
    
    const pn = extraFields.Project_Number || extraFields.latestSpeechNumber || extraFields.project_number;
    if (pn !== undefined) fields["Project Number"] = toNum(pn);
    
    const dur = extraFields.Duration || extraFields.duration || extraFields.latestSpeechDuration;
    if (dur !== undefined) fields.Duration = dur;
  } else {
    // Roster Table Schema: ["Role", "Name", "Status", "Speech Title", "Pathway", "Level", "Project Number", "Theme", "Word of the Day", etc]
    if (extraFields.Role) fields.Role = extraFields.Role;
    
    const st = extraFields.Speech_Title || extraFields.latestSpeechTitle || extraFields.speech_title;
    if (st !== undefined) fields["Speech Title"] = st;
    
    const p = extraFields.Pathway || extraFields.pathway || extraFields.Current_Pathway;
    if (p !== undefined) fields.Pathway = p;
    
    const l = extraFields.Level || extraFields.level || extraFields.Current_Level;
    if (l !== undefined) fields.Level = toNum(l);
    
    const pn = extraFields.Project_Number || extraFields.latestSpeechNumber || extraFields.project_number;
    if (pn !== undefined) fields["Project Number"] = toNum(pn);

    const dur = extraFields.Duration || extraFields.duration;
    if (dur !== undefined) fields.Duration = dur;

    const intro = extraFields.Intro_Duration || extraFields.intro_duration;
    if (intro !== undefined) fields["Intro_Duration"] = intro;

    const report = extraFields.Report_Duration || extraFields.report_duration;
    if (report !== undefined) fields["Report_Duration"] = report;

    const theme = extraFields.Theme || extraFields.theme;
    if (theme !== undefined) fields.Theme = theme;
    
    const wotd = extraFields.Word_of_the_Day || extraFields.wotd;
    if (wotd !== undefined) fields["Word of the Day"] = wotd;
    
    const meaning = extraFields.Word_Meaning || extraFields.meaning;
    if (meaning !== undefined) fields["Word Meaning"] = meaning;
    
    const example = extraFields.Word_Example || extraFields.example;
    if (example !== undefined) fields["Word Example"] = example;

    const date = extraFields.Date || extraFields.date;
    if (date !== undefined) fields.Date = date;

    const session = extraFields.Session || extraFields.session || extraFields.sessionNum;
    if (session !== undefined) fields.Session = session;

    const announcements = extraFields.Announcements || extraFields.announcements;
    if (announcements !== undefined) fields.Announcements = announcements;

    const agendaJson = extraFields.Agenda_JSON || extraFields.agenda_json;
    if (agendaJson !== undefined) fields.Agenda_JSON = agendaJson;
  }


  try {
    // Teable standard PATCH for multiple records (atomic)
    const response = await teableFetch(`/table/${targetTableId}/record`, 'PATCH', { 
      records: [{ id: recordId, fields }],
      fieldKeyType: 'name', // Force display names
      typecast: true // Auto-convert types
    });
    
    // If bulk update fails with 404, try individual record update
    if (!response.ok && response.status === 404) {
      const response2 = await teableFetch(`/table/${targetTableId}/record/${recordId}`, 'PATCH', { 
        fields,
        fieldKeyType: 'name',
        typecast: true
      });
      return response2.ok || response2;
    }
    
    return response.ok || response;
  } catch (error) { return false; }
}

export async function unassignRole(recordId: string): Promise<boolean> {
  // Clear local storage for this role too
  localStorage.removeItem(`tm_intro_${recordId}`);
  localStorage.removeItem(`tm_report_${recordId}`);
  
  return updateMeetingRole(recordId, '', {
    Speech_Title: '',
    Pathway: '',
    Level: '',
    Project_Number: '',
    Duration: '',
    Intro_Duration: '',
    Report_Duration: ''
  });
}

export async function updateMeetingDetails(roster: MeetingRole[], details: any): Promise<boolean> {
  const tmod = roster.find(r => r.role.toLowerCase().includes('toastmaster'));
  const gram = roster.find(r => r.role.toLowerCase().includes('grammarian'));
  let success = true;
  if (tmod) {
    if (!await updateMeetingRole(tmod.id, tmod.name, { 
      Theme: details.theme,
      Date: details.date,
      Session: details.sessionNum,
      Announcements: details.announcements
    })) success = false;
  }
  if (gram) {
    if (!await updateMeetingRole(gram.id, gram.name, {
      Word_of_the_Day: details.word,
      Word_Meaning: details.meaning,
      Word_Example: details.example
    })) success = false;
  }
  return success;
}

export async function saveAgendaJSON(roster: MeetingRole[], agendaJsonStr: string): Promise<boolean> {
  const tmod = roster.find(r => r.role.toLowerCase().includes('toastmaster'));
  if (tmod) {
    return await updateMeetingRole(tmod.id, tmod.name, { Agenda_JSON: agendaJsonStr });
  }
  return false;
}

export async function updateRoleTitle(recordId: string, newTitle: string): Promise<boolean> {
  return updateMeetingRole(recordId, undefined, { Role: newTitle });
}

export async function addMember(name: string, role: string = 'Member'): Promise<boolean> {
  try {
    const response = await teableFetch(`/table/${MEMBERS_TABLE_ID}/record`, 'POST', {
      records: [{ fields: { Name: name, "Committee Role": role, Status: 'Active' } }],
      typecast: true
    });
    return response.ok;
  } catch (error) { return false; }
}

export async function deleteMember(memberId: string): Promise<boolean> {
  try {
    const response = await teableFetch(`/table/${MEMBERS_TABLE_ID}/record?recordIds[]=${memberId}`, 'DELETE');
    return response.ok;
  } catch (error) { return false; }
}

function getMockRoster(): MeetingRole[] {
  return [{ id: '1', role: 'Toastmaster of the Day', name: 'David Chen', status: 'Confirmed', date: new Date().toISOString() }];
}
