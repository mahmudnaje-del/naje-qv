import { compactProjectSources } from '../src/lib/agentContext';

const packed = compactProjectSources([
  { id: 'src_ui_1', title: 'home', type: 'file', content: 'U'.repeat(20000) },
  { id: 'note', title: 'notes', type: 'file', content: 'N'.repeat(5000) },
  { id: 'extra', title: 'extra', type: 'file', content: 'E'.repeat(5000) },
], 'media');

if (packed[0].snippet.length !== 18000) throw new Error('ui handoff should keep 18000 chars');
if (packed[1].snippet.length !== 1000) throw new Error('a normal source should cap at 1000');
const many = compactProjectSources(
  Array.from({ length: 8 }, (_, index) => ({ id: `n${index}`, title: `t${index}`, type: 'file', content: 'x'.repeat(1000) })),
  'media'
);
const total = many.reduce((sum, source) => sum + (source.snippet.startsWith('x') ? source.snippet.length : 0), 0);
if (total > 6000) throw new Error('other sources should share a 6000 budget');
if (many[7].snippet !== 't7') throw new Error('a source past the budget should keep its title only');
console.log('agent context ok');
