import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ChatMessage, ChatSession } from '../types';
import { triggerSmartDownload } from '../stores/smartDownloadStore';
import { getDoc as getLocalDoc } from '../lib/idb';

async function resolveMediaUrlForPdf(url: string | undefined, defaultMime = 'image/jpeg'): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('local:')) {
    try {
      const localId = url.split('local:')[1];
      const doc = await getLocalDoc(localId);
      if (doc) {
        return doc.startsWith('data:') || doc.startsWith('http') ? doc : `data:${defaultMime};base64,${doc}`;
      }
    } catch {
      return '';
    }
    return '';
  }
  return `data:${defaultMime};base64,${url}`;
}

// Helper to sanitize OKLCH colors in cloned document to avoid html2canvas CSS parse errors
const sanitizeOklchInClonedDoc = (clonedDoc: Document) => {
  const styles = clonedDoc.querySelectorAll('style');
  styles.forEach((s) => {
    if (s.textContent && s.textContent.includes('oklch')) {
      s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, 'rgb(129, 140, 248)');
    }
  });
  const allElements = clonedDoc.querySelectorAll('*');
  allElements.forEach((el: any) => {
    if (el.style) {
      for (let i = 0; i < el.style.length; i++) {
        const propName = el.style[i];
        const val = el.style.getPropertyValue(propName);
        if (val && val.includes('oklch')) {
          el.style.setProperty(propName, 'rgb(129, 140, 248)');
        }
      }
    }
  });
};

