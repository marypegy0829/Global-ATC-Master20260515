import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({apiKey: 'abc'});
console.log(Object.keys(ai));
console.log(Object.keys(ai.files));
