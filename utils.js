export function add(a, b) {
    return a + b;
}

export class Cache {
  constructor(ttl) {
    this.ttl = ttl;
  }

  _timeKey(key) {
    return key + ":time";
  }

  async get(key) {
    const res = await browser.storage.local.get([key, this._timeKey(key)]);

    const data = res[key];
    const time = res[this._timeKey(key)];

    if (!data || !time) return null;

    return (Date.now() - time < this.ttl) ? data : null;
  }

  async set(key, data) {
    await browser.storage.local.set({
      [key]: data,
      [this._timeKey(key)]: Date.now()
    });
  }
}

export class StockAPI {
  constructor() {
    this.baseUrl = "https://mohopam.com/api/stocks";
  }

  async fetchStocks() {
    const res = await fetch(`${this.baseUrl}/all`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async updateStock(code, payload) {
    const res = await fetch(`${this.baseUrl}/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }
}

function detect(request) {
    const url = request.url;
    if (url.includes(".m3u8") || url.includes(".mp4")) {
      console.log(d.tabId);
      browser.tabs.sendMessage(d.tabId, {
        type: "VIDEO_FOUND",
        url
      });
    }
};
