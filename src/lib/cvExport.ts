import { jsPDF } from 'jspdf';
import {
  ACCREDIT_LABELS,
  CvData,
  DEGREE_LABELS,
  LANG_LEVELS,
  bulletsOf,
  rangeLabel,
  skillsNamesString,
} from './cvStudio';

function fileSlug(s: string, max = 40) {
  return (s || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]+/gu, '')
    .slice(0, max);
}

function fileBase(cv: CvData) {
  const name = fileSlug(cv.fullName || 'CV', 40) || 'CV';
  const role = fileSlug(cv.targetRole || cv.headline, 32);
  return role ? `${name}_${role}` : name;
}

export function coverFileBase(cv: CvData) {
  return `${fileBase(cv)}_CoverLetter`;
}

export async function exportCvPdf(sheet: HTMLElement, cv: CvData): Promise<Blob> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(sheet, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: sheet.scrollWidth,
    windowHeight: sheet.scrollHeight,
  });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL('image/jpeg', 0.92);
  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 4) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  void cv;
  return pdf.output('blob');
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function xmlEsc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function cvToHtml(cv: CvData) {
  const ar = cv.lang === 'ar';
  const dir = ar ? 'rtl' : 'ltr';
  const h = (t: string, body: string) =>
    body.trim()
      ? `<h2 style="font-size:13px;letter-spacing:.12em;border-bottom:1px solid #ccc;padding-bottom:4px;margin:16px 0 8px">${esc(t)}</h2>${body}`
      : '';
  const exp = cv.experiences
    .filter((e) => e.title || e.company)
    .map((e) => {
      const lis = bulletsOf(e.bullets)
        .map((b) => `<li>${esc(b)}</li>`)
        .join('');
      const type = e.employmentType ? ` · ${esc(e.employmentType)}` : '';
      return `<p><b>${esc(e.title)}</b> — ${esc(e.company)}${type} <span style="color:#555">${esc(
        rangeLabel(e.start, e.end, e.current, cv.lang)
      )}</span></p>${lis ? `<ul>${lis}</ul>` : ''}`;
    })
    .join('');
  const gapNote =
    cv.careerBreak && cv.careerBreak !== 'أفضل عدم الشرح'
      ? `<p style="color:#555;font-size:12px">${ar ? 'فترة: ' : 'Note: '}${esc(cv.careerBreak)}</p>`
      : '';
  const edu = cv.education
    .filter((e) => e.school || e.field)
    .map((e) => {
      const gpa = e.gpa && e.showGpa !== false ? ` · GPA ${esc(e.gpa)}/${e.gpaScale}` : '';
      return `<p><b>${esc(DEGREE_LABELS[e.degreeLevel][cv.lang])} ${esc(e.field)}</b><br/>${esc(e.school)}${
        e.year ? ` · ${esc(e.year)}` : ''
      }${gpa}${e.honors ? ` · ${esc(e.honors)}` : ''}</p>`;
    })
    .join('');
  const courses = cv.courses
    .filter((c) => c.name)
    .map((c) => {
      const acc = c.accredited ? ACCREDIT_LABELS[c.accredited][cv.lang] : '';
      return `<p><b>${esc(c.name)}</b> — ${esc(c.issuer)} ${esc([c.year, acc, c.hours && `${c.hours}h`].filter(Boolean).join(' · '))}<br/>${esc(
        c.gained
      )}</p>`;
    })
    .join('');
  const certs = cv.certificates
    .filter((c) => c.name)
    .map((c) => `<p><b>${esc(c.name)}</b> — ${esc(c.issuer)} ${esc(c.year)}</p>`)
    .join('');
  const langs = cv.languages
    .filter((l) => l.name)
    .map((l) => `${esc(l.name)} (${esc(LANG_LEVELS.find((x) => x.id === l.level)?.[cv.lang] || l.level)})`)
    .join(' · ');
  const skills = skillsNamesString(cv.skillsList, cv.skills)
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(esc)
    .join(' · ');
  const projects = cv.projects
    .filter((p) => p.name)
    .map((p) => `<p><b>${esc(p.name)}</b>${p.role ? ` — ${esc(p.role)}` : ''}${p.year ? ` · ${esc(p.year)}` : ''}${p.detail ? `<br/>${esc(p.detail)}` : ''}</p>`)
    .join('');
  const pubs = cv.publications
    .filter((p) => p.title)
    .map((p) => `<p><b>${esc(p.title)}</b>${p.venue ? ` — ${esc(p.venue)}` : ''}${p.year ? ` · ${esc(p.year)}` : ''}${p.doi ? ` · DOI ${esc(p.doi)}` : ''}</p>`)
    .join('');
  const ach = cv.achievements
    .filter((a) => a.title)
    .map((a) => `<p><b>${esc(a.title)}</b>${a.org ? ` — ${esc(a.org)}` : ''}${a.year ? ` · ${esc(a.year)}` : ''}${a.detail ? ` · ${esc(a.detail)}` : ''}</p>`)
    .join('');
  const custom = cv.customSections
    .filter((s) => s.title.trim() || s.body.trim())
    .map((s) => h(s.title || (ar ? 'قسم إضافي' : 'Additional'), s.body ? `<p>${esc(s.body)}</p>` : ''))
    .join('');
  const personal = [
    cv.nationality && `${ar ? 'الجنسية' : 'Nationality'}: ${esc(cv.nationality)}`,
    cv.visa && `${ar ? 'الإقامة' : 'Visa'}: ${esc(cv.visa)}`,
    cv.notice && `${ar ? 'إشعار' : 'Notice'}: ${esc(cv.notice)}`,
    cv.dob && `${ar ? 'الميلاد' : 'DOB'}: ${esc(cv.dob)}`,
    cv.gender && `${ar ? 'الجنس' : 'Gender'}: ${esc(cv.gender)}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const contact = [cv.city, cv.country, cv.phone, cv.email, cv.linkedin, cv.portfolio, cv.github].filter((x): x is string => Boolean(x)).map(esc).join(' · ');

  return `<!DOCTYPE html><html lang="${cv.lang}" dir="${dir}"><head><meta charset="utf-8"/><title>${esc(
    cv.fullName || 'CV By Naje'
  )}</title></head><body style="font-family:Cairo,Arial,Tahoma,sans-serif;color:#111;max-width:720px;margin:24px auto;line-height:1.45">
  <h1 style="margin:0;font-size:26px">${esc(cv.fullName || '')}</h1>
  <p style="margin:4px 0 8px;color:#6a5420;font-weight:700">${esc(cv.headline || '')}</p>
  <p style="font-size:12px;color:#444">${contact}</p>
  ${h(ar ? 'الملخص المهني' : 'Professional Summary', cv.summary ? `<p>${esc(cv.summary)}</p>` : '')}
  ${cv.showPersonal ? h(ar ? 'بيانات شخصية' : 'Personal', personal ? `<p>${personal}</p>` : '') : ''}
  ${h(ar ? 'الخبرات العملية' : 'Work Experience', exp + gapNote)}
  ${h(ar ? 'التعليم' : 'Education', edu)}
  ${h(ar ? 'المهارات' : 'Skills', skills ? `<p>${skills}</p>` : '')}
  ${h(ar ? 'المشاريع' : 'Projects', projects)}
  ${h(ar ? 'الدورات التدريبية' : 'Training', courses)}
  ${h(ar ? 'الشهادات' : 'Certifications', certs)}
  ${h(ar ? 'اللغات' : 'Languages', langs ? `<p>${langs}</p>` : '')}
  ${h(ar ? 'الإنجازات' : 'Achievements', ach)}
  ${h(ar ? 'الأبحاث والمنشورات' : 'Publications', pubs)}
  ${h(ar ? 'التطوع' : 'Volunteer', cv.volunteer ? `<p>${esc(cv.volunteer)}</p>` : '')}
  ${h(ar ? 'الخدمة الوطنية' : 'National Service', cv.military ? `<p>${esc(cv.military)}</p>` : '')}
  ${custom}
  ${h(ar ? 'المراجع' : 'References', cv.references ? `<p>${esc(cv.references)}</p>` : '')}
  <p style="margin-top:28px;font-size:10px;color:#999">CV By Naje · سيرتك الذاتية بواسطة ناجي</p>
  </body></html>`;
}

export async function exportCvDocx(cv: CvData): Promise<Blob> {
  const html = cvToHtml(cv);
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );
    zip.folder('_rels')?.file(
      '.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );
    const rtl = cv.lang === 'ar' ? 'rtl' : 'ltr';
    const paras: string[] = [];
    const p = (text: string, bold = false, size = 22) => {
      paras.push(
        `<w:p><w:pPr><w:bidi w:val="${rtl === 'rtl' ? '1' : '0'}"/><w:jc w:val="${rtl === 'rtl' ? 'right' : 'left'}"/></w:pPr><w:r><w:rPr><w:sz w:val="${size}"/>${
          bold ? '<w:b/>' : ''
        }<w:rtl w:val="${rtl === 'rtl' ? '1' : '0'}"/></w:rPr><w:t xml:space="preserve">${text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</w:t></w:r></w:p>`
      );
    };
    p(cv.fullName || 'CV', true, 36);
    if (cv.headline) p(cv.headline, true, 24);
    p([cv.city, cv.country, cv.phone, cv.email].filter(Boolean).join('  |  '));
    if (cv.summary) {
      p(cv.lang === 'ar' ? 'الملخص المهني' : 'Professional Summary', true, 24);
      p(cv.summary);
    }
    const realExp = cv.experiences.filter((e) => e.title || e.company);
    if (realExp.length) {
      p(cv.lang === 'ar' ? 'الخبرات العملية' : 'Work Experience', true, 24);
      realExp.forEach((e) => {
        p(`${e.title} — ${e.company}  ${rangeLabel(e.start, e.end, e.current, cv.lang)}`, true);
        bulletsOf(e.bullets).forEach((b) => p(`• ${b}`));
      });
    }
    const edu = cv.education.filter((e) => e.school || e.field);
    if (edu.length) {
      p(cv.lang === 'ar' ? 'التعليم' : 'Education', true, 24);
      edu.forEach((e) => {
        p(
          `${DEGREE_LABELS[e.degreeLevel][cv.lang]} ${e.field} — ${e.school}${e.gpa ? ` · GPA ${e.gpa}/${e.gpaScale}` : ''}${
            e.year ? ` · ${e.year}` : ''
          }`
        );
      });
    }
    if (cv.skills.trim()) {
      p(cv.lang === 'ar' ? 'المهارات' : 'Skills', true, 24);
      p(cv.skills);
    }
    const courses = cv.courses.filter((c) => c.name);
    if (courses.length) {
      p(cv.lang === 'ar' ? 'الدورات التدريبية' : 'Training', true, 24);
      courses.forEach((c) => {
        const acc = c.accredited ? ACCREDIT_LABELS[c.accredited][cv.lang] : '';
        p(`${c.name} — ${c.issuer} ${[c.year, acc].filter(Boolean).join(' · ')}`, true);
        if (c.gained) p(c.gained);
      });
    }
    zip.folder('word')?.file(
      'document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paras.join('')}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>
  </w:body>
</w:document>`
    );
    return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  } catch {
    return new Blob(['\ufeff', html], { type: 'application/msword' });
  }
}

export { fileBase };
