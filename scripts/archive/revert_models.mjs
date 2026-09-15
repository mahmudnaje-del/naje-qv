import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/gemini-3\.5-flash/g, 'gemini-3.6-flash');
code = code.replace(/gemini-3\.1-pro-preview/g, 'gemini-2.5-pro'); // just in case
fs.writeFileSync('server.ts', code);

let engine = fs.readFileSync('src/lib/naje-engine.ts', 'utf-8');
engine = engine.replace(/gemini-3\.5-flash/g, 'gemini-3.6-flash');
fs.writeFileSync('src/lib/naje-engine.ts', engine);
console.log("Reverted models back to 2.5-flash");
