/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole } from '../types';

const API_KEY = (import.meta as any).env.VITE_TEABLE_API_KEY;
const TABLE_ID = (import.meta as any).env.VITE_TEABLE_TABLE_ID;
const MEMBERS_TABLE_ID = (import.meta as any).env.VITE_TEABLE_MEMBERS_TABLE_ID;

const TEABLE_API_URLS = [
  'https://app.teable.io/api',
  'https://app.teable.ai/api'
];

let currentApiUrl = TEABLE_API_URLS[0];

async function teableFetch(urlPath: string, method: string, body?: any): Promise<any> {
  if (!API_KEY) return { ok: false, status: 401 };
  
  const tryRequest = async (baseUrl: string) => {
    const url = urlPath.startsWith('http') ? urlPath : `${baseUrl}${urlPath}`;
    return fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  try {
    let response = await tryRequest(currentApiUrl);
    
    if (!response.ok && (response.status === 404 || response.status === 502 || response.status === 0)) {
      const otherUrl = TEABLE_API_URLS.find(u => u !== currentApiUrl)!;
      const response2 = await tryRequest(otherUrl);
      if (response2.ok) {
        currentApiUrl = otherUrl;
        return response2;
      }
    }
    return response;
  } catch (err) {
    return { ok: false, status: 500 };
  }
}

export async function fetchMembers(): Promise<any[]> {
  try {
    const response = await teableFetch(`/table/${MEMBERS_TABLE_ID}/record`, 'GET');
    if (!response || !response.ok) return [];
    
    const data = await (response as Response).json();
    return (data.records || []).map((r: any) => ({
      id: r.id,
      name: r.fields?.Name || r.fields?.name || '',
      status: r.fields?.Status || r.fields?.status || '',
      committeeRole: r.fields?.Committee_Role || r.fields?.committee_role || '',
      currentPathway: r.fields?.Current_Pathway || '',
      currentLevel: r.fields?.Current_Level || '',
      latestSpeechNumber: r.fields?.Latest_Speech_Number || '',
      latestSpeechTitle: r.fields?.Speech_Title || r.fields?.latest_speech_title || '',
      latestSpeechDuration: r.fields?.Duration || r.fields?.latest_speech_duration || ''
    })).filter((m: any) => m.name && m.name.trim() !== ''); 
  } catch (error) { 
    return []; 
  }
}

export async function fetchMeetingRoster(): Promise<MeetingRole[]> {
  try {
    const response = await teableFetch(`/table/${TABLE_ID}/record`, 'GET');
    if (!response || !response.ok) return getMockRoster();
    
    const data = await (response as Response).json();
    return (data.records || []).map((record: any) => ({
      id: record.id,
      role: record.fields?.Role || record.fields?.role || 'Unassigned Role',
      name: record.fields?.Name || record.fields?.name || '',
      status: record.fields?.Status || record.fields?.status || 'Vacant',
      date: record.fields?.Date || new Date().toISOString(),
      duration: record.fields?.Duration || record.fields?.duration || '',
      intro_duration: record.fields?.Intro_Duration || '',
      report_duration: record.fields?.Report_Duration || '',
      speech_title: record.fields?.Speech_Title || '',
      pathway: record.fields?.Pathway || '',
      level: record.fields?.Level || '',
      project_number: record.fields?.Project_Number || '',
      theme: record.fields?.Theme || '',
      wotd: record.fields?.Word_of_the_Day || '',
      meaning: record.fields?.Word_Meaning || '',
      example: record.fields?.Word_Example || ''
    }));
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
