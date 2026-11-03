// Branching conversations. A dialogue is a graph of nodes; each node says
// some lines and offers choices. Choices can be hidden behind conditions
// (e.g. only if you read a document) and carry effects (trust, flags, lies).
//
// dialogues[id] = {
//   start: 'nodeId',
//   nodes: {
//     nodeId: {
//       speaker: 'daniel', via: 'radio',
//       lines: ['spoken text', { narration: '...' }, { speaker: 'dispatch', text: '...' }],
//       effects: [...],                  // applied when the node is shown
//       choices: [{ text, when, effects, next, end, echo }],
//       next: 'nodeId'                    // used when there are no choices
//     }
//   }
// }
// Lines may carry a `when` condition. `start` and `next` may be route
// lists: [{ when, node }, ...] -- the first route whose condition holds.

import { evaluate } from '../core/conditions.js';

const VIA_PHRASE = {
  radio: 'over the radio',
  speaker: 'through the facility speakers',
  dispatch: 'on your police radio',
};

export function installDialogue(ctx) {
  const { effects } = ctx;
  const dialogues = ctx.content.dialogues;

  const active = () => ctx.state.dialogue.active;

  function speakerName(id) {
    if (id === 'player') return 'You';
    const sp = ctx.content.speakers[id];
    if (!sp) return id;
    const match = sp.names.find((n) => evaluate(n.when, ctx.state));
    return match ? match.name : id;
  }

  function node() {
    const a = active();
    if (!a) return null;
    const n = dialogues[a.id]?.nodes[a.node];
    if (!n) throw new Error(`Missing dialogue node ${a.id}.${a.node}`);
    return n;
  }

  // `next` (on a node or a choice) is a node id, or a list of
  // { when, node } routes where the first matching route wins.
  function resolveNext(next) {
    if (!next) return null;
    if (typeof next === 'string') return next;
    const route = next.find((r) => evaluate(r.when, ctx.state));
    if (!route) throw new Error('No dialogue route matched');
    return route.node;
  }

  function sayLine(line, n) {
    if (typeof line === 'string') line = { text: line };
    if (!evaluate(line.when, ctx.state)) return;
    if (line.narration) return ctx.say(line.narration);
    const speaker = line.speaker || n.speaker;
    const via = line.via || n.via;
    const name = speakerName(speaker);
    const phrase = speaker !== 'player' && VIA_PHRASE[via] ? `, ${VIA_PHRASE[via]}` : '';
    ctx.say(line.text, { kind: 'speech', speaker: `${name}${phrase}`, speakerId: speaker });
  }

  function showNode(dialogueId, nodeId) {
    ctx.state.dialogue.active = { id: dialogueId, node: nodeId };
    ctx.state.dialogue.seen[`${dialogueId}.${nodeId}`] = true;
    const n = node();
    if (n.via === 'radio' || n.via === 'dispatch') ctx.cue('radio.static');
    if (n.via === 'speaker') ctx.cue('speaker.hum');
    for (const line of n.lines || []) sayLine(line, n);
    effects.apply(n.effects, ctx);
    // A node with effects may have ended or redirected the conversation.
    if (n.end) end();
  }

  function start(dialogueId) {
    const d = dialogues[dialogueId];
    if (!d) throw new Error(`Unknown dialogue "${dialogueId}"`);
    showNode(dialogueId, resolveNext(d.start));
  }

  function end() {
    ctx.state.dialogue.active = null;
    ctx.bus.emit('dialogue:ended');
  }

  function choices() {
    const n = node();
    if (!n) return [];
    const list = (n.choices || [])
      .map((c, index) => ({ ...c, index }))
      .filter((c) => evaluate(c.when, ctx.state));
    if (list.length) return list.map((c) => ({ index: c.index, text: c.text }));
    return [{ index: -1, text: n.next ? 'Continue' : 'End conversation' }];
  }

  function choose(index) {
    const n = node();
    if (!n) return;
    const a = active();
    if (index === -1) {
      if (n.next) showNode(a.id, resolveNext(n.next));
      else end();
      return;
    }
    const choice = n.choices?.[index];
    if (!choice || !evaluate(choice.when, ctx.state)) {
      ctx.say('That option is not available.', { kind: 'system' });
      return;
    }
    ctx.cue('ui.select');
    if (choice.echo !== false) {
      sayLine({ speaker: 'player', text: choice.echo || choice.text }, n);
    }
    effects.apply(choice.effects, ctx);
    if (!active()) return; // an effect ended it
    if (choice.end || !choice.next) end();
    else showNode(a.id, resolveNext(choice.next));
  }

  effects.register('startDialogue', (id) => start(id));
  effects.register('endDialogue', () => end());

  // Repeat the current node's lines (after loading a save mid-conversation).
  function replay() {
    const n = node();
    if (n) for (const line of n.lines || []) sayLine(line, n);
  }

  return { start, end, choose, choices, active, speakerName, node, replay };
}
