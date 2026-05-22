import { GoogleGenAI, Schema } from '@google/genai';

export interface ModelConfig {
  modelName: string;
  temperature?: number;
  topK?: number;
  topP?: number;
}

export class GeminiManager {
  private aiClient: GoogleGenAI | null = null;
  private config: ModelConfig;

  constructor(config?: Partial<ModelConfig>) {
    this.config = {
      modelName: config?.modelName || 'gemini-3.1-pro-preview',
      temperature: config?.temperature || 1.0,
      topK: config?.topK,
      topP: config?.topP,
    };
  }

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const rawKey = process.env.GEMINI_API_KEY || '';
      const key = rawKey.replace(/['"]/g, '').trim();
      if (!key) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      this.aiClient = new GoogleGenAI({ apiKey: key });
    }
    return this.aiClient;
  }

  public updateConfig(newConfig: Partial<ModelConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): ModelConfig {
    return this.config;
  }

  public async generateContent<T>(
    parts: any[],
    systemInstruction: string,
    schema?: Schema,
    signal?: AbortSignal
  ): Promise<T> {
    const ai = this.getClient();

    const generateConfig: any = {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      temperature: this.config.temperature,
    };

    if (this.config.topK !== undefined) generateConfig.topK = this.config.topK;
    if (this.config.topP !== undefined) generateConfig.topP = this.config.topP;
    if (schema) generateConfig.responseSchema = schema;

    const responseStream = await ai.models.generateContentStream({
      model: this.config.modelName,
      contents: { parts },
      config: generateConfig
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        throw new Error('AbortError');
      }
      fullText += chunk.text;
    }

    if (!fullText) {
      throw new Error('No valid output from Gemini model');
    }

    return this.safeParseJSON<T>(fullText);
  }

  private safeParseJSON<T>(text: string): T {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }
    try {
      return JSON.parse(clean);
    } catch (e) {
      console.warn("Standard parse failed, attempting fallback substring parsing.");
      let fixedText = clean;
      
      // Quickly find valid JSON by trimming trailing garbage efficiently
      while (fixedText.lastIndexOf('}') !== -1 && fixedText.length > 2) {
        fixedText = fixedText.substring(0, fixedText.lastIndexOf('}') + 1).trim();
        try {
          return JSON.parse(fixedText);
        } catch (err) {
           fixedText = fixedText.substring(0, fixedText.lastIndexOf('}'));
        }
      }
      
      console.error("Failed to parse JSON completely. Raw response: ", text);
      throw new Error("Unable to parse JSON string from model response.");
    }
  }
  public async uploadFile(file: File): Promise<string> {
    const ai = this.getClient();
    try {
      const uploadedFile = await ai.files.upload({ 
        file: file, 
        config: { 
          mimeType: file.type || 'application/octet-stream',
          displayName: file.name
        } 
      });
      return uploadedFile.uri;
    } catch (e: any) {
      console.error("SDK frontend upload error: ", e);
      throw e;
    }
  }
}

// Export a singleton instance for general use
export const geminiManager = new GeminiManager();
