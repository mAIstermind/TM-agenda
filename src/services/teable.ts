/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole } from '../types';

const TABLE_ID = (import.meta as any).env.VITE_TEABLE_TABLE_ID;
const MEMBERS_TABLE_ID = (import.meta as any).env.VITE_TEABLE_MEMBERS_TABLE_ID;

async function teableFetch(path: string, method: string, body?: any): Promise<any> {
  const rootUrls = [
    '' // Strictly relative to use middleware tunneling
  ];

  for (const root of rootUrls) {
    try {
      const response = await fetch(`${root}/api/teable-proxy?cb=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, method, body })
      });
      if (response.ok) return response;
    } catch (err) {
      // Continue to next root
    }
  }
  return { ok: false, status: 500 };
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
        name: f.Name || f.name || '',
        status: f.Status || f.status || '',
        committeeRole: f.Committee_Role || f["Committee Role"] || f.committee_role || '',
        currentPathway: f.Pathway || f.pathway || f.Current_Pathway || f["Current Pathway"] || '',
        currentLevel: f.Level || f.level || f.Current_Level || f["Current Level"] || '',
        latestSpeechNumber: f.Project_Number || f["Project Number"] || f.Latest_Speech_Number || '',
        latestSpeechTitle: f.Speech_Title || f["Speech Title"] || f.Title || f.latest_speech_title || '',
        latestSpeechDuration: f.Duration || f.duration || f.latest_speech_duration || ''
      };
    }).filter((m: any) => m.name && m.name.trim() !== ''); 
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
        name: f.Name || f.name || '',
        status: f.Status || f.status || 'Vacant',
        date: f.Date || new Date().toISOString(),
        duration: f.Duration || f.duration || '',
        // Aggressive mapping for Speaker Intros
        intro_duration: f.Intro_Duration || f["Intro Duration"] || f.Intro || '',
        report_duration: f.Report_Duration || f["Report Duration"] || f.Report || '',
        // Aggressive mapping for Speaker Details
        speech_title: f.Speech_Title || f["Speech Title"] || f.Title || f.title || '',
        pathway: f.Pathway || f.pathway || f.Current_Pathway || f["Current Pathway"] || '',
        level: f.Level || f.level || f.Current_Level || f["Current Level"] || '',
        project_number: f.Project_Number || f["Project Number"] || f.Project || '',
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
  const fields: any = { ...extraFields };
  if (name !== undefined) fields.Name = name;
  if (!isMember && name !== undefined) fields.Status = name.trim() ? 'Confirmed' : 'Vacant';

  // Support both underscored and spaced field names for consistency
  if (extraFields.Speech_Title) fields["Speech Title"] = extraFields.Speech_Title;
  if (extraFields.Project_Number) fields["Project Number"] = extraFields.Project_Number;
  if (extraFields.Intro_Duration) fields["Intro Duration"] = extraFields.Intro_Duration;
  if (extraFields.Report_Duration) fields["Report Duration"] = extraFields.Report_Duration;
  if (extraFields.Committee_Role) fields["Committee Role"] = extraFields.Committee_Role;
  if (extraFields.Current_Pathway) fields["Current Pathway"] = extraFields.Current_Pathway;
  if (extraFields.Current_Level) fields["Current Level"] = extraFields.Current_Level;

  try {
    // Attempt bulk update format first
    const response = await teableFetch(`/table/${targetTableId}/record`, 'PATCH', { 
      records: [{ id: recordId, fields }] 
    });
    
    // If bulk update fails with 404, try individual record update
    if (!response.ok && response.status === 404) {
      const response2 = await teableFetch(`/table/${targetTableId}/record/${recordId}`, 'PATCH', { fields });
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
