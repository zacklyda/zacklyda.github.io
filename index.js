let portalCounter = 0;
const STORAGE_KEY = "mc_portal_matrix_data";

const defaultSamples = [
    { name: "Spawn", dimension: "overworld", x: 0, y: 64, z: 0 },
    { name: "Iron Farm", dimension: "overworld", x: 800, y: 70, z: -1200 },
    { name: "Villager Breeder", dimension: "overworld", x: 120, y: 64, z: -200 },
    { name: "Nether Hub", dimension: "nether", x: 0, y: 120, z: 0 },
    { name: "Iron Farm", dimension: "nether", x: 100, y: 60, z: -150 },
    { name: "Villager Breeder", dimension: "nether", x: 95, y: 72, z: -145 }
];

const collapsedRows = [];
const collapsedCols = [];

function getCollapseIcon(isCollapsed) {
    return isCollapsed ? '▾' : '▸';
}

function toggleRow(rowIndex) {
    const position = collapsedRows.indexOf(rowIndex);
    if (position === -1) {
        collapsedRows.push(rowIndex);
    } else {
        collapsedRows.splice(position, 1);
    }
    generateMatrix();
}

function toggleColumn(colIndex) {
    const position = collapsedCols.indexOf(colIndex);
    if (position === -1) {
        collapsedCols.push(colIndex);
    } else {
        collapsedCols.splice(position, 1);
    }
    generateMatrix();
}

function toggleRegistryPanel() {
    const panel = document.getElementById('input-panel');
    const latch = document.getElementById('toggle-latch');
    panel.classList.toggle('collapsed');
    if (panel.classList.contains('collapsed')) {
        latch.innerText = "▶";
        latch.title = "Expand Registry Panel";
    } else {
        latch.innerText = "◀";
        latch.title = "Collapse Registry Panel";
    }
}

function handleDataChange() {
    saveDataToStorage();
    generateMatrix();
}

function getRegistryArray() {
    const items = document.getElementsByClassName('portal-item');
    let portalDataArray = [];
    for (let item of items) {
        portalDataArray.push({
            name: item.querySelector('.p-name').value.replace(/,/g, ''),
            dimension: item.querySelector('.p-dimension').value,
            x: parseFloat(item.querySelector('.p-x').value) || 0,
            y: parseFloat(item.querySelector('.p-y').value) || 0,
            z: parseFloat(item.querySelector('.p-z').value) || 0
        });
    }
    return portalDataArray;
}

function saveDataToStorage() {
    const data = getRegistryArray();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadDataFromStorage() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
        try { return JSON.parse(rawData); } catch (e) { return defaultSamples; }
    }
    return defaultSamples;
}

