document.addEventListener("DOMContentLoaded", () => {
    ui.addAction(makeActionButton("Send Years", "years", () => document.getElementById("finance").innerHTML));
    ui.addAction(makeActionButton("Send Quarter", "quarters", () => document.getElementById("finance").innerHTML, { marginLeft: "10px" }));
});
// extract.js
function extractStockData(el) {
  const tables = el.querySelectorAll("table");
  if (!tables.length) return null;

  const headers = [...tables[0].querySelectorAll("thead th")]
    .map(th => th.textContent.trim())
    .slice(4);

  const rows = [];

  tables.forEach(table => {
    const trs = table.querySelectorAll("tr[data-row-type='reportnormId']");

    trs.forEach(tr => {
      const tds = [...tr.querySelectorAll("td")].map(td =>
        td.textContent.trim()
      );

      if (tds.length < 4) return;

      rows.push({
        title: tds[0],
        values: tds.slice(4)
      });
    });
  });
  
  return { headers, rows };
}
// ================= CONFIG =================
const ROW_CONFIGS = [
  { key: "roe",                  label: "ROE" },
  { key: "profit after tax for shareholders of the parent company",       label: "Profit" },
  { key: "owner's equity",       label: "Equity" },
  {
    key: "liabilities to assets", label: "Liabilities to assets",
    colorRule: { threshold: 50, high: "red", low: "green" }
  }
];
function buildChartData(headers, rows) {
  return {
    labels: headers,
    datasets: ROW_CONFIGS.map(({ key, label }) => {
      const values = rows.find(r =>
        r.title.trim().toLowerCase() === key
      )?.values ?? [];

      return {
        label,
        data: values.map(v =>
          parseFloat(String(v).replace("%", "").replace(/,/g, "").trim())
        ),
        borderWidth: 2,
        fill: false
      };
    })
  };
}

function renderSummaryTable({ headers, rows }) {
  // wrapper to hold both
  const wrapper = document.createElement("div");
 

  // --- CHART ---
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.maxWidth = "1000px";
  canvas.style.maxHeight = "500px";
  canvas.style.margin = "auto 0";
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const data = buildChartData(headers, rows);

  new Chart(ctx, {
    type: "line",
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });

  // --- TABLE ---
  const { table, tbody } = makeTable("Metric", headers);
  table.style.width = "100%";

  ROW_CONFIGS.forEach(({ key, label, colorRule }) => {
    const values = rows.find(r =>
      r.title.trim().toLowerCase() === key
    )?.values ?? [];

    const tr = document.createElement("tr");
    tr.appendChild(makeEl("td", { textContent: label }));

    values.forEach(v => {
      const num = parseFloat(String(v).replace("%", "").replace(/,/g, "").trim());
      const td = makeEl("td", { textContent: v });
      if (colorRule) td.style.color = colorByRule(num, colorRule);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  wrapper.appendChild(table);

  return wrapper;
}

function renderRawTable({ headers, rows }) {
  const { table, tbody } = makeTable("Title", headers);

  rows.forEach(({ title, values }) => {
    const tr = document.createElement("tr");
    tr.appendChild(makeEl("td", { textContent: title }));
    values.forEach(v => tr.appendChild(makeEl("td", { textContent: v })));
    tbody.appendChild(tr);
  });

  return table;
}

// ================= MAIN =================
function makeActionButton(label, payloadKey, getPayload, extraStyles = {}) {
  const btn = makeEl("button", { textContent: label }, { ...STYLES.actionBtn, ...extraStyles });

  btn.onclick = async () => {
    setLoading(btn, true, "⏳ Sending...");
    const payload = { [payloadKey]: getPayload() };
    const code = getStockCode();
    browser.runtime.sendMessage({ type: "SEND_STOCK", code, payload });
    setLoading(btn, false);
  };

  return btn;
}

function renderFinancialTable(el) {
  // ideal business high return on equity over time, and keep that high return on equity in an increamental capital
  // roe, profit, equity
  const data = extractStockData(el);
  console.log(data);
  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  scrollBox.id = "finance";
  scrollBox.className = "scroll-box";
  scrollBox.appendChild(renderSummaryTable(data));
  
  scrollBox.appendChild(renderRawTable(data));

  ui.setContent(scrollBox);
}
