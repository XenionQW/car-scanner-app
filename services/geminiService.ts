import { GoogleGenAI, Type } from "@google/genai";
import { CarAnalysis } from '../types';

// Utility to convert file to a base64 string and format for the API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to read file as data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeCarImage = async (imageFile: File): Promise<CarAnalysis> => {
    if (!process.env.API_KEY) {
        // This is a fallback, but the execution environment should provide the key.
        throw new Error("API_KEY is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = {
        text: `Analyze the provided image of a car. Even if only a part of the car is visible, identify its make, model, color, and estimated year of manufacture. If any information cannot be determined, state it as 'Unknown'. Provide the response in the specified JSON format.`
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            make: { type: Type.STRING, description: "The make or brand of the car (e.g., Toyota, Ford)." },
            model: { type: Type.STRING, description: "The specific model of the car (e.g., Camry, Mustang)." },
            color: { type: Type.STRING, description: "The primary color of the car." },
            year: { type: Type.STRING, description: "The estimated year of manufacture (e.g., 2021)." },
        },
        required: ["make", "model", "color", "year"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as CarAnalysis;

    } catch (error) {
        console.error("Error analyzing car image with Gemini API:", error);
        throw new Error("Failed to analyze image. The AI model could not process the request.");
    }
};