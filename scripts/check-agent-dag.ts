import { readyStepIndex, type DagStep } from '../src/lib/agentDag';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const chained: DagStep[] = [
  { id: 'a', status: 'pending' },
  { id: 'b', status: 'pending' },
];
assert(readyStepIndex(chained) === 0, 'first implicit step should be ready');
chained[0].status = 'completed';
assert(readyStepIndex(chained) === 1, 'second implicit step waits for the first');

const independent: DagStep[] = [
  { id: 'a', status: 'pending', dependsOn: [] },
  { id: 'b', status: 'pending', dependsOn: [] },
];
assert(readyStepIndex(independent) === 0, 'first independent step is ready');
independent[1].status = 'in_progress';
assert(readyStepIndex(independent) === 0, 'an unfinished earlier independent step is still the one we run');
independent[0].status = 'completed';
assert(readyStepIndex(independent) === 1, 'second independent step does not wait on a failed sibling once the first is done');

const graph: DagStep[] = [
  { id: 'brand', status: 'completed', dependsOn: [] },
  { id: 'copy', status: 'pending', dependsOn: ['brand'] },
  { id: 'site', status: 'pending', dependsOn: ['copy'] },
];
assert(readyStepIndex(graph) === 1, 'copy is ready after brand');
graph[1].status = 'failed';
assert(readyStepIndex(graph) === -1, 'site does not run after copy failed');

console.log('agent dag ok');
