document.addEventListener("keydown", (e) => {
  // avoid firing repeatedly when key is held down
  if (e.repeat) return;
  if (e.shiftKey && e.key.toLowerCase() === "f") {
    e.preventDefault(); // optional
    browser.runtime.sendMessage({ type: "FETCH_STOCKS", force: true });
    alert("Done");
  }
});
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
observe("#data-content-table-body", renderStockTable);
//observe("#banggia-khop-lenh", renderStockTable);
document.addEventListener("DOMContentLoaded", () => {
    const refreshBtn = makeEl("button", { textContent: "Refresh" }, STYLES.refreshBtn);
    refreshBtn.onclick = async () => {
        setLoading(refreshBtn);
        browser.runtime.sendMessage({ type: "FETCH_STOCKS", force: true }, response => {
          console.log("THIS IS THE RESPONSE:", response);
          setLoading(refreshBtn, false);
        });
    };
    ui.addAction(refreshBtn);
});

// ================= MAIN =================
async function renderStockTable(el) {
  // extract data
  const data = extractTableData(2, {symbol: 1, ref: 2, price: 2});
  //const data = extractTableData(2, {symbol: 0, ref: 1, price: 11});
  // create table
  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  const headers = ["Symbol", "Value", "Trimmed P/B"];
  scrollBox.innerHTML = "<p>Look at trimmed p/b. Check weighted roe. </p>";
  const {table, tbody} = makeTable(headers[0], headers.slice(1), makeSorter(null));
  const sorter = makeSorter(tbody);
  table.style.margin = "0 auto";
  table.querySelector("thead tr").querySelectorAll("th").forEach((th, i) => {
    th.onclick = () => sorter(i);
  });

  data.forEach(r => {
    const clean = r.symbol.trim().replace(/\*/g, "").split("\n")[0];
    const tr = document.createElement("tr");
    tr.id = "_" + clean;

    [makeSymbolLink(clean), r.price || r.ref, "-"].forEach(content => {
      tr.appendChild(makeCell(content));
    });
    tbody.appendChild(tr);
  });

  scrollBox.appendChild(table);

  ui.setContent(scrollBox);
  // Fetch and populate
  browser.runtime.sendMessage({ type: "FETCH_STOCKS" }, ({ data }) => {
    console.log("THIS IS THE RESPONSE:", data);
    const businesses = data.map(stock => new Business(stock));
    businesses.forEach(business => {
        const tr = tbody.querySelector("#_" + business.code);
        if (! tr) return;
        console.log(business);
        const price = (parseFloat(tr.children[1].textContent) * 1000);
        const pb = price / business.bvps;
        const pbNum = pb.toFixed(2);
        const isUndervalued = pb / business.pb.trimmed_average(3) < 0.5;

        const tdTrimmed = tr.children[2];
        const numTrimmed = Number(business.pb.trimmed_average(3));
        tdTrimmed.innerHTML = isNaN(numTrimmed) ? "-" : (pb / numTrimmed).toFixed(2);

        if (pb / business.pb.trimmed_average(3) >= 1) {
            tr.children[2].innerHTML = `<span style="color:magenta;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else if (pb / business.pb.trimmed_average(3) >= 0.66) {
            tr.children[2].innerHTML = `<span style="color:yellow;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else {
            tr.children[2].innerHTML = `<span style="color:#00c853;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        }

        tr.addEventListener("mouseenter", (e) => {
            const min = business.pb.min();
            const max = business.pb.max();
            const med = business.pb.median();
            const avg = business.pb.average();
            const tAvg = business.pb.trimmed_average(3);
            const wAvg = business.pb.weighted_average();

            const ratio = (x, threshold = 0.66) => {
              const v = pbNum / x;
              return `<td style="padding:4px; color:${v <= threshold ? 'green' : 'inherit'}">${v.toFixed(2)}</td>`;
            };

            ui.tooltip.innerHTML = `
            <table>
              <thead>
                <tr>
                  <th style="padding:4px"></th>
                  <th style="padding:4px">Curr</th>
                  <th style="padding:4px">Min</th>
                  <th style="padding:4px">Max</th>
                  <th style="padding:4px">Med</th>
                  <th style="padding:4px">Avg</th>
                  <th style="padding:4px">tAvg</th>
                  <th style="padding:4px">wAvg</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:4px"><b>P/B</b></td>
                  <td style="padding:4px">${pbNum}</td>
                  <td style="padding:4px">${min.toFixed(2)}</td>
                  <td style="padding:4px">${max.toFixed(2)}</td>
                  <td style="padding:4px">${med.toFixed(2)}</td>
                  <td style="padding:4px">${avg.toFixed(2)}</td>
                  <td style="padding:4px">${tAvg.toFixed(2)}</td>
                  <td style="padding:4px">${wAvg.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:4px"><b>%</b></td>
                  <td style="padding:4px">${pbNum}</td>
                  ${ratio(min, 1)}
                  ${ratio(max, 0)}
                  ${ratio(med)}
                  ${ratio(avg)}
                  ${ratio(tAvg)}
                  ${ratio(wAvg)}
                </tr>
              </tbody>
            </table>
            `;
            ui.tooltip.style.display = "block";
        });
        
      });
      ui.renderContent();
  });
  
  
}
