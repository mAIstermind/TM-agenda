/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole } from '../types';

const API_KEY = (import.meta as any).env.VITE_TEABLE_API_KEY;
const BASE_ID = (import.meta as any).env.VITE_TEABLE_BASE_ID;
const TABLE_ID = (import.meta as any).env.VITE_TEABLE_TABLE_ID;

const TEABLE_API_URL = 'https://api.teable.io/api';

/**
 * Fetch records from Teable Meeting_Roster table.
 */
export async function fetchMeetingRoster(): Promise<MeetingRole[]> {
  if (!API_KEY || !BASE_ID || !TABLE_ID) {
    console.warn('Teable API key or Base/Table ID missing. Returning mock data.');
    return getMockRoster();
  }

  try {
    const response = await fetch(`${TEABLE_API_URL}/base/${BASE_ID}/table/${TABLE_ID}/record`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Teable API error: ${response.statusText}`);
    }

    const data = await response.json();
    const nextTuesday = new Date();
    nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7));
    const dateStr = nextTuesday.toISOString().split('T')[0];

    return data.records
      .map((record: any) => ({
        id: record.id,
        role: record.fields.Role || record.fields.role,
        name: record.fields.Name || record.fields.name || 'Open Role',
        status: record.fields.Status || record.fields.status,
        date: record.fields.Date || record.fields.date,
      }))
      .filter((record: MeetingRole) => 
        record.status === 'Confirmed' || record.status === 'Open' || record.status === 'Vacant'
      );
  } catch (error) {
    console.error('Error fetching from Teable:', error);
    return getMockRoster();
  }
}

function getMockRoster(): MeetingRole[] {
  const nextTuesday = new Date();
  nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7));
  const dateStr = nextTuesday.toISOString().split('T')[0];

  return [
    { id: '1', role: 'Toastmaster of the Day', name: 'David Chen, DTM', status: 'Confirmed', date: dateStr },
    { id: '2', role: 'General Evaluator', name: 'Sarah Jenkins', status: 'Confirmed', date: dateStr },
    { id: '3', role: 'Grammarian', name: '', status: 'Open', date: dateStr },
    { id: '4', role: 'Timer', name: 'Elena Gilbert', status: 'Confirmed', date: dateStr },
    { id: '5', role: 'Ah-counter', name: '', status: 'Open', date: dateStr },
    { id: '6', role: 'Table Topics Master', name: 'Marcus Rivera', status: 'Confirmed', date: dateStr },
    { id: '7', role: 'Speaker #1', name: '', status: 'Open', date: dateStr },
    { id: '8', role: 'Speaker #2', name: 'Jennifer Lopez', status: 'Confirmed', date: dateStr },
    { id: '9', role: 'Speech Evaluator #1', name: '', status: 'Open', date: dateStr },
    { id: '10', role: 'Speech Evaluator #2', name: 'Robert Brown', status: 'Confirmed', date: dateStr },
    { id: '11', role: 'Speaker #3', name: '', status: 'Open', date: dateStr },
    { id: '12', role: 'Speech Evaluator #3', name: '', status: 'Open', date: dateStr },
    { id: '13', role: 'Sergeant-at-Arms', name: 'Tom Hardy', status: 'Confirmed', date: dateStr },
  ];
}
