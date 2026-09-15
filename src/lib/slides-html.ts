import fs from 'fs';
import path from 'path';

export type SlotType =
  | "heading" | "body" | "bullets" | "stat" | "card-grid"
  | "image" | "chart" | "quote" | "timeline" | "table"
  | "kpi-row" | "comparison" | "step-flow" | "spec-list";

export interface SlotDef {
  id: string;
  type: SlotType;
  area: string;
}

export interface Layout {
  id: string;
  grid: string;
  cols: string;
  rows: string;
  slots: SlotDef[];
}

const ICON_CACHE = new Map<string, string>();
const ICON_WHITELIST = new Set([
  'brain','layers','shield','network','bar-chart-3','pie-chart',
  'rocket','check-circle','image','video','file-text','settings',
  'users','credit-card','palette','type','sparkles','lock','zap','database'
]);

export function icon(name: string, size = 24, color = 'var(--accent)'): string {
  const safe = ICON_WHITELIST.has(name) ? name : 'sparkles';
  if (!ICON_CACHE.has(safe)) {
    const p = path.resolve(process.cwd(), 'node_modules/lucide-static/icons', `${safe}.svg`);
    try { ICON_CACHE.set(safe, fs.readFileSync(p, 'utf8')); }
    catch { return ''; }
  }
  return ICON_CACHE.get(safe)!
    .replace('<svg', `<svg width="${size}" height="${size}" style="color:${color}"`)
    .replace(/stroke="currentColor"/g, `stroke="${color}"`);
}

