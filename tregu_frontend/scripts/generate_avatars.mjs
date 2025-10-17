import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'avatars');
fs.mkdirSync(outDir, { recursive: true });

const palette = [
  ['#0E5FD8', '#264AA3'], ['#0BA5A4', '#0E7C86'], ['#5B67E3', '#3A3D91'], ['#14B8A6', '#0F766E'],
  ['#7C3AED', '#5B21B6'], ['#059669', '#065F46'], ['#2563EB', '#1E3A8A'], ['#9333EA', '#6D28D9'],
  ['#EA580C', '#C2410C'], ['#DC2626', '#991B1B'], ['#0891B2', '#0E7490'], ['#10B981', '#047857'],
  ['#F59E0B', '#D97706'], ['#EF4444', '#B91C1C'], ['#1F2937', '#111827'], ['#0EA5E9', '#0369A1'],
  ['#6366F1', '#4338CA'], ['#14B8A6', '#0D9488'], ['#22C55E', '#15803D'], ['#A855F7', '#7E22CE'],
  ['#E11D48', '#9F1239'], ['#F97316', '#EA580C'], ['#84CC16', '#4D7C0F'], ['#06B6D4', '#0E7490'],
  ['#60A5FA', '#2563EB'], ['#34D399', '#059669'], ['#A3E635', '#65A30D'], ['#FBBF24', '#D97706'],
  ['#F472B6', '#BE185D'], ['#FB7185', '#E11D48'], ['#94A3B8', '#475569'], ['#64748B', '#334155'],
  ['#4ADE80', '#16A34A'], ['#22D3EE', '#0891B2'], ['#C084FC', '#9333EA'], ['#FDE047', '#F59E0B'],
  ['#FCA5A5', '#EF4444'], ['#D4D4D8', '#71717A'], ['#9CA3AF', '#4B5563'], ['#F8FAFC', '#CBD5E1'],
];

const names = [
  'Atlas', 'Harbor', 'Cinder', 'Quarry', 'Nova', 'Meridian', 'Slate', 'Ember', 'Halo', 'Aster',
  'Vela', 'Orion', 'Lyra', 'Aria', 'Titan', 'Quartz', 'Onyx', 'Azure', 'Verdant', 'Saffron',
  'Indigo', 'Crimson', 'Graphite', 'Flint', 'Cypress', 'Ash', 'Coral', 'Teal', 'Umber', 'Ivory',
  'Cobalt', 'Amber', 'Jade', 'Pearl', 'Sterling', 'Dawn', 'Solace', 'Harbinger', 'Nimbus', 'Vertex'
];

const domains = [
  ['inventory', 'planning'], ['wms', 'tms'], ['crm', 'projects'], ['finance', 'controls'],
  ['manufacturing', 'planning'], ['analytics', 'finance'], ['inventory', 'wms'], ['otc', 'crm'],
  ['p2p', 'suppliers'], ['inventory', 'valuation'], ['planning', 's&op'], ['tms', 'shipping'],
  ['wms', 'slotting'], ['crm', 'cpq'], ['manufacturing', 'bom'], ['finance', 'gl'],
  ['analytics', 'dashboards'], ['planning', 'atp'], ['inventory', 'uom'], ['p2p', 'receiving'],
  ['otc', 'returns'], ['tms', 'labels'], ['wms', 'rf'], ['projects', 'wip'],
  ['planning', 'forecast'], ['inventory', 'cyclecounts'], ['crm', 'accounts'], ['wms', 'putaway'],
  ['manufacturing', 'mrp'], ['finance', 'ap_ar'], ['integrations', 'edi'], ['analytics', 'drilldown'],
  ['inventory', 'transfers'], ['planning', 'ctp'], ['crm', 'quotes'], ['projects', 't&e'],
  ['integrations', 'ipass'], ['admin', 'sso'], ['analytics', 'kpi'], ['system', 'assistant'],
];

const tones = ['formal', 'neutral', 'friendly'];
const verbosity = ['low', 'medium', 'high'];
const caution = ['high', 'medium', 'low'];
const voices = [
  { gender: 'neutral', style: 'clear', speed: 1.0 },
  { gender: 'male', style: 'concise', speed: 0.95 },
  { gender: 'female', style: 'warm', speed: 1.05 },
  { gender: 'neutral', style: 'authoritative', speed: 0.9 },
];

const svg = (a, b) => `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="80" height="80" rx="16" fill="url(#g)"/>
  <path d="M28 56h40v12H28zM28 28h40v20H28z" fill="#ffffff" opacity=".92"/>
</svg>`;

const manifest = { version: 1, avatars: [] };

for (let i = 0; i < 40; i++) {
  const id = `tb-${String(i + 1).padStart(2, '0')}`;
  const [c1, c2] = palette[i % palette.length];
  const file = `${id}.svg`;
  fs.writeFileSync(path.join(outDir, file), svg(c1, c2), 'utf8');

  const persona = {
    tone: tones[i % tones.length],
    verbosity: verbosity[Math.floor(i / 2) % verbosity.length],
    caution: caution[Math.floor(i / 3) % caution.length],
    domain_bias: domains[i % domains.length],
  };
  const voice = voices[i % voices.length];

  manifest.avatars.push({
    id,
    name: names[i],
    file: `/avatars/${file}`,
    persona,
    voice,
  });
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Wrote 40 SVGs + manifest.json to ${outDir}`);
