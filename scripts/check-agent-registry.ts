import { AGENT_FLEET } from '../src/lib/agentFleet.ts';
import { getAgentToolCost } from '../src/lib/agentPricing.ts';
import { registryConflicts, AGENT_CAPABILITIES, isExecutableAgentTool } from '../src/lib/agentCapabilities.ts';

const problems = registryConflicts(AGENT_FLEET.map((s) => ({ id: s.id, tool: s.tool })));
for (const cap of AGENT_CAPABILITIES) {
  const cost = getAgentToolCost(cap.id, {}, {});
  if (cap.billable && cost <= 0) problems.push(`billable tool has no price: ${cap.id}`);
  if (!cap.billable && cost !== 0) problems.push(`non-billable tool is priced: ${cap.id} (${cost})`);
}
if (getAgentToolCost('not_a_real_tool', {}, {}) !== 0) problems.push('unknown tool is billed');
if (isExecutableAgentTool('critic_review')) problems.push('critic_review must not execute');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`agent registry ok (${AGENT_CAPABILITIES.length} capabilities)`);
