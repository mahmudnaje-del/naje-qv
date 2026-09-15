import fs from 'fs';

let content = fs.readFileSync('src/pages/Chat.tsx', 'utf-8');

if (!content.includes("import NajeSelect")) {
  content = content.replace("import { Link, useParams, useNavigate } from 'react-router-dom';", "import { Link, useParams, useNavigate } from 'react-router-dom';\nimport NajeSelect from '../components/NajeSelect';");
}

let newAspectSelect = `<NajeSelect
                            value={aspectRatio}
                            onChange={(val) => setAspectRatio(val)}
                            options={[
                              { value: '1:1', label: '1:1 (مربع)' },
                              { value: '16:9', label: '16:9 (عرضي)' },
                              { value: '9:16', label: '9:16 (طولي)' },
                              { value: '4:3', label: '4:3 (عرضي)' },
                              { value: '3:4', label: '3:4 (طولي)' }
                            ]}
                          />`;
content = content.replace(/<select\s+value=\{aspectRatio\}[\s\S]*?<\/select>/, newAspectSelect);

let newQualitySelect = `<NajeSelect
                            value={quality}
                            onChange={(val) => setQuality(val)}
                            options={[
                              { value: 'standard', label: 'عادية (نقطة واحدة)' },
                              { value: 'hd', label: 'عالية الدقة (نقطتان)' }
                            ]}
                          />`;
content = content.replace(/<select\s+value=\{quality\}[\s\S]*?<\/select>/, newQualitySelect);

let newNumImagesSelect = `<NajeSelect
                        value={numImages.toString()}
                        onChange={(val) => setNumImages(parseInt(val))}
                        options={[
                          { value: '1', label: '1 صورة' },
                          { value: '2', label: '2 صور' },
                          { value: '3', label: '3 صور' },
                          { value: '4', label: '4 صور' }
                        ]}
                      />`;
content = content.replace(/<select\s+value=\{numImages\}[\s\S]*?<\/select>/, newNumImagesSelect);

let newPaperSizeSelect = `<NajeSelect
                             value={paperSize}
                             onChange={(val) => setPaperSize(val)}
                             options={[
                               { value: 'a4', label: 'A4 (0.15 نقطة/صفحة)' },
                               { value: 'a5', label: 'A5 (0.10 نقطة/صفحة)' }
                             ]}
                          />`;
content = content.replace(/<select\s+value=\{paperSize\}[\s\S]*?<\/select>/, newPaperSizeSelect);

let newPagesCountSelect = `<NajeSelect
                             value={pagesCount.toString()}
                             onChange={(val) => setPagesCount(parseInt(val))}
                             options={[
                               { value: '3', label: \`3 صفحات (\${paperSize === 'a5' ? '0.3' : '0.45'} نقطة)\` },
                               { value: '5', label: \`5 صفحات (\${paperSize === 'a5' ? '0.5' : '0.75'} نقطة)\` },
                               { value: '7', label: \`7 صفحات (\${paperSize === 'a5' ? '0.7' : '1.05'} نقطة)\` },
                               { value: '10', label: \`10 صفحات (\${paperSize === 'a5' ? '1.0' : '1.5'} نقطة)\` },
                               { value: '15', label: \`15 صفحة (\${paperSize === 'a5' ? '1.5' : '2.25'} نقطة)\` },
                               { value: '20', label: \`20 صفحة (\${paperSize === 'a5' ? '2.0' : '3.0'} نقطة)\` }
                             ]}
                          />`;
content = content.replace(/<select\s+value=\{pagesCount\}[\s\S]*?<\/select>/, newPagesCountSelect);


fs.writeFileSync('src/pages/Chat.tsx', content);
