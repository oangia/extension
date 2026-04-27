import { Cache, StockAPI } from './utils.js';

const cache = new Cache(7 * 24 * 60 * 60 * 1000);
const api = new StockAPI();

async function getStocks({ force = false } = {}) {
  const key = "stocks";

  if (!force) {
    const cached = await cache.get(key);
    if (cached) {
      return { ok: true, data: cached, cached: true };
    }
  }

  const data = await api.fetchStocks();
  await cache.set(key, data);

  return { ok: true, data, cached: false };
}

browser.runtime.onMessage.addListener(async (msg) => {
  switch (msg.type) {
    case "FETCH_STOCKS":
      return getStocks({ force: msg.force })
        .catch(err => ({ ok: false, error: err.toString() }));

    case "SEND_STOCK":
      const data = await api.updateStock(msg.code, msg.payload);
      return { ok: true, data };
  }
});

