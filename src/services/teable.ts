/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole } from '../types';

const TABLE_ID = (import.meta as any).env.VITE_TEABLE_TABLE_ID;
const MEMBERS_TABLE_ID = (import.meta as any).env.VITE_TEABLE_MEMBERS_TABLE_ID;

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
        latestSpeechDuration: f.Duration || f.duration || f.Dur || f.latest_speech_duration || '',
        profilesRecd: f["Profiles Rec'd"] || f.profiles_recd || '',
        confirmationMsg: f["Confirmation Msg"] || f.confirmation_msg || ''
      };
    }).filter((m: any) => (m.name && m.name.trim() !== '') || (m.id)); 
  } catch (error) { 
    return []; 
  }
}

export async function fetchMeetingRoster(): Promise<MeetingRole[]> {
  try {
    const response = await teableFetch(`/table/${TABLE_ID}/record`, 'GET');
    if (!response || !response.ok) return getMockRoster();
    
    const data = await (response as Response).json();
    return (data.records || []).map((record: any) => {
      const f = record.fields || {};
      return {
        id: record.id,
        role: f.Role || f.role || 'Unassigned Role',
        name: f.Name || f.name || f["Full Name"] || '',
        status: f.Status || f.status || 'Vacant',
        date: f.Date || new Date().toISOString(),
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
        example: f.Word_Example || f["Word Example"] || ''
      };
    });
  } catch (error) { 
    return getMockRoster(); 
  }
}

export async function addRosterRoles(roles: string[]): Promise<boolean> {
  try {
    const records = roles.map((role) => ({ fields: { Role: role, Status: 'Vacant' } }));
    const response = await teableFetch(`/table/${TABLE_ID}/record`, 'POST', { records });
    return response.ok;
  } catch (error) { return false; }
}

export async function addRosterRole(role: string): Promise<boolean> {
  return addRosterRoles([role]);
}

export async function deleteRosterRoles(recordIds: string[]): Promise<boolean> {
  try {
    const params = recordIds.map(id => `recordIds=${id}`).join('&');
    const response = await teableFetch(`/table/${TABLE_ID}/record?${params}`, 'DELETE');
    return response.ok;
  } catch (error) { return false; }
}

export async function deleteRosterRole(recordId: string): Promise<boolean> {
  return deleteRosterRoles([recordId]);
}

export async function updateMeetingRole(recordId: string, name: string | undefined, extraFields: any = {}, isMember: boolean = false): Promise<boolean> {
  const targetTableId = isMember ? MEMBERS_TABLE_ID : TABLE_ID;
  const fields: any = {};
  if (name !== undefined) fields.Name = name;
  if (!isMember && name !== undefined) fields.Status = name.trim() ? 'Confirmed' : 'Vacant';

  // Map to the most likely Teable field names (Spaced)
  if (extraFields.Speech_Title || extraFields.latestSpeechTitle || extraFields.speech_title) {
    fields["Speech Title"] = extraFields.Speech_Title || extraFields.latestSpeechTitle || extraFields.speech_title;
  }
  if (extraFields.Project_Number || extraFields.latestSpeechNumber || extraFields.project_number) {
    fields["Project Number"] = extraFields.Project_Number || extraFields.latestSpeechNumber || extraFields.project_number;
  }
  if (extraFields.Current_Pathway || extraFields.Pathway || extraFields.pathway) {
    fields["Current Pathway"] = extraFields.Current_Pathway || extraFields.Pathway || extraFields.pathway;
  }
  if (extraFields.Current_Level || extraFields.Level || extraFields.level) {
    fields["Current Level"] = extraFields.Current_Level || extraFields.Level || extraFields.level;
  }
  if (extraFields.Intro_Duration) fields["Intro Duration"] = extraFields.Intro_Duration;
  if (extraFields.Report_Duration) fields["Report Duration"] = extraFields.Report_Duration;
  if (extraFields.Committee_Role) fields["Committee Role"] = extraFields.Committee_Role;
  if (extraFields.Duration) fields["Duration"] = extraFields.Duration;
  if (extraFields.Profiles_Recd) fields["Profiles Rec'd"] = extraFields.Profiles_Recd;
  if (extraFields.Confirmation_Msg) fields["Confirmation Msg"] = extraFields.Confirmation_Msg;
  
  // Direct field support
  if (extraFields.Role) fields.Role = extraFields.Role;
  if (extraFields.Theme) fields.Theme = extraFields.Theme;
  if (extraFields.Word_of_the_Day) fields.Word_of_the_Day = extraFields.Word_of_the_Day;
  if (extraFields.Word_Meaning) fields.Word_Meaning = extraFields.Word_Meaning;
  if (extraFields.Word_Example) fields.Word_Example = extraFields.Word_Example;


  try {
    // Teable standard PATCH for multiple records (atomic)
    const response = await teableFetch(`/table/${targetTableId}/record`, 'PATCH', { 
      records: [{ id: recordId, fields }],
      fieldKeyType: 'name' // Force display names
    });
    
    // If bulk update fails with 404, try individual record update
    if (!response.ok && response.status === 404) {
      const response2 = await teableFetch(`/table/${targetTableId}/record/${recordId}`, 'PATCH', { 
        fields,
        fieldKeyType: 'name'
      });
      return response2.ok;
    }
    
    return response.ok;
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
  if (tmod && details.theme) {
    if (!await updateMeetingRole(tmod.id, tmod.name, { Theme: details.theme })) success = false;
  }
  if (gram && (details.word || details.meaning || details.example)) {
    if (!await updateMeetingRole(gram.id, gram.name, {
      Word_of_the_Day: details.word,
      Word_Meaning: details.meaning,
      Word_Example: details.example
    })) success = false;
  }
  return success;
}

export async function updateRoleTitle(recordId: string, newTitle: string): Promise<boolean> {
  return updateMeetingRole(recordId, undefined, { Role: newTitle });
}

export async function addMember(name: string, role: string = 'Member'): Promise<boolean> {
  try {
    const response = await teableFetch(`/table/${MEMBERS_TABLE_ID}/record`, 'POST', {
      records: [{ fields: { Name: name, Committee_Role: role, Status: 'Active' } }]
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
