/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MeetingRole {
  id: string;
  role: string;
  name: string;
  status: 'Confirmed' | 'Open' | 'Vacant';
  date: string;
  duration?: string;
  intro_duration?: string;
  report_duration?: string;
  project?: string;
  pathway?: string;
  level?: string;
  project_number?: string;
  speech_title?: string;
  theme?: string;
  wotd?: string;
  meaning?: string;
  example?: string;
  agenda_json?: string;
  order?: number;
  sessionNum?: string;
  announcements?: string;
}

export interface ClubOfficer {
  name: string;
  role: string;
  image?: string;
}

export interface MeetingDetails {
  theme: string;
  date: string;
  time: string;
  location: string;
  showMission?: boolean;
  showValues?: boolean;
  showAnnouncements?: boolean;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  status: string;
  committeeRole?: string;
  currentPathway?: string;
  currentLevel?: string;
  latestSpeechNumber?: string;
  latestSpeechTitle?: string;
  latestSpeechDuration?: string;
  profilesRecd?: string;
  confirmationMsg?: string;
}