// Helper to format date
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to load image and ensure it's loaded before rendering
const ensureImageLoaded = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export const exportSingleImagePDF = async (
  imgBase64OrUrl: string,
  prompt: string,
  modelName: string,
  date: number,
  projectName?: string,
  aspectRatio?: string
) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.minHeight = '1130px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#030712';
  container.style.color = '#f3f4f6';
  container.style.padding = '45px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.direction = 'rtl';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  const imgSrc = imgBase64OrUrl.startsWith('data:') || imgBase64OrUrl.startsWith('http') 
    ? imgBase64OrUrl 
    : `data:image/jpeg;base64,${imgBase64OrUrl}`;

  // Preload image to ensure html2canvas paints it
  try {
    await ensureImageLoaded(imgSrc);
  } catch (err) {
    console.error('Error preloading image for PDF:', err);
  }

  const exportDate = formatDate(date || Date.now());

  container.innerHTML = `
    <!-- Top Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 24px; margin-bottom: 30px;">
      <div>
        <h1 style="font-size: 26px; font-weight: 800; margin: 0; color: #818cf8; letter-spacing: -0.5px;">Naje AI • ناجي ذكاء اصطناعي</h1>
        <p style="font-size: 13px; color: #9ca3af; margin: 6px 0 0 0;">مستند تصدير وتوثيق إبداعي عالي الدقة</p>
      </div>
      <div style="text-align: left; direction: ltr;">
        <div style="font-size: 14px; font-weight: 700; color: #f3f4f6;">المشروع: ${projectName || 'عام'}</div>
        <div style="font-size: 12px; color: #9ca3af; margin-top: 6px;">تاريخ التصدير: ${exportDate}</div>
      </div>
    </div>

    <!-- Body Content -->
    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 32px;">
      
      <!-- Premium Framed Artwork Container -->
      <div style="background: linear-gradient(135deg, #0f172a, #1e1b4b); border: 1px solid rgba(129, 140, 248, 0.2); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <img src="${imgSrc}" style="max-width: 100%; max-height: 480px; border-radius: 12px; object-fit: contain; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);" />
      </div>

      <!-- Prompt Info Box -->
      <div style="background: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
        <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 12px 0; color: #a5b4fc; display: flex; align-items: center; gap: 8px;">
          الأمر الإبداعي (Prompt)
        </h3>
        <p style="font-size: 14px; color: #e5e7eb; line-height: 1.7; margin: 0; white-space: pre-wrap; font-style: italic; background: rgba(255,255,255,0.02); padding: 14px; border-radius: 10px; border-right: 3px solid #818cf8;">"${prompt}"</p>
      </div>

      <!-- Tech Details Table -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: center;">
          <span style="font-size: 12px; color: #9ca3af; display: block; margin-bottom: 6px; font-weight: 500;">نموذج التوليد المستخدم</span>
          <span style="font-size: 15px; font-weight: 700; color: #f3f4f6; display: flex; align-items: center; gap: 6px;">
            <span style="color: #34d399;">●</span> ${modelName || 'Naje Imagen Pro'}
          </span>
        </div>
        <div style="background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: center;">
          <span style="font-size: 12px; color: #9ca3af; display: block; margin-bottom: 6px; font-weight: 500;">أبعاد التصميم (Aspect Ratio)</span>
          <span style="font-size: 15px; font-weight: 700; color: #f3f4f6; display: flex; align-items: center; gap: 6px;">
            <span style="color: #a78bfa;">■</span> ${aspectRatio || '1:1'}
          </span>
        </div>
      </div>

    </div>

    <!-- Footer Content -->
    <div style="border-top: 1px solid #1f2937; padding-top: 24px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af;">
      <span>منصة Naje AI للإنتاج الإبداعي الذكي - نُبدع في كل بكسل</span>
      <span>الصفحة 1 من 1</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5, // High definition DPI
      useCORS: true,
      backgroundColor: '#030712',
      logging: false,
      onclone: sanitizeOklchInClonedDoc,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const pdfDataUri = pdf.output('datauristring');
    triggerSmartDownload({
      data: pdfDataUri,
      mimeType: 'application/pdf',
      ext: 'pdf',
      prompt: prompt,
      fallbackName: 'مستند_تصميم_ناجي',
    });
  } catch (error) {
    console.error('Failed to export PDF:', error);
  } finally {
    document.body.removeChild(container);
  }
};

export const exportChatPDF = async (
  chatTitle: string,
  messages: ChatMessage[],
  projectName?: string
) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.minHeight = '1130px';
  container.style.boxSizing = 'border-box';
  container.style.backgroundColor = '#030712';
  container.style.color = '#f3f4f6';
  container.style.padding = '45px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.direction = 'rtl';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Sort messages by creation time
  const sortedMessages = [...messages].sort((a, b) => a.createdAt - b.createdAt);

  // Preload any media images
  for (const m of sortedMessages) {
    if (m.mediaUrl && m.mediaType !== 'video') {
      const src = await resolveMediaUrlForPdf(m.mediaUrl, 'image/jpeg');
      if (src) {
        try {
          await ensureImageLoaded(src);
        } catch (e) {
          console.error('Error preloading chat message image:', e);
        }
      }
    }
  }

  const exportDate = formatDate(Date.now());

  let messagesHTML = '';
  for (const msg of sortedMessages) {
    const isUser = msg.role === 'user';
    const senderName = isUser ? 'المستخدم' : 'Naje AI (الذكاء الاصطناعي)';
    const senderColor = isUser ? '#818cf8' : '#34d399';
    const bgStyle = isUser ? 'rgba(129, 140, 248, 0.05)' : 'rgba(52, 211, 153, 0.03)';
    const borderStyle = isUser ? '1px solid rgba(129, 140, 248, 0.1)' : '1px solid rgba(52, 211, 153, 0.1)';

    let mediaHTML = '';
    if (msg.mediaUrl) {
      if (msg.mediaType === 'video') {
        mediaHTML = `
          <div style="margin-top: 14px; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; border: 1px dashed #374151; text-align: center; font-size: 13px; color: #9ca3af;">
            فيديو مولد (رابط الملف: ${msg.mediaUrl.substring(0, 45)}...)
          </div>
        `;
      } else {
        const src = await resolveMediaUrlForPdf(msg.mediaUrl, 'image/jpeg');
        if (src) {
          mediaHTML = `
            <div style="margin-top: 14px; text-align: center; border-radius: 10px; overflow: hidden; background: #0f172a; padding: 12px; border: 1px solid rgba(255,255,255,0.05);">
              <img src="${src}" style="max-width: 100%; max-height: 350px; border-radius: 6px; object-fit: contain; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);" />
            </div>
          `;
        }
      }
    }

    messagesHTML += `
      <div style="background: ${bgStyle}; border: ${borderStyle}; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 700; color: ${senderColor};">${senderName}</span>
          <span style="font-size: 11px; color: #6b7280;">${formatDate(msg.createdAt)}</span>
        </div>
        <div style="font-size: 14px; color: #e5e7eb; line-height: 1.6; white-space: pre-wrap;">${msg.content}</div>
        ${mediaHTML}
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Top Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f2937; padding-bottom: 24px; margin-bottom: 30px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; color: #818cf8;">Naje AI • تقرير محادثة إبداعية</h1>
        <p style="font-size: 13px; color: #9ca3af; margin: 6px 0 0 0;">عنوان الجلسة: ${chatTitle}</p>
      </div>
      <div style="text-align: left; direction: ltr;">
        <div style="font-size: 13px; font-weight: 700; color: #f3f4f6;">المشروع: ${projectName || 'عام'}</div>
        <div style="font-size: 11px; color: #9ca3af; margin-top: 6px;">تاريخ التصدير: ${exportDate}</div>
      </div>
    </div>

    <!-- Body Content -->
    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 10px;">
      ${messagesHTML}
    </div>

    <!-- Footer Content -->
    <div style="border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af;">
      <span>تم التصدير عبر لوحة Naje AI - نُبدع في كل بكسل</span>
      <span>وثيقة تقرير متكاملة</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#030712',
      logging: false,
      onclone: sanitizeOklchInClonedDoc,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const pdfDataUri = pdf.output('datauristring');
    triggerSmartDownload({
      data: pdfDataUri,
      mimeType: 'application/pdf',
      ext: 'pdf',
      title: chatTitle,
      fallbackName: 'تقرير_محادثة_ناجي',
    });
  } catch (error) {
    console.error('Failed to export Chat PDF:', error);
  } finally {
    document.body.removeChild(container);
  }
};

