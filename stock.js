document.addEventListener("keydown", (e) => {
  // avoid firing repeatedly when key is held down
  if (e.repeat) return;
  if (e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault(); // optional
    const payload = extractPbs();
    const code = getStockCode();
    browser.runtime.sendMessage({ type: "SEND_STOCK", code, payload });
    alert("Done");
  }
});
observe("#div-content-BCTT", renderFinancialTable);
// ================= CONFIG =================

function renderTable({ headers, rows }, config) {
  const { table, tbody } = makeTable("Metric", headers);
  table.style.width = "100%";
  table.style.marginTop = "10px";

  config.forEach(({ key, label, colorRule, title }) => {
      const values = rows.find(r =>
        r.title.trim().toLowerCase() === key
      )?.values ?? [];

      const tr = document.createElement("tr");
      tr.appendChild(makeEl("td", { textContent: label }));

      values.forEach((v, i) => {
        const num = parseFloat(
          String(v).replace("%", "").replace(/,/g, "").trim()
        );

        const td = makeEl("td", { textContent: v });

        if (Array.isArray(title) && title[i] != null) {
          td.title = title[i];
        }

        if (colorRule) {
          td.style.color = colorByRule(num, colorRule);
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  return table;
}

function renderFinancialTable(el) {
  // 1. Equity: growth, high roe
  // 2. Cost / Debt: control
  // 3. Cash: not low
  // 4. Receivables, inventories: control
  // 5. 
  // ideal business high return on equity over time, and keep that high return on equity in an increamental capital
  const data = extractStockData(el);

  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  scrollBox.className = "scroll-box";
  
  // high return on equity, and increase equity
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.maxWidth = "1000px";
  canvas.style.maxHeight = "500px";
  canvas.style.margin = "auto 0";
  

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
      data: {
        labels: data.headers,
        datasets: [
          {
            label: "ROE",
            type: "bar",
            data:
              data.rows.find(r =>
                r.title.trim().toLowerCase() === "roe"
              )?.values ?? [],
            yAxisID: "y",
            borderWidth: 1
          },
          {
            label: "Equity",
            type: "line",
            data:
              data.rows.find(r =>
                r.title.trim().toLowerCase() === "owner's equity"
              )?.values ?? [],
            yAxisID: "y1",
            borderWidth: 2,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        scales: {
          y: {
            type: "linear",
            position: "left",
            max: 100
          },
          y1: {
            type: "linear",
            position: "right",
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          legend: { display: true }
        }
      }
    });
    
const equityRow = data.rows.find(
  r => r.title.trim().toLowerCase() === "owner's equity"
);

const equity = equityRow?.values ?? [];

const equityGrowthPct = equity.map((v, i, arr) =>
  i === 0 ? 0 : (((v - arr[i - 1]) / arr[i - 1]) * 100).toFixed(2)
);

data.rows.push({
  title: "equity growth",
  values: equityGrowthPct
});

const getRow = (name) =>
  data.rows.find(r => r.title.trim().toLowerCase() === name)?.values ?? [];

const gp = getRow("gross profit");
const sga = getRow("selling expenses");
const fe = getRow("financial expenses");
const ga = getRow("general and administrative expenses");

const expenseRatio = (exp) =>
  exp.map((v, i, arr) => gp[i] ? ((v / gp[i]) * 100).toFixed(0) : 0);

data.rows.push(
  {
    title: "financial expense margin",
    values: expenseRatio(fe)
  },
  {
    title: "selling expense margin",
    values: expenseRatio(sga)
  },
  {
    title: "g&a expense margin",
    values: expenseRatio(ga)
  }
);

const revenue = getRow("net revenue");

const grossRatio = gp.map((v, i, arr) => revenue[i] ? ((v / revenue[i]) * 100).toFixed(0) : 0);

data.rows.push({
  title: "gross profit margin 2",
  values: grossRatio
});

function ratioRow(rowName) {
  const row = getRow(rowName);

  return row.map((v, i) =>
    equity[i] ? ((v / equity[i]) * 100).toFixed(0) : 0
  );
}

const pbt = getRow("profit before tax");
const npat = getRow("net profit after tax");

const taxRate = pbt.map((v, i) =>
  v ? (((v - npat[i]) / v) * 100).toFixed(0) : 0
);

data.rows.push({
  title: "tax rate",
  values: taxRate
});



  scrollBox.appendChild(canvas);
  

const operatingProfit = getRow("operating profit");
const financialIncome = getRow("financial income");

const financialIncomePct = financialIncome.map((v, i) =>
  operatingProfit[i]
    ? ((v / operatingProfit[i]) * 100).toFixed(0)
    : 0
);

data.rows.push({
  title: "financial income margin",
  values: financialIncomePct
});

  
  const netProfit = getRow("net profit after tax");
const parentProfit = getRow("profit after tax for shareholders of the parent company");

const minorityShare = netProfit.map((v, i) =>
  v ? (((v - parentProfit[i]) / v) * 100).toFixed(0) : 0
);

data.rows.push({
  title: "minority interest share",
  values: minorityShare
});
  
    
data.rows.push(
  { title: "cash margin", values: ratioRow("cash and cash equivalents") },
  { title: "short-term investments margin", values: ratioRow("short-term investments") },
  { title: "receivables margin", values: ratioRow("short-term receivables") },
  { title: "inventories margin", values: ratioRow("inventories") },
  { title: "other current assets margin", values: ratioRow("other current assets") },
  { title: "fixed assets margin", values: ratioRow("fixed assets") },
  { title: "investment properties margin", values: ratioRow("investment properties") },
  { title: "long-term investments margin", values: ratioRow("long-term investments") },
  { title: "short -term liabilities margin", values: ratioRow("short -term liabilities") },
  { title: "long-term liabilities margin", values: ratioRow("long-term liabilities") },
  { title: "charter capital margin", values: ratioRow("charter capital") },
  { title: "retained earnings margin", values: ratioRow("retained earnings") }
);
  scrollBox.appendChild(renderTable(data, [
  { key: "owner's equity", label: "Equity"},
  { key: "equity growth", label: "Equity growth (%)",
    colorRule: { threshold: 0, high: "green", low: "red" }},
  {
    key: "charter capital margin", label: "Charter capital (%)"
  },
  {
    key: "retained earnings margin", label: "Retained earnings (%)"
  },
  {
    key: "short -term liabilities margin", label: "Short -term liabilities (%)"
  },
  {
    key: "long-term liabilities margin", label: "Long-term liabilities (%)"
  },
  
  
  { key: "cash margin", label: "Cash (%)"},
  { key: "short-term investments margin",                  label: "Short-term investment (%)"
  },
  {
    key: "receivables margin", label: "Receivables (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "inventories margin", label: "Inventories (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "other current assets margin", label: "Other assets(%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "fixed assets margin", label: "Fixed assets (%)"
  },
  {
    key: "investment properties margin", label: "Investment properties (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  },
  {
    key: "long-term investments margin", label: "Long-term investments (%)",
    colorRule: { threshold: 10, high: "red", low: "green" }
  }
]));

scrollBox.appendChild(renderTable(data, [
    { key: "net revenue", label: "Net revenue"},
    { key: "gross profit margin 2", label: "Gross profit (%)", title: gp},
    { key: "financial expense margin", label: "Financial expenses (%)",
      colorRule: { threshold: 10, high: "red", low: "green" }},
    { key: "selling expense margin", label: "Selling expenses (%)"},
    { key: "g&a expense margin", label: "G&A expenses (%)",
      colorRule: { threshold: 10, high: "red", low: "green" }},
    { key: "operating profit", label: "Operating profit"},
    { key: "financial income margin", label: "Financial income (%)",
      colorRule: { threshold: 10, high: "red", low: "green" }},
    {key: "other profit", label : "Other profit",
      colorRule: { threshold: 5, high: "red", low: "green" }},
      {key: "profit/loss of investments in associates and joint ventures", label : "Associates and joint ventures",
      colorRule: { threshold: 5, high: "red", low: "green" }},
      {key: "tax rate", label : "Tax rate"},
      {key: "minority interest share", label : "Minority share",
      colorRule: { threshold: 5, high: "red", low: "green" }}
  ]));
 
  ui.setContent(scrollBox);
}

