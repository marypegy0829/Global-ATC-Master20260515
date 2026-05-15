import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'abc'});
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(ai.files)));
