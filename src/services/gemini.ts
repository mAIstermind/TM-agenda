/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingRole, MeetingDetails } from "../types";

export interface AgendaSegment {
  time: string;
  duration: string;
  segment: string;
  assignedTo: string;
  details?: string;
}

async function tryProxy(prompt: string, systemInstruction: string, provider: 'openai' | 'gemini' = 'openai'): Promise<string> {
  const rootUrls = [
    '' // Strictly relative to use middleware tunneling
  ];

  let lastError = null;
  for (const root of rootUrls) {
    try {
      const response = await fetch(`${root}/api/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction, provider })
      });
      if (response.ok) {
        const data = await response.json();
        return data.text;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All AI Proxy fallbacks failed");
}

export async function generateMeetingAgenda(roster: MeetingRole[], details: MeetingDetails & { sessionNum: string, wordOfTheDay: string, wordMeaning: string, wordExample: string, announcements: string }): Promise<AgendaSegment[]> {
  const confirmed = roster.filter(r => r.status === 'Confirmed');
  
  const prompt = `
You are the "Agenda Architect" for Inspiring Speakers PDC.
Generate the agenda as a JSON object with a key "agenda" containing an ARRAY of objects.

**CRITICAL RULE: "NO INSTRUCTION ECHO"**
Do NOT copy phrases like "DISPLAY DETAILS" or "[Pathway Name]" into the output. 
- If you have the data, use it.
- If data is missing (empty string), use "---" or "TBD".

**MANDATORY FORMAT:**
1. SAA Calls Meeting to Order (1 min)
2. SAA welcomes Club President (2 min)
3. Club President (Isaac Mancilla) introduces the Toastmaster of the Day (2 min)
4. Toastmaster: Self-Introductions (15 min)
5. Toastmaster Introduces General Evaluator
6. General Evaluator Introduces Evaluation Team (1 min)
7. Grammarian intro (1 min)
8. Timer intro (1 min)
9. Ah-Counter intro (1 min)
10. Toastmaster Introduces TableTopic Master
11. Conduct Table Topics Session (Calculate time until 19:50)
12. 19:50 - 20:00 Comfort Break (10 min)
13. Toastmaster Restarts Meeting (1 min)
14. TM invites 1st Speech Evaluator to share objectives (1 min)
15. Toastmaster introduces speaker #1
16. Speaker #1: Use the Speaker Details Template below.
17. [Repeat for Speaker #2 and #3 if they exist]
24. GE invites Evaluators to share reports (1 min)
25. 1st Speech Evaluator report (2-3 min)
26. 2nd Speech Evaluator report (2-3 min)
27. 3rd Speech Evaluator report (2-3 min)
28. Grammarian report (2-3 min)
29. Timer report (2-3 min)
30. Ah-Counter report (2-3 min)
31. General Evaluator provides report (5 min)
32. Toastmaster Closure (2-3 min)
33. VPE confirms roles for next meeting (3 min)
34. Club President (Isaac Mancilla) announces club business (5 min)
35. Club President adjourns meeting

**SPEAKER DETAILS TEMPLATE (Use exactly this in 'details' field):**
"Pathway: [Data or TBD]
Project: [Data or TBD]
Title: [Data or TBD]"

**DYNAMIC FILTERING RULES (STRICT):**
- You MUST EXCLUDE segments for "SPEAKER #2" or "SPEAKER #3" and their "SPEECH EVALUATOR REPORT" if they are not assigned in the Roster Data.
- If a speaker is vacant, their entire evaluator block must be DELETED from the JSON.
- Never include placeholder segments like "SPEAKER #2 (---)".
- INCLUSION OF CUSTOM ROLES: If the ROSTER DATA contains custom roles not explicitly mentioned in the MANDATORY FORMAT above (e.g., "Workshop", "Keynote", or any other custom role), you MUST insert them into the agenda immediately after the speakers, using their specified role name, person assigned, and duration.

**TIME CALCULATION & DISPLAY:**
- Start Time: 19:00.
- Speaker Intros (TM introduces speaker #1, etc.): Use "1 min".
- "Toastmaster Introduces TableTopic Master": Use empty duration ("").
- "Toastmaster Introduces General Evaluator": Use empty duration ("").
- "Club President adjourns meeting": Use empty duration ("").
- Duration ranges (4-6, 2-3) MUST be written as text in the duration field.
- Use the MAX value (6, 3) for the time math.

**PERFECT EXAMPLE OF OUTPUT:**
- Segment: "1ST SPEECH EVALUATOR REPORT" | Duration: "2-3 min" | Assigned: "Benjamin Cruz"
- Segment: "SPEAKER #1" | Duration: "4-6 min" | Assigned: "Isaac Mancilla" | Details: "Pathway: Engaging Humor\\nProject: Level 1, Icebreaker\\nTitle: Be a Newbie"

**ROSTER DATA:**
${confirmed.map(r => {
  const safeStr = (v: any) => (v !== undefined && v !== null ? String(v).trim() : "");
  const pathway = safeStr(r.pathway) || "---";
  const lvlStr = safeStr(r.level);
  const project = lvlStr ? `Level ${lvlStr}, ${safeStr(r.project_number) || 'Proj'}` : "---";
  const title = safeStr(r.speech_title) || "---";
  const durVal = safeStr(r.duration) || "5-7";
  const duration = durVal.includes('min') ? durVal : `${durVal} min`;
  return `- ${r.role}: ${r.name} | PW: ${pathway} | LVL: ${project} | TITLE: ${title} | DUR: ${duration}`;
}).join('\n')}

**JSON Schema:**
{"agenda": [{"time": string, "duration": string, "segment": string, "assignedTo": string, "details": string}]}
`;

  try {
    const text = await tryProxy(prompt, "Return ONLY JSON. No preamble.", 'openai');
    const cleanText = text.trim().replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(cleanText);
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.agenda && Array.isArray(parsed.agenda)) return parsed.agenda;
    
    throw new Error("Invalid AI response format");
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error("AI Proxy failed or is overloaded. Please check Vercel logs.");
  }
}

export async function editAgendaWithAI(currentAgenda: AgendaSegment[], instruction: string): Promise<AgendaSegment[]> {
  const prompt = `Modify this agenda: "${instruction}"\nAgenda: ${JSON.stringify(currentAgenda)}\nReturn JSON object with key "agenda" containing the modified array.`;
  try {
    const text = await tryProxy(prompt, "Return ONLY JSON.", 'openai');
    const cleanText = text.trim().replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(cleanText);
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.agenda && Array.isArray(parsed.agenda)) return parsed.agenda;
    
    return currentAgenda; // Fallback to current
  } catch (error: any) {
    throw new Error("AI Editing failed: " + error.message);
  }
}
