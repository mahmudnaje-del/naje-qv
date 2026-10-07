import type { DeckSlide, DeckThemeInput } from '../components/deck/DeckSlideStage';

export type DeckFile = {
  title?: string;
  slides: DeckSlide[];
  theme?: DeckThemeInput | null;
};

function safeName(title?: string): string {
  const base = String(title || 'naje-deck').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  return base || 'naje-deck';
}

async function captureSlides(deck: DeckFile): Promise<string[]> {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-14000px;top:0;width:1280px;height:720px;overflow:hidden;pointer-events:none;background:#fff;';
  document.body.appendChild(host);
  const { createRoot } = await import('react-dom/client');
  const { createElement } = await import('react');
  const { default: DeckSlideStage } = await import('../components/deck/DeckSlideStage');
  const html2canvas = (await import('html2canvas')).default;
  const root = createRoot(host);
  const images: string[] = [];
  try {
    const slides = deck.slides || [];
    for (let i = 0; i < slides.length; i++) {
      root.render(createElement(DeckSlideStage, {
        slide: slides[i],
        theme: deck.theme,
        index: i,
        total: slides.length,
        deckTitle: deck.title,
      }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 30));
      const node = host.firstElementChild as HTMLElement | null;
      if (!node) throw new Error('slide');
      const canvas = await html2canvas(node, {
        scale: 1,
        backgroundColor: '#ffffff',
        width: 1280,
        height: 720,
        windowWidth: 1280,
        useCORS: true,
        logging: false,
        onclone: (cloned) => {
          cloned.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
        },
      });
      images.push(canvas.toDataURL('image/jpeg', 0.92));
    }
  } finally {
    root.unmount();
    host.remove();
  }
  return images;
}

export async function exportDeckFile(deck: DeckFile, kind: 'pdf' | 'pptx'): Promise<void> {
  if (!deck?.slides?.length) throw new Error('empty');
  const images = await captureSlides(deck);
  const name = safeName(deck.title);
  if (kind === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
    images.forEach((img, i) => {
      if (i > 0) pdf.addPage([1280, 720], 'landscape');
      pdf.addImage(img, 'JPEG', 0, 0, 1280, 720);
    });
    pdf.save(`${name}.pdf`);
    return;
  }
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'NAJE_WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'NAJE_WIDE';
  pptx.title = deck.title || name;
  images.forEach((img) => {
    const slide = pptx.addSlide();
    slide.addImage({ data: img, x: 0, y: 0, w: 13.333, h: 7.5 });
  });
  await pptx.writeFile({ fileName: `${name}.pptx` });
}
