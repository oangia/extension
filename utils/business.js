function parseFinancialTableHTML(htmlString) {
  const doc   = new DOMParser().parseFromString(htmlString, "text/html");
  const table = doc.querySelector("table");
  if (!table) return null;

  const headers = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim()).slice(1);
  const rows    = [...table.querySelectorAll("tbody tr")].map(tr => {
    const cells = [...tr.querySelectorAll("td")].map(td => td.textContent.trim());
    return { title: cells[0], values: cells.slice(1).map(toNumber) };
  });

  return { headers, rows };
}

class Statistic {
  constructor(data, { ignoreZero = true } = {}) {
    this.data    = data.map(Number).filter(x => !isNaN(x) && (!ignoreZero || x !== 0));
    this._sorted = null;

    this._min             = null;
    this._max             = null;
    this._secondMin       = null;
    this._secondMax       = null;
    this._avgMinSecondMin = null;
    this._avgMaxSecondMax = null;
    this._median          = null;
    this._mean            = null;
    this._trimmed         = null;
    this._weighted        = null;
    this._range           = null;
    this._variance        = null;
    this._std             = null;
    this._iqr             = null;
    this._downside        = null;
  }

  _ensureData() { return this.data.length > 0; }

  _getSorted() {
    if (this._sorted === null) this._sorted = [...this.data].sort((a, b) => a - b);
    return this._sorted;
  }

  min() {
    if (!this._ensureData()) return null;
    if (this._min === null) this._min = Math.min(...this.data);
    return this._min;
  }

  max() {
    if (!this._ensureData()) return null;
    if (this._max === null) this._max = Math.max(...this.data);
    return this._max;
  }

  second_min() {
    if (!this._ensureData()) return null;
    if (this._secondMin === null) {
      const s = this._getSorted();
      for (let i = 1; i < s.length; i++) {
        if (s[i] > s[0]) return (this._secondMin = s[i]);
      }
      this._secondMin = null;
    }
    return this._secondMin;
  }

  second_max() {
    if (!this._ensureData()) return null;
    if (this._secondMax === null) {
      const s = this._getSorted();
      for (let i = s.length - 2; i >= 0; i--) {
        if (s[i] < s[s.length - 1]) return (this._secondMax = s[i]);
      }
      this._secondMax = null;
    }
    return this._secondMax;
  }

  median() {
    if (!this._ensureData()) return null;
    if (this._median === null) {
      const s   = this._getSorted();
      const mid = Math.floor(s.length / 2);
      this._median = s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
    }
    return this._median;
  }

  average() {
    if (!this._ensureData()) return null;
    if (this._mean === null) this._mean = this.data.reduce((a, b) => a + b, 0) / this.data.length;
    return this._mean;
  }

  trimmed_average(offset = 1) {
      if (!this._ensureData()) return null;

      if (this._trimmed === null) {
        const n = this.data.length;

        // not enough data to trim
        if (n <= offset * 2) {
          this._trimmed = this.average();
          return this._trimmed;
        }

        const sorted = this._getSorted();
        const trimmed = sorted.slice(offset, n - offset);

        this._trimmed =
          trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      }

      return this._trimmed;
    }

  weighted_average() {
    if (!this._ensureData()) return null;
    if (this._weighted === null) {
      const n       = this.data.length;
      const weights = Array.from({ length: n }, (_, i) => { const pos = n - 1 - i; return 1 - pos / (1 + pos); });
      const sumW    = weights.reduce((a, b) => a + b, 0);
      const norm    = weights.map(w => w / sumW);
      this._weighted = this.data.reduce((sum, val, i) => sum + val * norm[i], 0);
    }
    return this._weighted;
  }

  percentile(p) {
    if (!this._ensureData()) return null;
    const s   = this._getSorted();
    const idx = (p / 100) * (s.length - 1);
    const lo  = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return s[lo];
    return s[lo] * (1 - (idx - lo)) + s[hi] * (idx - lo);
  }

  iqr() {
    if (!this._ensureData()) return null;
    if (this._iqr === null) this._iqr = this.percentile(75) - this.percentile(25);
    return this._iqr;
  }

  range() {
    if (!this._ensureData()) return null;
    if (this._range === null) this._range = this.max() - this.min();
    return this._range;
  }

  variance() {
    if (!this._ensureData()) return null;
    if (this._variance === null) {
      const mean     = this.average();
      this._variance = this.data.reduce((a, x) => a + (x - mean) ** 2, 0) / this.data.length;
    }
    return this._variance;
  }

