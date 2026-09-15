import fs from 'fs';

let content = fs.readFileSync('src/components/NajePreviewRenderer.tsx', 'utf-8');

// Replace flex-col sm:flex-row back to flex-row
content = content.replace(/flex-col sm:flex-row/g, 'flex-row');
content = content.replace(/flex-col md:flex-row/g, 'flex-row');

fs.writeFileSync('src/components/NajePreviewRenderer.tsx', content);