export const exportProjectPDF = async (
  projectName: string,
  entityType: string,
  chats: { chat: ChatSession, messages: ChatMessage[] }[]
) => {
  // Let's create a beautiful cover page and follow-up pages
  const docPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // standard A4 size
  });

  // Cover Page (Page 1)
  const renderCoverPage = async (): Promise<string> => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '1130px'; // close to A4 aspect ratio
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = '#0b0f19';
    container.style.color = '#f3f4f6';
    container.style.padding = '80px 60px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'space-between';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    container.innerHTML = `
      <!-- Cover Header Decorative element -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="background: linear-gradient(90deg, #818cf8, #34d399); height: 6px; width: 120px; border-radius: 3px;"></div>
        <span style="font-size: 14px; font-weight: 600; color: #a5b4fc; letter-spacing: 1px;">PORTFOLIO REPORT</span>
      </div>

      <!-- Main Titles -->
      <div style="margin-top: 100px;">
        <span style="font-size: 16px; font-weight: 600; color: #34d399; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 12px;">مستند عرض ومراجعة مشروع إبداعي</span>
        <h1 style="font-size: 48px; font-weight: 900; line-height: 1.2; margin: 0; color: #ffffff; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${projectName}</h1>
        <p style="font-size: 18px; color: #9ca3af; margin: 15px 0 0 0; font-weight: 400;">نوع العمل: ${entityType || 'مساحة شخصية'}</p>
      </div>

      <!-- Footer / Meta -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #1f2937; padding-top: 40px; margin-top: auto;">
        <div>
          <span style="display: block; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">تم التوليد بواسطة</span>
          <span style="font-size: 16px; font-weight: 800; color: #818cf8; margin-top: 4px; display: block;">Naje AI Platform</span>
        </div>
        <div style="text-align: left; direction: ltr;">
          <span style="display: block; font-size: 11px; color: #6b7280; font-weight: 600;">تاريخ التقرير</span>
          <span style="font-size: 14px; color: #e5e7eb; margin-top: 4px; display: block;">${formatDate(Date.now())}</span>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0b0f19',
      logging: false,
      onclone: sanitizeOklchInClonedDoc,
    });
    document.body.removeChild(container);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Chat Item Page (Subsequent Pages)
  const renderChatItemPage = async (chatTitle: string, messages: ChatMessage[], pageNum: number, totalPages: number): Promise<string> => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '1130px';
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = '#030712';
    container.style.color = '#f3f4f6';
    container.style.padding = '50px 45px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'space-between';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Find the last assistant message with an image
    const imageMessages = messages.filter(m => m.role === 'assistant' && m.mediaUrl && m.mediaType !== 'video');
    const lastImageMessage = imageMessages[imageMessages.length - 1];

    // Find user prompt that triggered it
    let promptText = 'توليد تلقائي';
    if (lastImageMessage) {
      // Look for the user message right before it
      const index = messages.findIndex(m => m.id === lastImageMessage.id);
      if (index > 0 && messages[index - 1].role === 'user') {
        promptText = messages[index - 1].content;
      } else {
        // Fallback: first user message
        const userMsg = messages.find(m => m.role === 'user');
        if (userMsg) promptText = userMsg.content;
      }
    }

    let innerContentHTML = '';
    if (lastImageMessage && lastImageMessage.mediaUrl) {
      const src = await resolveMediaUrlForPdf(lastImageMessage.mediaUrl, 'image/jpeg');

      innerContentHTML = `
        <div style="background: linear-gradient(135deg, #0f172a, #111827); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; text-align: center; display: flex; justify-content: center; align-items: center; min-height: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          <img src="${src}" style="max-width: 100%; max-height: 400px; border-radius: 10px; object-fit: contain; box-shadow: 0 15px 30px rgba(0,0,0,0.5);" />
        </div>
        
        <div style="background: #0b0f19; border: 1px solid #1f2937; border-radius: 14px; padding: 20px;">
          <h4 style="font-size: 13px; font-weight: 700; color: #818cf8; margin: 0 0 10px 0;">الأمر البرمجي (Prompt):</h4>
          <p style="font-size: 13px; color: #d1d5db; line-height: 1.6; margin: 0; white-space: pre-wrap; font-style: italic;">"${promptText}"</p>
        </div>
      `;
    } else {
      // Text-based or chat conversation summary
      const textMsgs = messages.slice(0, 5).map(m => `
        <div style="margin-bottom: 15px; border-right: 3px solid ${m.role === 'user' ? '#818cf8' : '#34d399'}; padding-right: 10px;">
          <div style="font-size: 12px; font-weight: bold; color: ${m.role === 'user' ? '#818cf8' : '#34d399'}; margin-bottom: 3px;">
            ${m.role === 'user' ? 'المستخدم' : 'Naje AI'}
          </div>
          <div style="font-size: 13px; color: #d1d5db; line-height: 1.5; max-height: 80px; overflow: hidden; text-overflow: ellipsis;">
            ${m.content}
          </div>
        </div>
      `).join('');

      innerContentHTML = `
        <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; min-height: 450px; display: flex; flex-direction: column; gap: 15px; justify-content: flex-start;">
          <h3 style="font-size: 16px; font-weight: bold; color: #f3f4f6; margin-bottom: 10px; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">موجز الجلسة والنقاش:</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${textMsgs || '<div style="color: #6b7280; font-style: italic;">لا توجد رسائل مسجلة في هذه المساحة</div>'}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 16px; margin-bottom: 25px;">
        <div>
          <span style="font-size: 11px; color: #818cf8; font-weight: 600; text-transform: uppercase;">مشروع: ${projectName}</span>
          <h2 style="font-size: 18px; font-weight: bold; margin: 4px 0 0 0; color: #ffffff;">القسم: ${chatTitle}</h2>
        </div>
        <div style="font-size: 11px; color: #9ca3af; direction: ltr;">Naje AI • Page ${pageNum}</div>
      </div>

      <!-- Main Page Content -->
      <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 24px; justify-content: center;">
        ${innerContentHTML}
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 25px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af;">
        <span>منصة الإنتاج والتوليد الذكي - Naje AI</span>
        <span>صفحة ${pageNum} من ${totalPages}</span>
      </div>
    `;

    document.body.appendChild(container);

    // Preload any image within container before capturing
    const imagesInContainer = container.getElementsByTagName('img');
    for (let i = 0; i < imagesInContainer.length; i++) {
      const img = imagesInContainer[i];
      try {
        await ensureImageLoaded(img.src);
      } catch (err) {
        console.error('Error preloading inside chat item container:', err);
      }
    }

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#030712',
      logging: false,
      onclone: sanitizeOklchInClonedDoc,
    });
    document.body.removeChild(container);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  try {
    // Page 1: Cover Page
    const coverDataUrl = await renderCoverPage();
    docPdf.addImage(coverDataUrl, 'JPEG', 0, 0, 210, 297); // 210x297 is A4 in mm

    // Other Pages
    const totalPages = chats.length + 1; // cover page + 1 page per chat
    for (let i = 0; i < chats.length; i++) {
      const { chat, messages: chatMessages } = chats[i];
      docPdf.addPage();
      const pageDataUrl = await renderChatItemPage(chat.title, chatMessages, i + 2, totalPages);
      docPdf.addImage(pageDataUrl, 'JPEG', 0, 0, 210, 297);
    }

    const pdfDataUri = docPdf.output('datauristring');
    triggerSmartDownload({
      data: pdfDataUri,
      mimeType: 'application/pdf',
      ext: 'pdf',
      title: `عرض_مشروع_${projectName}`,
      fallbackName: 'عرض_مشروع_ناجي',
    });
  } catch (error) {
    console.error('Failed to export multi-page Project PDF:', error);
  }
};
