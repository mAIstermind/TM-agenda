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
}
