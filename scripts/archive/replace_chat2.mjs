import fs from 'fs';

let content = fs.readFileSync('src/pages/Chat.tsx', 'utf-8');

// Replace ImageModel
content = content.replace(/<select\s+value=\{imageModel\}[\s\S]*?<\/select>/, `<NajeSelect
                        value={imageModel}
                        onChange={(val) => setImageModel(val)}
                        options={[
                          { value: 'spectra', label: 'Naje Imagen (نقطة)' },
                          { value: 'nova', label: 'Naje Imagen Pro (1.5 نقطة)' }
                        ]}
                      />`);

// Replace ImagePreset
content = content.replace(/<select\s+value=\{imagePreset\}[\s\S]*?<\/select>/, `<NajeSelect
                        value={imagePreset}
                        onChange={(val) => setImagePreset(val)}
                        options={[
                          { value: 'custom', label: 'مخصص (حسب الأبعاد)' },
                          { value: 'fb_cover', label: 'فيسبوك: غلاف صفحة (16:9)' },
                          { value: 'fb_post', label: 'فيسبوك: صورة منشور (1:1)' },
                          { value: 'ig_square', label: 'إنستغرام: منشور مربع (1:1)' },
                          { value: 'ig_portrait', label: 'إنستغرام: منشور طولي (4:5)' },
                          { value: 'ig_story', label: 'إنستغرام: قصة / ريلز (9:16)' },
                          { value: 'tw_post', label: 'تويتر: صورة منشور (16:9)' },
                          { value: 'tw_header', label: 'تويتر: غلاف حساب (3:1)' },
                          { value: 'yt_thumb', label: 'يوتيوب: صورة مصغرة (16:9)' },
                          { value: 'yt_cover', label: 'يوتيوب: غلاف قناة (16:9)' },
                          { value: 'li_cover', label: 'لينكد إن: غلاف حساب شخصي (4:1)' },
                          { value: 'li_post', label: 'لينكد إن: صورة منشور (1:1)' },
                          { value: 'sc_story', label: 'سناب شات: قصة (9:16)' },
                          { value: 'tt_video', label: 'تيك توك: خلفية فيديو (9:16)' }
                        ]}
                      />`);

// Replace VideoModel
content = content.replace(/<select\s+value=\{videoModel\}[\s\S]*?<\/select>/, `<NajeSelect
                        value={videoModel}
                        onChange={(val) => { setVideoModel(val); setVideoDuration(val === 'veo' ? '4' : '5'); }}
                        options={[
                          { value: 'veo', label: 'Naje Video' },
                          { value: 'luma', label: 'Naje Video Ultra' }
                        ]}
                      />`);

// Replace VideoDuration
content = content.replace(/<select\s+value=\{videoDuration\}[\s\S]*?<\/select>/, `<NajeSelect
                        value={videoDuration}
                        onChange={(val) => setVideoDuration(val)}
                        options={videoModel === 'veo' ? [
                          { value: '4', label: '4 ثواني (نقطة واحدة)' },
                          { value: '8', label: '8 ثواني (نقطتان)' }
                        ] : [
                          { value: '5', label: '5 ثواني (نقطة ونصف)' },
                          { value: '10', label: '10 ثواني (3 نقاط)' }
                        ]}
                      />`);

// Replace VideoAspectRatio
content = content.replace(/<select\s+value=\{aspectRatio\}[\s\S]*?<\/select>/, `<NajeSelect
                        value={aspectRatio}
                        onChange={(val) => setAspectRatio(val)}
                        options={[
                          { value: '16:9', label: 'أفقي (16:9) - شاشة عريضة' },
                          { value: '9:16', label: 'طولي (9:16) - للجوال' },
                          { value: '1:1', label: 'مربع (1:1) - للمنشورات' },
                          { value: '4:3', label: 'كلاسيكي (4:3)' }
                        ]}
                      />`);

fs.writeFileSync('src/pages/Chat.tsx', content);
