import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

export const generateOrEditImage = async (parts: any[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("The API_KEY environment variable is not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Check for prompt feedback, which indicates the prompt was blocked.
        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            const userFriendlyMessage = `تم رفض طلبك بسبب: ${reason}. يرجى تعديل الصور أو النص والمحاولة مرة أخرى.`;
            throw new Error(userFriendlyMessage);
        }

        const candidate = response.candidates?.[0];
        
        // Check for candidates and a valid finish reason.
        if (!candidate) {
            throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء استجابة. حاول مرة أخرى بوصف مختلف.");
        }
        
        // FIX: The correct string literal for an unspecified finish reason is 'FINISH_REASON_UNSPECIFIED'.
        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
             const reason = candidate.finishReason;
             const userFriendlyMessage = `توقفت عملية الإنشاء بسبب: ${reason}.`;
             throw new Error(userFriendlyMessage);
        }

        // Check for valid content structure.
        if (!candidate.content || !candidate.content.parts) {
            throw new Error("تم استلام استجابة غير صالحة من واجهة برمجة التطبيقات.");
        }

        // Extract the image data.
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data; // Return the base64 string
            }
        }
    
        // If no image part was found in a successful response.
        throw new Error("لم يتم إنشاء صورة في الاستجابة.");
    } catch(error) {
        console.error("Gemini API Error:", error);
        // Re-throw the specific error from the try block, or a generic one if it's a network error etc.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("فشل في إنشاء الصورة. يرجى التحقق من طلبك وصورك.");
    }
};