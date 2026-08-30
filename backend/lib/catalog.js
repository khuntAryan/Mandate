const fs = require('fs');
const path = require('path');

const MERCHANTS_DIR = path.join(__dirname, 'merchants');

function loadCatalog() {
  const files = fs.readdirSync(MERCHANTS_DIR).filter((f) => f.endsWith('.json'));
  const catalog = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(MERCHANTS_DIR, file), 'utf-8'));
    for (const product of data.products) {
      catalog.push({ ...product, merchant: data.merchant });
    }
  }
  return catalog;
}

module.exports = loadCatalog();
