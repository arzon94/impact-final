let table = document.getElementById("dataTable"),
    _tr_ = document.createElement("tr"),
    _td_ = document.createElement("td"),
    _th_ = document.createElement("th");

export function createTable() {
    table.innerHTML = '';
    let tr = _tr_.cloneNode(false),
        headers = ["ID", "Filename", "Sync Version", "Date Modified", "Inputs", "Outputs"];
    for (const header of headers) {
        let th = _th_.cloneNode(false);
        th.appendChild(document.createTextNode(header));
        tr.appendChild(th);
    }
    table.appendChild(tr);
}
export function addTableRow(key, value) {
    let tr = _tr_.cloneNode(false),
        td = _td_.cloneNode(false);
    td.appendChild(document.createTextNode(key));
    tr.setAttribute("id", key);
    tr.appendChild(td);

    td = _td_.cloneNode(false);
    td.appendChild(document.createTextNode(value.detail.name));
    td.setAttribute("class", "filepath");
    tr.appendChild(td);

    td = _td_.cloneNode(false);
    td.appendChild(document.createTextNode(value.detail.syncVersion));
    tr.appendChild(td);

    td = _td_.cloneNode(false);
    td.appendChild(document.createTextNode(value.detail.modDate));
    tr.appendChild(td);

    td = _td_.cloneNode(false);
    let line = '';
    line += value.outputs.length;
    // value.outputs.forEach(edge => {
    //     line += edge + ", ";
    // });
    td.appendChild(document.createTextNode(line));
    td.setAttribute("class", "small");
    tr.appendChild(td);

    td = _td_.cloneNode(false);
    line = '';
    line += value.inputs.length;
    // value.inputs.forEach(edge => {
    //     line += edge + ", ";
    // });
    td.appendChild(document.createTextNode(line));
    td.setAttribute("class", "small");
    tr.appendChild(td);

    table.appendChild(tr);
}

export function exportCSV(graphMap, fileTitle) {
    let csv = "";
    csv += "Program ID, File Name, Sync Version, Modified Date, Size, Outputs, Inputs, \r\n";
    for (const [key, value] of graphMap.entries()) {
        let line = "";
        line += key + ", " + value.detail.name + ", " + value.detail.syncVersion + ", " + value.detail.modDate + ", " + value.detail.size + ", ";
        value.outputs.forEach(edge => {
            let path = graphMap.get(edge).detail.name;
            let lineItem = line + path + ", ";
            csv += lineItem + "\r\n";
        });
        line += ", ";
        value.inputs.forEach(input => {
            let path = graphMap.get(input).detail.name;
            let lineItem = line +  path + " ";
            csv += lineItem + "\r\n";
        });
    }
    let exportedFilename = "impactData.csv";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilename);
    } else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
            // feature detection Browsers that support HTML5 download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
