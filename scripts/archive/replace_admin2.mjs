import fs from 'fs';

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// replace 1
content = content.replace(/<select\s+value=\{providers.spectra_flash\}[\s\S]*?<\/select>/, `<NajeSelect
                value={providers.spectra_flash}
                onChange={(val) => handleUpdateProvider('spectra_flash', val)}
                options={[
                  { value: 'gemini', label: 'Google Gemini (gemini-3.1-flash-image)' },
                  { value: 'openai', label: 'OpenAI DALL-E 3 (dall-e-3)' }
                ]}
                className="w-64"
              />`);

// replace 2
content = content.replace(/<select\s+value=\{providers.nova_canvas\}[\s\S]*?<\/select>/, `<NajeSelect
                value={providers.nova_canvas}
                onChange={(val) => handleUpdateProvider('nova_canvas', val)}
                options={[
                  { value: 'gemini', label: 'Google Gemini (gemini-3-pro-image-preview)' }
                ]}
                className="w-64"
              />`);

// replace 3
content = content.replace(/<select\s+value=\{providers.veo_lite\}[\s\S]*?<\/select>/, `<NajeSelect
                value={providers.veo_lite}
                onChange={(val) => handleUpdateProvider('veo_lite', val)}
                options={[
                  { value: 'google', label: 'Google Veo (veo-3.1-lite-generate-preview)' },
                  { value: 'runway', label: 'Runway Gen-3 Alpha' }
                ]}
                className="w-64"
              />`);

// replace 4
content = content.replace(/<select\s+value=\{providers.omni_flash\}[\s\S]*?<\/select>/, `<NajeSelect
                value={providers.omni_flash}
                onChange={(val) => handleUpdateProvider('omni_flash', val)}
                options={[
                  { value: 'google', label: 'Google Omni Flash Preview' },
                  { value: 'luma', label: 'Luma Dream Machine' }
                ]}
                className="w-64"
              />`);

fs.writeFileSync('src/pages/Admin.tsx', content);
