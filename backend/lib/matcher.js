const STOPWORDS = new Set([
  'get', 'me', 'a', 'an', 'the', 'for', 'from', 'to', 'buy', 'something',
  'nice', 'under', 'below', 'rs', 'rupees', 'inr', 'please', 'my', 'and'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function extractBudget(message) {
  const match = message.match(/(\d{2,6})/);
  return match ? parseInt(match[1], 10) : Infinity;
}

function extractMerchant(message, catalog) {
  const merchants = [...new Set(catalog.map((p) => p.merchant))];
  const lower = message.toLowerCase();
  return merchants.find((m) => lower.includes(m.toLowerCase())) || null;
}

function scoreProduct(product, tokens, budget) {
  const haystack = [product.name, product.category, ...(product.tags || [])]
    .join(' ')
    .toLowerCase();

  let keywordScore = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) keywordScore += 1;
  }

  if (product.price > budget) return null;

  const budgetFit = budget === Infinity ? 0.5 : product.price / budget;
  const priceScore = budgetFit * 2;

  return {
    product,
    score: keywordScore * 3 + priceScore,
    keywordScore
  };
}

function findMatches(message, catalog, { limit = 3 } = {}) {
  const tokens = tokenize(message);
  const budget = extractBudget(message);
  const mentionedMerchant = extractMerchant(message, catalog);

  let candidates = catalog;
  if (mentionedMerchant) {
    candidates = candidates.filter((p) => p.merchant === mentionedMerchant);
  }

  const scored = candidates
    .map((p) => scoreProduct(p, tokens, budget))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit).map((s) => s.product);
  const best = scored[0];

  let reasoning = null;
  if (best) {
    const reasons = [];
    if (best.keywordScore > 0) reasons.push('matched what you described');
    if (best.product.price <= budget) reasons.push(`fits your Rs ${budget === Infinity ? '(no limit)' : budget} budget`);
    reasoning = `Picked because it ${reasons.join(' and ')}.`;
  }

  return {
    budget: budget === Infinity ? null : budget,
    mentionedMerchant,
    best: best ? best.product : null,
    alternatives: top.slice(1),
    reasoning
  };
}

module.exports = { findMatches, tokenize, extractBudget, extractMerchant };
