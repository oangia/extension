function extractPbs() {
  const tables = getAllTables();
  const pb = tables[7].rows[12].slice(4);
  const bvps = tables[7].rows[8].at(-1);
  return { pb, bvps }
}

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
        values: tds.slice(4).map(toNumber)
      });
    });
  });
  
  return { headers, rows };
}