  std_dev() {
    if (!this._ensureData()) return null;
    if (this._std === null) this._std = Math.sqrt(this.variance());
    return this._std;
  }

  downside_deviation(target = 0) {
    if (!this._ensureData()) return null;
    if (this._downside === null) {
      const downs    = this.data.map(x => Math.min(0, x - target) ** 2);
      this._downside = Math.sqrt(downs.reduce((a, b) => a + b, 0) / downs.length);
    }
    return this._downside;
  }

  outlier_bounds() {
    const q1  = this.percentile(25), q3 = this.percentile(75);
    const iqr = q3 - q1;
    return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
  }

  outliers() {
    if (!this._ensureData()) return [];
    const { lower, upper } = this.outlier_bounds();
    return this.data.filter(x => x < lower || x > upper);
  }

  without_outliers() {
    if (!this._ensureData()) return [];
    const { lower, upper } = this.outlier_bounds();
    return this.data.filter(x => x >= lower && x <= upper);
  }

  avg_min_second_min() {
    if (!this._ensureData()) return null;
    if (this._avgMinSecondMin === null) {
      const b = this.second_min();
      this._avgMinSecondMin = b === null ? this.min() : (this.min() + b) / 2;
    }
    return this._avgMinSecondMin;
  }

  avg_max_second_max() {
    if (!this._ensureData()) return null;
    if (this._avgMaxSecondMax === null) {
      const b = this.second_max();
      this._avgMaxSecondMax = b === null ? this.max() : (this.max() + b) / 2;
    }
    return this._avgMaxSecondMax;
  }
}

// ================= BUSINESS =================
class Business {
  constructor(data) {
    this.code  = data._id;
    this._data = data;
  }

  get years()              { return this._years    ??= parseFinancialTableHTML(this._data.years); }
  get quarters()           { return this._quarters ??= parseFinancialTableHTML(this._data.quarters); }
  get roe()                { return this._roe      ??= new Statistic(this._get_row("ROE", "y")); }
  get pb()                 { return this._pb       ??= new Statistic(this._get_row("P/B")); }
  get lastBvps()           { const row = this._get_row("Book value per share (BVPS)"); return row[row.length - 1] ?? null; }
  get trimmed_average_pb() { return this.pb.trimmed_average(); }
  get min_pb()             { return this.pb.min(); }
  get pbValues()           { return [this.pb.min(),this.pb.trimmed_average(3)]; }
  get roeValues()          { return [this.roe.weighted_average().toFixed(2)]; }
  get roeClass()           { return this._roeClass ??= this._get_roe_class(); }
  get isBad()              { return this.roeClass == 'F'; }
  get roeStr() {
    return this._roeStr ??= [
      `Min: ${this.roe.min()}`,
      `Max: ${this.roe.max()}`,
      `Average: ${this.roe.average().toFixed(2)}`,
      `Median: ${this.roe.median().toFixed(2)}`,
      `Wtd. Avg: ${this.roe.weighted_average().toFixed(2)}`
    ].join("\n");
  }

  _get_row(metric, from = "q") {
    const source = from === "q" ? this.quarters : this.years;
    const row    = source.rows.find(item => item.title === metric);
    return row ? row.values : [];
  }

  _get_roe_class() {
    const { roe } = this;
    if (roe.min() <= 0)                                                                                        return "F";
    if (roe.average() < 10 || roe.median() < 10 || roe.trimmed_average() < 10 || roe.weighted_average() < 10) return "F";
    if (roe.min() < 10) return "D";
    if (roe.min() < 15) return "C";
    if (roe.min() < 20) return "B";
    if (roe.min() < 25) return "A";
    return "S";
  }

  get_yearly_roe()   { return new Statistic(this.years.rows.find(item => item.title === "ROE").values); }
  get_quarterly_pb() {
    console.log(this.code);
    if (this.code == "DSE") {
      console.log(this.quarters);
      console.log(this.years);
    }
    return new Statistic(this.quarters.rows.find(item => item.title === "P/B").values);
  }

  _stat_summary(stat) {
    return [
      stat.min(),
      stat.avg_min_second_min().toFixed(2),
      stat.second_min(),
      stat.second_max(),
      stat.avg_max_second_max().toFixed(2),
      stat.max(),
      stat.median().toFixed(2),
      stat.average().toFixed(2),
      stat.trimmed_average().toFixed(2),
      stat.weighted_average().toFixed(2)
    ].join(" - ");
  }

  get_pb()  { return this._stat_summary(this.get_quarterly_pb()); }
  get_roe() { return this._stat_summary(this.get_yearly_roe()); }
}

