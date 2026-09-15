import fs from 'fs';
import pdfParse from 'pdf-parse';

async function main() {
  const dataBuffer = fs.readFileSync('output.pdf');
  const data = await pdfParse(dataBuffer);
  console.log(`Pages: ${data.numpages}`);
  console.log(`pdftotext wc -c: ${data.text.length}`);
  console.log("Sample text extracted (first 200 chars):");
  console.log(data.text.slice(0, 200));
}

main().catch(err => console.error(err));
