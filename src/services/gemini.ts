/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { MeetingRole, MeetingDetails } from "../types";

const geminiApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
const openAiApiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;

// Initialize clients
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey, dangerouslyAllowBrowser: true }) : null;

export interface AgendaSegment {
  time: string;
  duration: string;
  segment: string;
  assignedTo: string;
  details?: string;
}

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
];

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryModels(prompt: string, systemInstruction: string): Promise<string> {
  let lastError: any = null;

  // 1. Try OpenAI first if available (requested by user via providing API key to fix 429s)
  if (openai) {
    console.log(`[AI Architect] Attempting OpenAI GPT-4o...`);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      console.log(`[AI Architect] Success with OpenAI GPT-4o`);
      const content = response.choices[0].message.content || "";
      // OpenAI JSON mode returns an object, but our prompt asks for an array.
      // We might need to wrap it or handle the "agenda" key if it returns one.
      return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Architect] OpenAI fail: ${err.message}`);
    }
  }

  // 2. Fallback to Gemini
  if (genAI) {
    for (const modelName of GEMINI_MODELS) {
      console.log(`[AI Architect] Testing Gemini ${modelName}...`);
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
          const result = await model.generateContent(prompt);
          console.log(`[AI Architect] Success with Gemini ${modelName}`);
          return result.response.text();
        } catch (err: any) {
          lastError = err;
          const msg = err.message?.toLowerCase() || "";
          console.warn(`[AI Architect] Gemini ${modelName} fail: ${msg}`);

          if (msg.includes("404") || msg.includes("not found")) break; 
          if (msg.includes("429")) { await wait(2000 * attempt); continue; }
          if (msg.includes("503") || msg.includes("overloaded")) { await wait(1000 * attempt); continue; }
          
          break; // Move to next model
        }
      }
    }
  }

  throw lastError || new Error("All AI models are currently unavailable.");
}

export async function generateMeetingAgenda(roster: MeetingRole[], details: MeetingDetails & { sessionNum: string, wordOfTheDay: string, wordMeaning: string, wordExample: string, announcements: string }): Promise<AgendaSegment[]> {
  if (!geminiApiKey && !openAiApiKey) throw new Error("No AI API keys detected.");

  const confirmed = roster.filter(r => r.status === 'Confirmed');
  
  const prompt = `
You are the "Agenda Architect" for Inspiring Speakers PDC.
Generate the agenda as a JSON object with a key "agenda" containing an ARRAY of objects following the MANDATORY FORMAT below.

**MANDATORY FORMAT (Follow this precisely):**
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
12. 19:50 - 20:00 Comfort Break (10 min) - Assign to ""
13. Toastmaster Restarts Meeting (1 min)
14. TM invites 1st Speech Evaluator to share objectives (1 min) - ASSIGN TO 1ST EVALUATOR NAME
15. Toastmaster introduces speaker #1
16. Speaker #1 (Details from roster)
17. [If Speaker #2 exists] TM invites 2nd Speech Evaluator to share objectives (1 min) - ASSIGN TO 2ND EVALUATOR NAME
18. [If Speaker #2 exists] Toastmaster introduces speaker #2
19. [If Speaker #2 exists] Speaker #2 (Details from roster)
20. [If Speaker #3 exists] TM invites 3rd Speech Evaluator to share objectives (1 min) - ASSIGN TO 3RD EVALUATOR NAME
21. [If Speaker #3 exists] Toastmaster introduces speaker #3
22. [If Speaker #3 exists] Speaker #3 (Details from roster)
23. [IF A ROLE CONTAINING 'VOTING' EXISTS] Special Voting Session (15 min)
24. GE invites Evaluators to share reports (1 min)
25. 1st Speech Evaluator report (2-3 mins)
26. 2nd Speech Evaluator report (2-3 mins)
27. 3rd Speech Evaluator report (2-3 mins)
28. Grammarian report (2-3 mins)
29. Timer report (2-3 mins)
30. Ah-Counter report (2-3 mins)
31. General Evaluator provides report (5 min)
32. Toastmaster Closure (2-3 mins)
33. VPE confirms roles for next meeting (2-3 mins)
34. Club President (Isaac Mancilla) announces club business (5 min)
35. Club President adjourns meeting (Remaining time)

**STRICT RULES:**
- NO "Silence for Written Feedback"
- NO "Voting for Best Table Topics"
- Date Format: Day Month Year (e.g. 7th May 2026).
- President name is Isaac Mancilla.
- Speeches default to "5-7 mins" (calculate using 7 min).
- Evaluator reports show "2-3 mins".
- Start Time: 19:00.

**Roster:**
${confirmed.map(r => `- ${r.role}: ${r.name} (Intro: ${r.intro_duration || '1'}m, Rep: ${r.report_duration || ''}m, Title: ${r.speech_title || ''})`).join('\n')}

**JSON Schema:**
Return a JSON object: {"agenda": [{"time": string, "duration": string, "segment": string, "assignedTo": string, "details": string}]}
`;

  try {
    const text = await tryModels(prompt, "Return ONLY JSON. No preamble.");
    const cleanText = text.trim().replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(cleanText);
    
    // Handle both direct array (old Gemini style) and {agenda: []} (OpenAI style)
    if (Array.isArray(parsed)) return parsed;
    if (parsed.agenda && Array.isArray(parsed.agenda)) return parsed.agenda;
    
    throw new Error("Invalid AI response format");
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error("AI is currently overloaded. Please wait 1 minute.");
  }
}

export async function editAgendaWithAI(currentAgenda: AgendaSegment[], instruction: string): Promise<AgendaSegment[]> {
  if (!geminiApiKey && !openAiApiKey) throw new Error("No AI API keys detected.");
  const prompt = `Modify this agenda: "${instruction}"\nAgenda: ${JSON.stringify(currentAgenda)}\nReturn JSON object with key "agenda" containing the modified array.`;
  try {
    const text = await tryModels(prompt, "Return ONLY JSON.");
    const cleanText = text.trim().replace(/^```json/, '').replace(/```$/, '');
    const parsed = JSON.parse(cleanText);
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.agenda && Array.isArray(parsed.agenda)) return parsed.agenda;
    
    return currentAgenda; // Fallback to current
  } catch (error: any) {
    throw new Error("AI Editing failed: " + error.message);
  }
}
