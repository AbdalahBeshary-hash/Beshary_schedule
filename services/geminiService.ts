
import { GoogleGenAI } from "@google/genai";
import { Course, Instructor, ScheduleSession } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeSchedule = async (
  courses: Course[],
  instructors: Instructor[],
  schedule: ScheduleSession[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "API Key not configured. Please check your environment variables.";

  // Construct a prompt context
  const dataContext = JSON.stringify({
    stats: {
      totalSessions: schedule.length,
      totalInstructors: instructors.length,
      totalCourses: courses.length
    },
    instructors: instructors.map(i => ({ name: i.name, role: i.role, assignedHours: i.assignedHours, max: i.maxHoursPerWeek })),
    unassignedDetected: courses.length * 3 - schedule.length // Rough estimate
  });

  const prompt = `
    You are an expert University Scheduler. Analyze the following scheduling data context.
    Context: ${dataContext}

    Please provide a concise report (max 200 words) covering:
    1. Workload Distribution: Are assignments fair? Who is overloaded?
    2. Efficiency: suggestions to improve the schedule based on general academic principles.
    3. Formality: Keep it professional.
    
    Return plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to contact Gemini AI. Please try again later.";
  }
};