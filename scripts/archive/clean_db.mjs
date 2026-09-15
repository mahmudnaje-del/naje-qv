import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/try \{\n\s*await db\.collection\('model_pricing'\)\.doc\('image'\)\.set\(pricing\.image\);\n\s*await db\.collection\('model_pricing'\)\.doc\('video'\)\.set\(pricing\.video\);\n\s*await db\.collection\('model_pricing'\)\.doc\('document'\)\.set\(pricing\.document\);\n\s*\} catch\(e\) \{\}/g, '');
fs.writeFileSync('server.ts', code);
