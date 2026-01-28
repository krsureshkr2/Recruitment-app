import { GoogleGenAI, Type } from "@google/genai";
import { ParseResult, Candidate, CandidateCategory, BusinessUnit, BehavioralInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CATEGORIES: CandidateCategory[] = [
  'Engineering', 'Design', 'Resource management', 'Project management', 
  'Facade management', 'BD & Marketing', 'Finance and Admin', 
  'Facade forensic', 'Tactile materials'
];

const BUSINESS_UNITS: BusinessUnit[] = [
  'Avante Facade', 'Tactile Materials', 'Facade Forensics', 'Facade Recladding', 'Corporate'
];

export const parseResume = async (text: string): Promise<ParseResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the provided CV text. Extract information with 100% accuracy.
    
    Instructions:
    - Format output as a JSON object.
    - If a field is missing, output "Not Specified".
    - Categorize the candidate into EXACTLY ONE Department: ${CATEGORIES.join(', ')}.
    - Categorize the candidate into EXACTLY ONE Business Unit: ${BUSINESS_UNITS.join(', ')}.
    - Generate a fileReferenceId as "Lastname_Firstname_YYYY-MM-DD" based on today's date.
    
    Resume Text: ${text}`,
    config: {
      systemInstruction: "You are an expert HR Data Extraction Specialist. Your goal is to extract structured data and categorize candidates accurately based on their core expertise and target business units.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          location: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          education: { type: Type.STRING },
          experience: { type: Type.STRING },
          role: { type: Type.STRING },
          summary: { type: Type.STRING },
          category: { type: Type.STRING, enum: CATEGORIES },
          businessUnit: { type: Type.STRING, enum: BUSINESS_UNITS },
          linkedinUrl: { type: Type.STRING },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          fileReferenceId: { type: Type.STRING }
        },
        required: ["name", "email", "category", "businessUnit", "fileReferenceId"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as ParseResult;
};

export const analyzeBehavioralInsight = async (candidate: Candidate): Promise<BehavioralInsight> => {
  const prompt = `Perform a deep behavioral and psychometric profiling of this candidate based on their CV and experience.
  
  Proxies to use:
  1. Attitude: Analyze active vs passive voice. Check for outcome-driven language vs task-driven language.
  2. Growth Mindset: Look for upskilling patterns, lateral moves, and novel problem solving.
  3. Leadership: Look for evidence of mentoring, initiating, or leading without authority.
  
  Candidate Data:
  Name: ${candidate.name}
  Role: ${candidate.role}
  Summary: ${candidate.summary}
  Experience: ${candidate.experience}
  
  Respond in JSON format with a structured analysis and a full readable report.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a Senior Talent Assessment Architect and Behavioral Psychologist. Provide a structured, evidence-based assessment of candidate potential.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          attitude: {
            type: Type.OBJECT,
            properties: {
              rating: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              summary: { type: Type.STRING }
            },
            required: ["rating", "summary"]
          },
          growth: {
            type: Type.OBJECT,
            properties: {
              primaryMotivator: { type: Type.STRING, enum: ["Security", "Status", "Mastery"] },
              summary: { type: Type.STRING }
            },
            required: ["primaryMotivator", "summary"]
          },
          leadership: {
            type: Type.OBJECT,
            properties: {
              intention: { type: Type.STRING, enum: ["Solo High-Performer", "People Leader"] },
              summary: { type: Type.STRING }
            },
            required: ["intention", "summary"]
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          },
          fullReport: { type: Type.STRING }
        },
        required: ["attitude", "growth", "leadership", "swot", "fullReport"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as BehavioralInsight;
};

export const enrichCandidate = async (candidate: { name: string; location: string; role: string; linkedinUrl?: string }) => {
  const prompt = candidate.linkedinUrl 
    ? `Find the professional background for the person at this LinkedIn URL: ${candidate.linkedinUrl}.`
    : `Search for the professional profile of "${candidate.name}" who is a "${candidate.role}" located in "${candidate.location}".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return {
    summary: text,
    sources: groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Profile Link',
      uri: chunk.web?.uri || ''
    }))
  };
};

export const askAboutCandidate = async (candidate: Candidate, question: string) => {
  const context = `
    Candidate: ${candidate.name}
    Role: ${candidate.role}
    Category: ${candidate.category}
    Business Unit: ${candidate.businessUnit}
    Summary: ${candidate.summary}
    Experience: ${candidate.experience}
    Skills: ${candidate.skills.join(', ')}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Question: ${question}\n\nCandidate Profile:\n${context}`,
    config: {
      systemInstruction: "You are an AI Recruitment Assistant providing clarity on candidate profiles.",
    }
  });

  return response.text;
};