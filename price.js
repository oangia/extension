document.addEventListener("DOMContentLoaded", () => {
    const refreshBtn = makeEl("button", { textContent: "Refresh" }, STYLES.refreshBtn);

    refreshBtn.onclick = async () => {
        setLoading(refreshBtn);
        browser.runtime.sendMessage({ type: "FETCH_STOCKS", force: true }, response => {
          console.log("THIS IS THE RESPONSE:", response);
        });
        setLoading(refreshBtn, false);
    };

    ui.addAction(refreshBtn);
});
function extractPriceData(el) {
  const table = getAllTables()[2];
  return [...table.rows].map(row => {
    return {
      symbol: row[0],
      value: row[11],
      ref: row[1]
    };
  });
}

function fetchStocks() {
  return new Promise(resolve => {
    browser.runtime.sendMessage({ type: "FETCH_STOCKS" }, ({ data }) => {
      console.log("THIS IS THE RESPONSE:", data);
      resolve(data);
    });
  });
}
// ================= MAIN =================
async function renderStockTable(el) {
  // extract data
  const data = extractTableData(2, {symbol: 0, ref: 1, price: 11});
  // create table
  const scrollBox = makeEl("div", {}, STYLES.scrollBox);
  const headers = ["Symbol", "Value", "Trimmed", "Wtd. Avg"];
  scrollBox.innerHTML = "<p>Look at trimmed p/b. Check weighted roe. </p>";
  const {table, tbody} = makeTable(headers[0], headers.slice(1), makeSorter(null));
  const sorter = makeSorter(tbody);
  table.querySelector("thead tr").querySelectorAll("th").forEach((th, i) => {
    th.onclick = () => sorter(i);
  });

  data.forEach(r => {
    const clean = r.symbol.trim().replace(/\*/g, "");
    const tr = document.createElement("tr");
    tr.id = "_" + clean;

    [makeSymbolLink(r.symbol), r.price || r.ref, "-", "-"].forEach(content => {
      tr.appendChild(makeCell(content));
    });
    tbody.appendChild(tr);
  });

  scrollBox.appendChild(table);

  ui.setContent(scrollBox);
  // Fetch and populate
  browser.runtime.sendMessage({ type: "FETCH_STOCKS" }, ({ data }) => {
    console.log("THIS IS THE RESPONSE:", data);
    const businesses = data.map((stock) => new Business(stock));
      businesses.forEach(business => {
        const tr = tbody.querySelector("#_" + business.code);
        if (! tr) return;
        const pb = (parseFloat(tr.children[1].textContent) * 1000) / business.lastBvps;
        const pbNum = pb.toFixed(2);
        const isUndervalued = pb / business.trimmed_average_pb < 0.5;

        const tdTrimmed = tr.children[2];
        const numTrimmed = Number(business.pbValues[1]);
        tdTrimmed.innerHTML = isNaN(numTrimmed) ? "-" : (pbNum / numTrimmed).toFixed(2);

        if (pb / business.pbValues[1] >= 1) {
        tr.children[2].innerHTML = `<span style="color:magenta;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else if (pb / business.pbValues[1] >= 0.7) {
        tr.children[2].innerHTML = `<span style="color:yellow;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        } else {
        tr.children[2].innerHTML = `<span style="color:#00c853;font-weight:600">${tdTrimmed.innerHTML}</span>`;
        }

        // Wtd. Avg columns (col 4+)
        business.roeValues.forEach((val, i) => {
        const td = tr.children[3 + i];
        const num = Number(val);
        td.textContent = isNaN(num) ? "-" : num.toFixed(2);
        });
        tr.setAttribute("data",
        [
          business.roe.min(),
          business.roe.max(),
          business.roe.average().toFixed(2),
          business.roe.weighted_average().toFixed(2),
          business.roeClass,
          business.pb.min(),
          business.pb.max(),
          business.pb.median(),
          business.pb.trimmed_average(2).toFixed(2),
          pbNum
        ].join("|"));
        tr.addEventListener("mouseenter", (e) => {
        const data = tr.getAttribute("data").split("|");
        tooltip.innerHTML = `
            <table>
        <thead>
        <tr>
        <th style="padding:4px"></th>
        <th style="padding:4px">Min</th>
        <th style="padding:4px">Max</th>
        <th style="padding:4px">Avg</th>
        <th style="padding:4px">W/T Avg</th>
        <th style="padding:4px">Note</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td style="padding:4px"><b>ROE</b></td>
        <td style="padding:4px">${data[0]}</td>
        <td style="padding:4px">${data[1]}</td>
        <td style="padding:4px">${data[2]}</td>
        <td style="padding:4px">${data[3]}</td>
        <td style="padding:4px">${data[4]}</td>
        </tr>
        <tr>
        <td style="padding:4px"><b>P/B</b></td>
        <td style="padding:4px">${data[5]}</td>
        <td style="padding:4px">${data[6]}</td>
        <td style="padding:4px">${data[7]}</td>
        <td style="padding:4px">${data[8]}</td>
        <td style="padding:4px">${data[9]}</td>
        </tr>
        </tbody>
        </table>
          `;

        tooltip.style.display = "block";
        });
        tr.addEventListener("mousemove", (e) => {
        tooltip.style.left = e.clientX + 12 + "px";
        tooltip.style.top = e.clientY + 12 + "px";
        });
        tr.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
        });
        tr.style.cssText += ";" + colorVal(business.roe.weighted_average());

        if (business.isBad) tr.style.cssText += ";" + colorVal(-1);
      });
      ui.renderContent();
  });
  
  
}
