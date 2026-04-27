const tooltip = document.createElement("div");
const STYLES = {
  table: {
    minWidth: "600px", borderCollapse: "separate",
    borderSpacing: "0", background: "#121826", color: "#e6e6e6", fontSize: "13px"
  },
  th: {
    padding: "5px", textAlign: "center", borderBottom: "1px solid #2a3548",
    background: "#141a26", position: "sticky", top: "0", zIndex: "5", cursor: "pointer"
  },
  td:         { padding: "5px", textAlign: "center", borderBottom: "1px solid #1f2a3a" },
  scrollBox:  { width: "100%", height: "100%", overflow: "auto" },
  refreshBtn: {
    padding: "6px 10px", background: "#1f2a3a", color: "#fff",
    border: "1px solid #2a3548", cursor: "pointer"
  },
  actionBtn: {
    padding: "8px 12px", background: "#1f2635",
    color: "#e6e6e6", border: "1px solid #2a3548", borderRadius: "6px", cursor: "pointer"
  }
};

document.addEventListener("DOMContentLoaded", () => {
    Object.assign(tooltip.style, {
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
    const style = document.createElement("style");
    style.textContent = `
      tr:hover td {
        background: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(tooltip);
});
const ui = new OverlayUI();
observe("#div-content-BCTT", renderFinancialTable);
observe("#banggia-khop-lenh", renderStockTable);
