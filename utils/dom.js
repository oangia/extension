function extractTableData(tableIndex, columnsMap) {
  const table = getAllTables()[tableIndex];
  if (!table) return [];

  return table.rows.map(row => {
    const obj = {};

    for (const [key, colIndex] of Object.entries(columnsMap)) {
      obj[key] = row[colIndex] ?? null;
    }

    return obj;
  });
}

function getAllTables({ mode = "text" } = {}) {
  const getCellContent = cell =>
    mode === "html"
      ? cell.innerHTML.trim()
      : cell.innerText.trim();

  const getRow = tr =>
    Array.from(tr.querySelectorAll("td, th")).map(getCellContent);

  return Array.from(document.body.querySelectorAll("table")).map(table => {
    const headerRow =
      table.querySelector("thead tr") ||
      table.querySelector("tr");

    const headers = headerRow ? getRow(headerRow) : [];

    const bodyRows = table.querySelectorAll("tbody tr");

    const rows = (bodyRows.length
      ? Array.from(bodyRows)
      : Array.from(table.querySelectorAll("tr")).slice(1)
    ).map(getRow);

    return { headers, rows };
  });
}

function getAllLinks() {
  return Array.from(document.body.querySelectorAll("a"))
    .map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }))
    .filter(link => link.href); // remove empty
}

function getAllImageUrls() {
  return Array.from(document.body.querySelectorAll("img"))
    .map(img => img.src)
    .filter(src => src); // remove empty
}
