// Simple AI/ML predictor - uses weighted scoring + Monte Carlo simulation
// No heavy libraries needed - easy to read and understand
const { runMatch } = require('./engine');

function getEntryBonus(entryNumber) {
  // Late entries (#25-30) often win the Rumble
  if (entryNumber >= 28) return 1.4;
  if (entryNumber >= 25) return 1.25;
  if (entryNumber >= 20) return 1.1;
  if (entryNumber <= 3) return 0.75; // Early entries are risky
  if (entryNumber <= 10) return 0.9;
  return 1.0;
}

// Score one wrestler based on their stats
function scoreWrestler(wrestler) {
  const winProb = wrestler.winProbability || 5;
  const resistance = wrestler.eliminationResistance || 1.0;
  const entryBonus = getEntryBonus(wrestler.entryNumber || 15);

  return winProb * resistance * entryBonus;
}

// Predict win percentages for all wrestlers in a roster
function predictWinners(wrestlers) {
  const scores = wrestlers.map(w => ({
    name: w.name,
    entryNumber: w.entryNumber,
    brand: w.brand,
    score: scoreWrestler(w)
  }));

  const total = scores.reduce((sum, w) => sum + w.score, 0) || 1;

  const predictions = scores
    .map(w => ({
      ...w,
      winPercent: Math.round((w.score / total) * 1000) / 10
    }))
    .sort((a, b) => b.winPercent - a.winPercent);

  return {
    topPick: predictions[0],
    predictions,
    insight: buildInsight(predictions)
  };
}

function buildInsight(predictions) {
  const top = predictions[0];
  const lateEntry = predictions.find(p => p.entryNumber >= 25 && p.winPercent > 8);

  if (lateEntry && lateEntry.name !== top.name) {
    return `${top.name} is the AI favorite (${top.winPercent}%), but watch ${lateEntry.name} — late entry #${lateEntry.entryNumber} gives a strong edge.`;
  }
  return `${top.name} leads with ${top.winPercent}% predicted win chance based on stats and entry position.`;
}

// Run many full simulations (Monte Carlo) using the same engine as the live simulator
function monteCarloPredict(wrestlers, runs = 500) {
  const winCounts = {};
  wrestlers.forEach(w => { winCounts[w.name] = 0; });

  for (let i = 0; i < runs; i++) {
    const match = runMatch(wrestlers);
    if (match.winner) winCounts[match.winner.name]++;
  }

  const results = wrestlers.map(w => ({
    name: w.name,
    entryNumber: w.entryNumber,
    brand: w.brand,
    winPercent: Math.round((winCounts[w.name] / runs) * 1000) / 10
  })).sort((a, b) => b.winPercent - a.winPercent);

  return {
    runs,
    topPick: results[0],
    predictions: results,
    insight: `After ${runs} AI simulations, ${results[0].name} wins most often (${results[0].winPercent}%).`
  };
}

module.exports = { predictWinners, monteCarloPredict, scoreWrestler };
