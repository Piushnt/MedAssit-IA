import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "VOTRE_CLE_ICI"; // NE PAS COMMITER DE CLE REELLE

const genAI = new GoogleGenerativeAI(API_KEY);

async function checkModels() {
    const modelsToTest = ["gemini-3-flash", "gemini-3-pro", "gemini-3-deep-think", "gemini-2.5-flash", "gemini-2.5-pro"];

    console.log("--- START MODEL CHECK ---");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Simple prompt, no system instruction
            const result = await model.generateContent("Test connection.");
            const text = result.response.text();
            console.log(`[SUCCESS] ${modelName} is available.`);
        } catch (error) {
            console.log(`[FAILED] ${modelName}`);
            console.log(`Error Message: ${error.message}`);

            if (error.message.includes("404")) {
                console.log("Diagnosis: 404 Not Found (Invalid model name or endpoint for this key)");
            } else if (error.message.includes("429")) {
                console.log("Diagnosis: 429 Too Many Requests (Quota Exceeded)");
            } else if (error.message.includes("API key not valid")) {
                console.log("Diagnosis: Invalid API Key");
            }
        }
    }
    console.log("\n--- END MODEL CHECK ---");
}

checkModels();
