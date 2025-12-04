import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
    console.error("API_KEY not found in .env");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 5) + "...");

const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Sending request to Gemini with schema...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Explain how AI works in a few words",
            config: {
                systemInstruction: "You are a helpful assistant.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING }
                    }
                }
            }
        });
        console.log("Response received:");
        console.log(response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
