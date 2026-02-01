const apiData = {
    "Paracetamol": { dose: 500, density: 0.6, moisture: false, heat: false, cost: 12 },
    "Ibuprofen": { dose: 200, density: 0.5, moisture: false, heat: true, cost: 25 },
    "Metronidazole": { dose: 500, density: 0.55, moisture: true, heat: false, cost: 35 },
    "Diclofenac": { dose: 50, density: 0.7, moisture: true, heat: false, cost: 80 }
};

let myChart = null;

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchUnits = parseInt(document.getElementById('batchSize').value);
    const api = apiData[apiName];

    // 1. Automatic Optimum Tablet Weight
    // Rule: API should be ~75% of weight for high dose, or fixed 150mg for low dose
    let unitWeight = api.dose < 100 ? 150 : Math.ceil((api.dose / 0.75) / 10) * 10;
    
    // 2. Ingredient Logic
    let excipientTotal = unitWeight - api.dose;
    let filler, binder, others;

    if (strategy === 'cost') {
        filler = excipientTotal * 0.85; binder = excipientTotal * 0.10; others = excipientTotal * 0.05;
    } else if (strategy === 'quality') {
        filler = excipientTotal * 0.60; binder = excipientTotal * 0.25; others = excipientTotal * 0.15;
    } else {
        filler = excipientTotal * 0.75; binder = excipientTotal * 0.15; others = excipientTotal * 0.10;
    }

    // 3. Logistics Math
    const totalMassKg = (unitWeight * batchUnits) / 1000000;
    const volumeM3 = (totalMassKg / (api.density * 1000)).toFixed(4);
    const areaM2 = (volumeM3 * 1.4).toFixed(2); // Floor space factor
    const totalCost = (totalMassKg * api.cost).toFixed(2);
    const boxes = Math.ceil(batchUnits / 30);

    // 4. Update UI
    document.getElementById('resultsContent').style.display = 'block';
    renderTable(apiName, api.dose, filler, binder, others, totalMassKg, volumeM3, areaM2, totalCost, boxes);
    renderChart(api.dose, filler, binder, others);
    renderRecs(api, strategy);
}

function renderTable(api, dose, filler, binder, others, mass, vol, area, cost, boxes) {
    const body = document.getElementById('logisticsBody');
    body.innerHTML = `
        <tr><td><b>Target Unit Weight:</b></td><td>${dose + filler + binder + others} mg</td></tr>
        <tr><td><b>Total Batch Mass:</b></td><td>${mass.toFixed(2)} kg</td></tr>
        <tr><td><b>Batch Volume (m³):</b></td><td>${vol} m³</td></tr>
        <tr><td><b>Required Storage Area:</b></td><td>${area} m²</td></tr>
        <tr><td><b>Est. Batch Cost:</b></td><td>$${cost}</td></tr>
        <tr><td><b>Total Boxes (30s):</b></td><td>${boxes} units</td></tr>
    `;
}

function renderRecs(api, strategy) {
    const list = document.getElementById('recList');
    let recs = [];
    
    recs.push(api.dose >= 500 ? "<b>Method:</b> Wet Granulation recommended (High drug load)." : "<b>Method:</b> Direct Compression (Efficient).");
    recs.push(api.moisture ? "<b>Packing:</b> Alu-Alu Blister (Primary protection)." : "<b>Packing:</b> PVC/PVDC Blister (Standard).");
    recs.push(api.moisture ? "<b>Storage:</b> Controlled humidity < 60% RH." : "<b>Storage:</b> Store below 30°C.");
    recs.push("<b>Space:</b> Ensure pallet racking for " + (Math.ceil(api.dose * 0.0001 * 100) / 100) + " m³ of raw material.");
    
    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

function renderChart(a, f, b, o) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['API', 'Filler', 'Binder', 'Others'],
            datasets: [{
                data: [a, f, b, o],
                backgroundColor: ['#004d40', '#00bcd4', '#ffc107', '#e74c3c']
            }]
        }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Pharmaceutical Formulation Report", 14, 20);
    doc.autoTable({
        startY: 30,
        head: [['Logistics Metric', 'Value']],
        body: Array.from(document.querySelectorAll('#logisticsTable tr')).map(tr => [tr.cells[0].innerText, tr.cells[1].innerText])
    });
    doc.save("Pharma_Report.pdf");
}