export const LAYOUTS: Layout[] = [
  { id: 'cover', grid: '"heading" "kpi"', cols: '1fr', rows: '1fr auto', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'kpi', type: 'kpi-row', area: 'kpi' }] },
  { id: 'agenda', grid: '"heading" "list"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'list', type: 'spec-list', area: 'list' }] },
  { id: 'statement', grid: '"heading"', cols: '1fr', rows: '1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }] },
  { id: 'three-cards', grid: '"heading" "cards"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'cards', type: 'card-grid', area: 'cards' }] },
  { id: 'four-cards', grid: '"heading" "cards"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'cards', type: 'card-grid', area: 'cards' }] },
  { id: 'six-cards', grid: '"heading" "cards"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'cards', type: 'card-grid', area: 'cards' }] },
  { id: 'eight-cards', grid: '"heading" "cards"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'cards', type: 'card-grid', area: 'cards' }] },
  { id: 'two-col-compare', grid: '"heading" "comp"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'comp', type: 'comparison', area: 'comp' }] },
  { id: 'stat-trio', grid: '"heading" "stats"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'stats', type: 'stat', area: 'stats' }] },
  { id: 'stat-plus-body', grid: '"heading heading" "stat body"', cols: '1fr 2fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'stat', type: 'stat', area: 'stat' }, { id: 'body', type: 'body', area: 'body' }] },
  { id: 'chart-left-body-right', grid: '"heading heading" "chart body"', cols: '60fr 40fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'chart', type: 'chart', area: 'chart' }, { id: 'body', type: 'body', area: 'body' }] },
  { id: 'chart-right-body-left', grid: '"heading heading" "body chart"', cols: '40fr 60fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'body', type: 'body', area: 'body' }, { id: 'chart', type: 'chart', area: 'chart' }] },
  { id: 'image-split-left', grid: '"img content"', cols: '45fr 55fr', rows: '1fr', slots: [{ id: 'img', type: 'image', area: 'img' }, { id: 'content', type: 'body', area: 'content' }] },
  { id: 'image-split-right', grid: '"content img"', cols: '55fr 45fr', rows: '1fr', slots: [{ id: 'content', type: 'body', area: 'content' }, { id: 'img', type: 'image', area: 'img' }] },
  { id: 'image-full-scrim', grid: '"heading" "body"', cols: '1fr', rows: 'auto auto', slots: [{ id: 'img', type: 'image', area: '1 / 1 / -1 / -1' }, { id: 'heading', type: 'heading', area: 'heading' }, { id: 'body', type: 'body', area: 'body' }] },
  { id: 'step-flow-4', grid: '"heading" "flow"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'flow', type: 'step-flow', area: 'flow' }] },
  { id: 'table-full', grid: '"heading" "table"', cols: '1fr', rows: 'auto 1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }, { id: 'table', type: 'table', area: 'table' }] },
  { id: 'quote-plus-stats', grid: '"quote stat"', cols: '2fr 1fr', rows: '1fr', slots: [{ id: 'quote', type: 'quote', area: 'quote' }, { id: 'stat', type: 'stat', area: 'stat' }] },
  { id: 'closing', grid: '"heading"', cols: '1fr', rows: '1fr', slots: [{ id: 'heading', type: 'heading', area: 'heading' }] }
];

export function barChart(data: {label:string, value:number}[], opts: any = {}): string {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  let svg = `<svg viewBox="0 0 400 200"  style="width:100%; height:100%;">`;
  const barW = 400 / (data.length * 2);
  data.forEach((d, i) => {
    const x = (i * 2 + 0.5) * barW;
    const h = (d.value / maxVal) * 160;
    const y = 180 - h;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="var(--accent)" rx="4" />`;
  });
  svg += `</svg>`;
  // Labels are HTML
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}`;
  data.forEach((d, i) => {
    const x = ((i * 2 + 1) * barW / 400) * 100;
    html += `<div style="position:absolute; bottom:0; left:${x}%; transform:translateX(-50%); font-size:12px; color:var(--muted);">${d.label}</div>`;
    const h = (d.value / maxVal) * 100 * 0.8;
    html += `<div style="position:absolute; bottom:${h + 12}%; left:${x}%; transform:translateX(-50%); font-size:14px; color:var(--text); font-weight:bold;">${d.value}</div>`;
  });
  html += `</div>`;
  return html;
}

export function lineChart(data: {label:string, value:number}[], opts: any = {}): string {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  let pts = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 400},${180 - (d.value / maxVal) * 160}`).join(' ');
  let svg = `<svg viewBox="0 0 400 200"  style="width:100%; height:100%;">
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="4" />
  </svg>`;
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}`;
  data.forEach((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    html += `<div style="position:absolute; bottom:0; left:${x}%; transform:translateX(-50%); font-size:12px; color:var(--muted);">${d.label}</div>`;
    const h = (d.value / maxVal) * 100 * 0.8;
    html += `<div style="position:absolute; bottom:${h + 12}%; left:${x}%; transform:translateX(-50%); font-size:14px; color:var(--text); font-weight:bold;">${d.value}</div>`;
  });
  html += `</div>`;
  return html;
}

export function donutChart(data: {label:string, value:number}[], opts: any = {}): string {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let svg = `<svg viewBox="0 0 200 200" style="width:100%; height:100%;">`;
  let acc = 0;
  const colors = ['var(--accent)', 'var(--accent-2)', 'var(--card-2)', 'var(--faint)'];
  data.forEach((d, i) => {
    const pct = d.value / Math.max(1, total);
    const a1 = acc * Math.PI * 2;
    const a2 = (acc + pct) * Math.PI * 2;
    acc += pct;
    const x1 = 100 + Math.cos(a1) * 80; const y1 = 100 + Math.sin(a1) * 80;
    const x2 = 100 + Math.cos(a2) * 80; const y2 = 100 + Math.sin(a2) * 80;
    const largeArc = pct > 0.5 ? 1 : 0;
    svg += `<path d="M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" />`;
  });
  svg += `<circle cx="100" cy="100" r="50" fill="var(--bg)" /></svg>`;
  let html = `<div style="position:relative; width:100%; height:100%;">${svg}
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
      <div style="font-size:24px; font-weight:bold; color:var(--text);">${opts.centerLabel || ''}</div>
    </div>
  </div>`;
  return html;
}

export function progressBars(data: {label:string, value:number, max?:number}[], opts: any = {}): string {
  let html = `<div style="display:grid; gap:16px; width:100%; height:100%; align-content:center;">`;
  data.forEach(d => {
    const max = d.max || Math.max(...data.map(x => x.value), 1);
    const pct = (d.value / max) * 100;
    html += `
      <div>
        <div style="display:grid; grid-template-columns:1fr auto; margin-bottom:6px;">
          <span style="font-size:14px; color:var(--text);">${d.label}</span>
          <span style="font-size:14px; color:var(--muted); font-weight:bold;">${d.value}</span>
        </div>
        <div style="height:8px; background:var(--card-2); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:var(--accent); border-radius:4px;"></div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

export function flowDiagram(nodes: {id:string, label:string}[], opts: any = {}): string {
  const cols = nodes.map(() => '1fr').join(' auto ');
  let html = `<div style="display:grid; grid-template-columns:${cols}; align-items:center; gap:12px; width:100%; height:100%;">`;
  nodes.forEach((n, i) => {
    html += `<div style="background:var(--card); border:1px solid var(--accent-2); border-radius:var(--radius); padding:16px; text-align:center;">
      <div style="color:var(--text); font-weight:bold;">${n.label}</div>
    </div>`;
    if (i < nodes.length - 1) {
      html += `<div style="color:var(--faint); text-align:center; font-size:18px;">→</div>`;
    }
  });
  html += `</div>`;
  return html;
}
