function observe(e,n){let t=null;new MutationObserver(()=>{const r=document.querySelector(e);r&&r.innerHTML!==t&&(t=r.innerHTML,n(r))}).observe(document,{childList:!0,subtree:!0})}

// ================= OVERLAY =================
class OverlayUI {
  constructor() {
    this.overlay   = null;
    this.container = null;
    this.actionsEl = null;

    this.isOpen = false;

    // state (deferred render)
    this._actions = [];
    this._content = null;
    this.tooltip = document.createElement("div");
    Object.assign(this.tooltip.style, {
      position: "fixed",
      background: "#1f2635",
      color: "#e6e6e6",
      border: "1px solid #2a3548",
      borderRadius: "6px",
      padding: "8px",
      fontSize: "12px",
      pointerEvents: "none",
      zIndex: 999999,
      display: "none",
      whiteSpace: "normal"
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") this.toggle();
    });
  }

  init() {
    if (this.overlay) return;

    this.overlay = makeEl("div", {}, {
      position: "fixed", inset: "0", zIndex: "10000",
      display: "none", flexDirection: "column",
      background: "#0b0e14", color: "#e6e6e6"
    });

    const topBar = makeEl("div", {}, {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 14px", background: "#141a26", borderBottom: "1px solid #222b3a"
    });

    this.actionsEl = makeEl("div", {}, {
      display: "flex", gap: "8px", alignItems: "center"
    });

    topBar.append(
      makeEl("div", { textContent: "Preview" }, { fontWeight: "600" }),
      this.actionsEl
    );

    this.container = makeEl("div", {}, {
      flex: "1", overflow: "auto", padding: "16px"
    });

    this.overlay.append(topBar, this.container);
    this.renderActions();
    document.body.appendChild(this.overlay);
    const style = document.createElement("style");
    style.textContent = `
      tr:hover td {
        background: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(this.tooltip);
    document.addEventListener("mousemove", (e) => {
            this.tooltip.style.left = e.clientX + 12 + "px";
            this.tooltip.style.top = e.clientY + 12 + "px";
        });
        document.addEventListener("mouseleave", () => {
            this.tooltip.style.display = "none";
        });
  }

  // ---------- state setters ----------
  setContent(node) {
    this._content = node;
  }

  addAction(btn, { prepend = false } = {}) {
    if (prepend) this._actions.unshift(btn);
    else this._actions.push(btn);
  }

  renderActions() {
    this.actionsEl.innerHTML = "";
    this._actions.forEach(btn => this.actionsEl.appendChild(btn));
  }

  renderContent() {
    this.init();
    this.container.innerHTML = "";

    if (this._content) {
      this.container.appendChild(this._content);
      return;
    }

    this.container.innerHTML = "No data";
  }

  // ---------- controls ----------
  open() {
    if (!this.overlay) this.init();
    this.overlay.style.display = "flex";
    this.isOpen = true;
    this.renderContent();
  }

  close() {
    this.overlay.style.display = "none";
    this.isOpen = false;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}
const ui = new OverlayUI();

// ================= UTILS =================
function getStockCode() {
  return (location.pathname.split("/")[1] || "").replace(/\*/g, "");
}

function toNumber(str) {
  if (!str) return 0;
  const num = Number(str.replace(/,/g, "").replace(/\s/g, ""));
  return isNaN(num) ? 0 : num;
}

function colorVal(x) {
  if (x >= 30) return "background-color: rgba(22, 101, 52, 0.5)";
  if (x >= 25) return "background-color: rgba(63, 98, 18, 0.5)";
  if (x >= 20) return "background-color: rgba(15, 118, 110, 0.5)";
  if (x >= 15) return "background-color: rgba(133, 77, 14, 0.5)";
  if (x >= 10) return "background-color: rgba(154, 52, 18, 0.5)";
  if (x >= 0)  return "background-color: rgba(127, 29, 29, 0.5)";
  return "background-color: rgba(0, 0, 0, 0.5); color: #fecaca";
}

// ================= DOM HELPERS =================
function makeEl(tag, props = {}, styles = {}) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  Object.assign(node.style, styles);
  return node;
}

function makeCell(content, styles = {}) {
  const td = makeEl("td", {}, { ...STYLES.td, ...styles });
  if (content instanceof Node) td.appendChild(content);
  else td.textContent = content ?? "-";
  return td;
}

function makeSymbolLink(symbol) {
  const clean = symbol.trim().replace(/\*/g, "");
  return makeEl("a", {
    textContent: symbol,
    target: "_blank",
    href: `https://finance.vietstock.vn/${clean}/financials.htm?tab=BCTT`
  });
}

function makeHeaderRow(firstLabel, headers, onSort) {
  const tr = document.createElement("tr");
  [firstLabel, ...headers].forEach((text, index) => {
    const th = makeEl("th", { textContent: text }, STYLES.th);
    if (onSort) th.onclick = () => onSort(index);
    tr.appendChild(th);
  });
  return tr;
}

function makeTable(firstLabel, headers, onSort) {
  const table = makeEl("table", {}, STYLES.table);
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  thead.appendChild(makeHeaderRow(firstLabel, headers, onSort));
  table.append(thead, tbody);
  return { table, tbody };
}

// ================= SORT =================
function makeSorter(tbody) {
  let sortDir   = 1;
  let lastIndex = -1;

  return (index) => {
    sortDir   = lastIndex === index ? -sortDir : 1;
    lastIndex = index;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.sort((a, b) => {
      const A    = a.children[index]?.textContent?.replace(/,/g, "").trim() || "";
      const B    = b.children[index]?.textContent?.replace(/,/g, "").trim() || "";
      const aNum = parseFloat(A), bNum = parseFloat(B);
      return (!isNaN(aNum) && !isNaN(bNum)) ? (aNum - bNum) * sortDir : A.localeCompare(B) * sortDir;
    });
    rows.forEach(r => tbody.appendChild(r));
  };
}

// ================= LOADING =================
function setLoading(btn, isLoading = true, text = "Processing...") {
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent          = text;
    btn.disabled             = true;
    btn.style.opacity        = "0.6";
    btn.style.cursor         = "not-allowed";
  } else {
    btn.textContent   = btn.dataset.originalText;
    btn.disabled      = false;
    btn.style.opacity = "1";
    btn.style.cursor  = "pointer";
  }
}
// ================= COLOR =================
function colorByRule(num, rule) {
  if (isNaN(num) || !rule) return "";
  return num >= rule.threshold ? rule.high : rule.low;
}


