/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { MeetingRole } from "../types";

const apiKey = (process.env as any).GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function generateMeetingAgenda(roster: MeetingRole[]): Promise<string> {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY') {
    return "## AI Draft Agenda\n\n(Note: Gemini API key not detected. To use AI features, please configure your `GEMINI_API_KEY` in the Secrets panel.)\n\n### Upcoming Meeting: Mastering Persuasion\n\n**Toastmaster of the Day:** David Chen, DTM\n\nWelcome to our high-energy session on the art of influence...";
  }

  const confirmed = roster.filter(r => r.status === 'Confirmed');
  const vacant = roster.filter(r => r.status === 'Vacant' || r.status === 'Open');

  const rosterText = confirmed.map(r => `${r.role}: ${r.name}`).join('\n');
  const vacantText = vacant.map(r => r.role).join('\n');

  const prompt = `
I am using Teable as my database for a Toastmasters club.
The Task:
1. Fetch all records from the Meeting_Roster table where the 'Date' matches the upcoming meeting and 'Status' is 'Confirmed'. (Already done: see Roster below)
2. Pass these names and roles to Gemini 1.5 Lite. (You are Gemini)
3. Generate a structured meeting agenda in Markdown.
4. For any roles that are still 'Vacant', list them at the bottom as 'Roles Needed for Next Week' to encourage more sign-ups.

Tone: Professional and encouraging. Use my 25 years of Toastmasters experience to ensure the transitions between roles feel natural and high-energy.

Confirmed Roster:
${rosterText}

Vacant Roles:
${vacantText}

Output only the Markdown agenda.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Toastmaster with 25 years of experience. You create high-energy, professional meeting agendas that inspire members. Your transitions are seamless and your tone is encouraging.",
      }
    });

    return response.text || "Failed to generate agenda.";
  } catch (error) {
    console.error("Error generating agenda:", error);
    return "Error generating agenda. Please try again later.";
  }
}
