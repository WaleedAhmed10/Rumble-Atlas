// Shared Royal Rumble match engine.
// Used by BOTH the live simulation (POST /api/simulations/run) and the Monte Carlo
// predictor, so the "prediction" and the "simulation" always follow the same rules.

const MAX_MINUTES = 600; // hard safety stop; elimination odds rise over time so this is never normally reached

// How strong a wrestler is in the ring. Uses BOTH eliminationResistance and winProbability
// (the old Monte Carlo ignored winProbability entirely).
function strengthOf(w) {
  const resistance = Number(w.eliminationResistance) > 0 ? Number(w.eliminationResistance) : 1;
  const winProb = Number(w.winProbability) >= 0 ? Number(w.winProbability) : 5;
  return resistance * (0.75 + 0.5 * Math.sqrt(winProb));
}

// Minute at which the k-th entrant (0-based) enters: one every 1.5 minutes.
function entryMinute(k) {
  return 1 + Math.floor(k * 1.5);
}

function createMatch(wrestlers) {
  const queue = [...wrestlers]
    .sort((a, b) => a.entryNumber - b.entryNumber)
    .map((w, k) => ({ ...w, _entryMinute: entryMinute(k) }));
  return { queue, active: [], eliminated: [], minute: 0, total: queue.length, winner: null, events: [] };
}

// Advance the match by one minute. Returns the events that happened this minute.
function stepMatch(m, rng = Math.random) {
  m.minute += 1;
  const events = [];
  const push = (type, text, extra = {}) => {
    const e = { minute: m.minute, type, text, ...extra };
    events.push(e);
    m.events.push(e);
  };

  while (m.queue.length > 0 && m.queue[0]._entryMinute <= m.minute) {
    const w = m.queue.shift();
    m.active.push({ ...w, stamina: 100, momentum: 0, eliminations: 0, enteredAt: m.minute });
    push('entry', `${w.name} enters at #${w.entryNumber}!`, { name: w.name });
  }

  // Everyone in the ring gets tired and rolls for elimination
  const doomed = [];
  m.active.forEach(w => {
    w.stamina -= 1 + m.active.length / 10;
    w.momentum *= 0.95;
    let chance = 0.16;
    chance *= 1 + (100 - w.stamina) / 150;
    chance /= strengthOf(w);
    chance /= 1 + w.momentum;
    if (rng() < chance) doomed.push(w);
  });

  // Resolve eliminations one at a time so that:
  //  - a wrestler alone in the ring can't be "eliminated by nobody"
  //  - the last two wrestlers can't both be eliminated in the same minute (no winner / infinite loop)
  doomed.sort(() => rng() - 0.5);
  for (const victim of doomed) {
    if (m.active.length < 2) break;
    const others = m.active.filter(w => w !== victim);
    const eliminator = others[Math.floor(rng() * others.length)];
    m.active.splice(m.active.indexOf(victim), 1);
    victim.eliminatedAt = m.minute;
    victim.eliminatedBy = eliminator.name;
    victim.timeInRing = m.minute - victim.enteredAt;
    m.eliminated.push(victim);
    eliminator.eliminations += 1;
    eliminator.momentum += 0.25;
    push('elimination', `❌ ${victim.name} eliminated by ${eliminator.name}!`, { name: victim.name, by: eliminator.name });
  }

  if (m.queue.length === 0 && m.active.length === 1) {
    m.winner = m.active[0];
    m.winner.timeInRing = m.minute - m.winner.enteredAt;
    push('winner', `🏆 WINNER: ${m.winner.name}! 🏆`, { name: m.winner.name });
  }
  return events;
}

function summarize(m) {
  const all = [...m.active, ...m.eliminated];
  const best = (key) => all.reduce((a, b) => (b[key] || 0) > (a[key] || 0) ? b : a, all[0]);
  const mostElim = best('eliminations');
  const iron = best('timeInRing');
  return {
    winner: m.winner.name,
    matchDuration: m.minute,
    mostEliminations: mostElim.eliminations || 0,
    mostEliminationsName: mostElim.name,
    ironMan: iron.name,
    ironManMinutes: iron.timeInRing || 0,
    totalEliminations: m.eliminated.length
  };
}

function runMatch(wrestlers, rng = Math.random) {
  const m = createMatch(wrestlers);
  while (!m.winner && m.minute < MAX_MINUTES) stepMatch(m, rng);
  if (!m.winner) { // should be unreachable; fall back to the strongest remaining wrestler
    m.active.sort((a, b) => strengthOf(b) - strengthOf(a));
    m.winner = m.active[0];
    m.winner.timeInRing = m.minute - m.winner.enteredAt;
  }
  return m;
}

// Full match for the live simulation page: per-minute frames the client can replay.
function runMatchWithFrames(wrestlers, rng = Math.random) {
  const m = createMatch(wrestlers);
  const frames = [];
  while (!m.winner && m.minute < MAX_MINUTES) {
    const events = stepMatch(m, rng);
    frames.push({
      minute: m.minute,
      inRing: m.active.length,
      eliminated: m.eliminated.length,
      events
    });
  }
  return { frames, timeline: m.events, summary: summarize(m) };
}

module.exports = { createMatch, stepMatch, runMatch, runMatchWithFrames, summarize, strengthOf, MAX_MINUTES };