function exportToPortalFile() {
    const portals = getRegistryArray();
    if (portals.length === 0) {
        alert("The Portal Registry is empty. There is nothing to export.");
        return;
    }
    let csvContent = "name,dimension,x,y,z\n";
    portals.forEach(p => {
        csvContent += `${p.name},${p.dimension},${p.x},${p.y},${p.z}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "minecraft_portals.portal");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function attachScrollIncrementer(inputEl) {
    inputEl.addEventListener('wheel', function(event) {
        event.preventDefault();
        const step = parseInt(this.getAttribute('step')) || 1;
        let currentValue = parseFloat(this.value) || 0;
        if (event.deltaY < 0) {
            this.value = currentValue + step;
        } else {
            this.value = currentValue - step;
        }
        handleDataChange();
    }, { passive: false });
}

function importFromPortalFile(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        let importedPortals = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const columns = line.split(",");
            if (columns.length >= 5) {
                importedPortals.push({
                    name: columns[0],
                    dimension: columns[1],
                    x: parseFloat(columns[2]) || 0,
                    y: parseFloat(columns[3]) || 0,
                    z: parseFloat(columns[4]) || 0
                });
            }
        }
        if (importedPortals.length === 0) {
            alert("Invalid or empty .portal file structural layout.");
            return;
        }
        document.getElementById('portal-list').innerHTML = '';
        importedPortals.forEach(p => addPortalRow(p));
        handleDataChange();
        inputEl.value = "";
    };
    reader.readAsText(file);
}

function addPortalRow(data = null) {
    portalCounter++;
    const list = document.getElementById('portal-list');
    const div = document.createElement('div');
    div.className = `portal-item ${data && data.dimension === 'nether' ? 'nether-type' : ''}`;
    div.id = `portal-card-${portalCounter}`;
    div.innerHTML = `
                <button class="remove-btn" onclick="removePortal(${portalCounter})">×</button>
                <div class="form-row">
                    <div class="form-group-inline" style="flex: 1.3;">
                        <label>Portal Name</label>
                        <input type="text" class="p-name" value="${data ? data.name : 'Portal ' + portalCounter}" required>
                    </div>
                    <div class="form-group-inline" style="flex: 1;">
                        <label>Dimension</label>
                        <select class="p-dimension" onchange="updateCardTheme(this, ${portalCounter})">
                            <option value="overworld" ${data && data.dimension === 'overworld' ? 'selected' : ''}>Overworld</option>
                            <option value="nether" ${data && data.dimension === 'nether' ? 'selected' : ''}>Nether</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group-inline">
                        <label>Coord X</label>
                        <input type="number" class="p-x" value="${data ? data.x : 0}" step="1" required>
                    </div>
                    <div class="form-group-inline">
                        <label>Coord Y</label>
                        <input type="number" class="p-y" value="${data ? data.y : 64}" step="1" required>
                    </div>
                    <div class="form-group-inline">
                        <label>Coord Z</label>
                        <input type="number" class="p-z" value="${data ? data.z : 0}" step="1" required>
                    </div>
                </div>
            `;
    list.appendChild(div);
    attachScrollIncrementer(div.querySelector('.p-x'));
    attachScrollIncrementer(div.querySelector('.p-y'));
    attachScrollIncrementer(div.querySelector('.p-z'));
    list.scrollTop = list.scrollHeight;
    if (!data) handleDataChange();
}

function removePortal(id) {
    const card = document.getElementById(`portal-card-${id}`);
    if (card) {
        card.remove();
        handleDataChange();
    }
}

function updateCardTheme(selectEl, id) {
    const card = document.getElementById(`portal-card-${id}`);
    if (selectEl.value === 'nether') {
        card.classList.add('nether-type');
    } else {
        card.classList.remove('nether-type');
    }
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    const items = document.getElementsByClassName('portal-item');
    let overworldPortals = [];
    let netherPortals = [];
    for (let item of items) {
        const name = item.querySelector('.p-name').value || "Unnamed";
        const dimension = item.querySelector('.p-dimension').value;
        const x = parseFloat(item.querySelector('.p-x').value) || 0;
        const y = parseFloat(item.querySelector('.p-y').value) || 0;
        const z = parseFloat(item.querySelector('.p-z').value) || 0;
        const portalObj = { name, x, y, z };
        if (dimension === 'overworld') {
            overworldPortals.push(portalObj);
        } else {
            netherPortals.push(portalObj);
        }
    }
    if (overworldPortals.length === 0 || netherPortals.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        To build a matrix, you need at least <strong>one Overworld portal</strong> and <strong>one Nether portal</strong>.
                    </div>`;
        return;
    }
    let netEnterDist = [];
    let owEnterDist = [];
    let tooFarNetEnter = [];
    let tooFarOWEnter = [];
    let rowMinimaIndices = new Array(overworldPortals.length).fill(null);
    let colMinimaIndices = new Array(netherPortals.length).fill(null);
    for (let r = 0; r < overworldPortals.length; r++) {
        netEnterDist[r] = [];
        owEnterDist[r] = [];
        tooFarNetEnter[r] = [];
        tooFarOWEnter[r] = [];
        for (let c = 0; c < netherPortals.length; c++) {
            const op = overworldPortals[r];
            const np = netherPortals[c];
            const dx_net2ow = op.x - (np.x * 8);
            const dz_net2ow = op.z - (np.z * 8);
            const dy_net2ow = op.y - np.y;
            const dist2d_net2ow = Math.sqrt(dx_net2ow * dx_net2ow + dz_net2ow * dz_net2ow);
            const total3d_net2ow = Math.sqrt(dx_net2ow * dx_net2ow + dy_net2ow * dy_net2ow + dz_net2ow * dz_net2ow);
            const opNetX = Math.floor(op.x / 8);
            const opNetZ = Math.floor(op.z / 8);
            const dx_ow2net = opNetX - np.x;
            const dz_ow2net = opNetZ - np.z;
            const dy_ow2net = op.y - np.y;
            const dist2d_ow2net = Math.sqrt(dx_ow2net * dx_ow2net + dz_ow2net * dz_ow2net);
            const total3d_ow2net = Math.sqrt(dx_ow2net * dx_ow2net + dy_ow2net * dy_ow2net + dz_ow2net * dz_ow2net);
            netEnterDist[r][c] = total3d_net2ow;
            owEnterDist[r][c] = total3d_ow2net;
            tooFarNetEnter[r][c] = dist2d_net2ow > 128;
            tooFarOWEnter[r][c] = dist2d_ow2net > 128;
        }
    }
    for (let r = 0; r < overworldPortals.length; r++) {
        let minVal = Infinity;
        for (let c = 0; c < netherPortals.length; c++) {
            if (!tooFarOWEnter[r][c] && !tooFarNetEnter[r][c]) {
                if (owEnterDist[r][c] < minVal) {
                    minVal = owEnterDist[r][c];
                    rowMinimaIndices[r] = c;
                }
            }
        }
    }
    for (let c = 0; c < netherPortals.length; c++) {
        let minVal = Infinity;
        for (let r = 0; r < overworldPortals.length; r++) {
            if (!tooFarNetEnter[r][c] && !tooFarOWEnter[r][c]) {
                if (netEnterDist[r][c] < minVal) {
                    minVal = netEnterDist[r][c];
                    colMinimaIndices[c] = r;
                }
            }
        }
    }
    let tableHTML = '<table>';
    tableHTML += '<thead><tr><th>Overworld \\ Nether (Unscaled)</th>';
    netherPortals.forEach((np, c) => {
        const colCollapsed = collapsedCols.includes(c);
        tableHTML += `<th class="${colCollapsed ? 'collapsed-cell' : ''}"><button class="toggle-collapse-btn ${colCollapsed ? 'collapsed' : ''}" onclick="toggleColumn(${c})" title="${colCollapsed ? 'Expand' : 'Collapse'} column">${getCollapseIcon(colCollapsed)}</button>${np.name}<span class="portal-subtext">Nether: (${np.x}, ${np.y}, ${np.z})</span><span class="portal-subtext" style="color: #b5cea8;">OW Equiv: (${np.x * 8}, ${np.y}, ${np.z * 8})</span></th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    for (let r = 0; r < overworldPortals.length; r++) {
        const op = overworldPortals[r];
        const rowCollapsed = collapsedRows.includes(r);
        tableHTML += `<tr><th class="${rowCollapsed ? 'collapsed-cell' : ''}"><button class="toggle-collapse-btn ${rowCollapsed ? 'collapsed' : ''}" onclick="toggleRow(${r})" title="${rowCollapsed ? 'Expand' : 'Collapse'} row">${getCollapseIcon(rowCollapsed)}</button>${op.name}<span class="portal-subtext">(${op.x}, ${op.y}, ${op.z})</span></th>`;
        for (let c = 0; c < netherPortals.length; c++) {
            const netDist = netEnterDist[r][c].toFixed(1);
            const owDist = owEnterDist[r][c].toFixed(1);
            const cellCollapsed = rowCollapsed || collapsedCols.includes(c);
            const tooFarNet = tooFarNetEnter[r][c];
            const tooFarOW = tooFarOWEnter[r][c];
            let cellClasses = [];
            let innerDecorations = '';
            let extraClasses = '';
            const isRowMin = (rowMinimaIndices[r] === c);
            const isColMin = (colMinimaIndices[c] === r);
            if (!tooFarNet && !tooFarOW) {
                if (isRowMin && isColMin) {
                    extraClasses = 'outline-green';
                    innerDecorations += '<div class="tri-row-min"></div><div class="tri-col-min"></div>';
                } else if (isRowMin || isColMin) {
                    extraClasses = 'outline-yellow';
                    if (isRowMin) innerDecorations += '<div class="tri-row-min"></div>';
                    if (isColMin) innerDecorations += '<div class="tri-col-min"></div>';
                }
            } else {
                if (isRowMin || isColMin) extraClasses = 'outline-yellow';
            }
            if (extraClasses) cellClasses.push(extraClasses);
            if (cellCollapsed) cellClasses.push('collapsed-cell');
            let netSpan = '';
            let owSpan = '';
            if (!cellCollapsed) {
                const cellTooFar = tooFarNet || tooFarOW;
                let netClass = 'num';
                let owClass = 'num';
                if (cellTooFar) {
                    netClass += ' number-muted';
                    owClass += ' number-muted';
                } else {
                    if (isRowMin && isColMin) {
                        netClass += ' number-highlight-green';
                        owClass += ' number-highlight-green';
                    } else {
                        if (isColMin) netClass += ' number-highlight-yellow';
                        if (isRowMin) owClass += ' number-highlight-yellow';
                    }
                }
                netSpan = `<div><span class="${netClass}">${netDist}</span> <span style="font-size:0.75rem;color:#888;margin-left:6px;">(net→ow)</span></div>`;
                owSpan = `<div style="margin-top:4px;"><span class="${owClass}">${owDist}</span> <span style="font-size:0.75rem;color:#888;margin-left:6px;">(ow→net)</span></div>`;
            }
            const isTooAny = (tooFarNet || tooFarOW);
            let tooFarCaption = '';
            if (isTooAny && !cellCollapsed) {
                tooFarCaption = `<div class="number-muted" style="margin-top:4px;">too far away</div>`;
            }
            tableHTML += `<td class="${cellClasses.join(' ')}" style="vertical-align: middle;">${netSpan}${innerDecorations}${owSpan}${tooFarCaption}</td>`;
        }
        tableHTML += `</tr>`;
    }
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

window.onload = function() {
    const savedPortals = loadDataFromStorage();
    savedPortals.forEach(portal => addPortalRow(portal));
    generateMatrix();
};
