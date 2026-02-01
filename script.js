// Advanced Pharmaceutical Database
const apiDatabase = {
    "Paracetamol": { dose: 500, density: 0.6, moisture: false, solubility: "Medium", cost: 12, alert: "Monitor hepatotoxicity at high doses." },
    "Ibuprofen": { dose: 200, density: 0.5, moisture: false, solubility: "Poor", cost: 25, alert: "Potential gastric irritation; consider enteric coating." },
    "Metronidazole": { dose: 500, density: 0.55, moisture: true, solubility: "Poor", cost: 35, alert: "Avoid alcohol during treatment (Disulfiram-like reaction)." },
    "Diclofenac": { dose: 50, density: 0.7, moisture: true, solubility: "Good", cost: 80, alert: "Potent NSAID; check for cardiovascular contraindications." }
};

let myChart = null;

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchUnits = parseInt(document.getElementById('batchSize').value) || 0;
    const dosageForm = document.getElementById('dosageForm').value;
    const api = apiDatabase[apiName];

    if(batchUnits <= 0) { alert("Please enter a valid batch size"); return; }

    // 1. Optimum Weight Calculation
    // For small doses, we need more filler to make the tablet handleable (~150mg min)
    // For high doses, we allow 25-30% excipients.
    let unitWeight = api.dose < 100 ? 150 : Math.ceil((api.dose * 1.3) / 10) * 10;
    
    // 2. Strategy-Based Excipient Selection
    let excipients = { filler: "", binder: "", disintegrant: "Croscarmellose" };
    let ratios = {};

    if (strategy === 'cost') {
        excipients.filler = "Maize Starch";
        excipients.binder = "Gelatin Solution";
        ratios = { filler: 0.80, binder: 0.15, other: 0.05 };
    } else if (strategy === 'quality') {
        excipients.filler = "MCC PH-102 (Avicel)";
        excipients.binder = "PVP K-30";
        ratios = { filler: 0.65, binder: 0.25, other: 0.10 };
    } else {
        excipients.filler = "Lactose DCL";
        excipients.binder = "HPMC";
        ratios = { filler: 0.75, binder: 0.15, other: 0.10 };
    }

    const excipientMass = unitWeight - api.dose;
    const fillerAmt = excipientMass * ratios.filler;
    const binderAmt = excipientMass * ratios.binder;
    const otherAmt = excipientMass * ratios.other;

    // 3. Logistics Calculations
    const totalMassKg = (unitWeight * batchUnits) / 1000000;
    const volumeM3 = (totalMassKg / (api.density * 1000)).toFixed(4);
    const floorArea = (volumeM3 * 2.5).toFixed(2); // Increased factor for aisle space
    const batchCost = (totalMassKg * api.cost * 1.2).toFixed(2); // 20% overhead added
    const boxes = Math.ceil(batchUnits / 30);

    // 4. UI Update
    document.getElementById('resultsContent').style.display = 'block';
    
    // Render Logistics Table
    const body = document.getElementById('logisticsBody');
    body.innerHTML = `
        <tr><td><b>Optimum Unit Weight:</b></td><td>${unitWeight} mg</td></tr>
        <tr><td><b>Total Batch Mass:</b></td><td>${totalMassKg.toFixed(2)} kg</td></tr>
        <tr><td><b>Physical Volume:</b></td><td>${volumeM3} m³</td></tr>
        <tr><td><b>Warehouse Floor Area:</b></td><td>~${floorArea} m²</td></tr>
        <tr><td><b>Estimated Production Cost:</b></td><td>$${batchCost}</td></tr>
        <tr><td><b>Retail Units (30s):</b></td><td>${boxes} Boxes</td></tr>
    `;

    // Render Recommendations
    const list = document.getElementById('recList');
    let recs = [];
    recs.push(`<b>Primary Filler:</b> ${excipients.filler}`);
    recs.push(`<b>Binder:</b> ${excipients.binder}`);
    recs.push(api.dose > 400 ? "<b>Process:</b> Wet Granulation (High Load)." : "<b>Process:</b> Direct Compression.");
    recs.push(api.moisture ? "<b>Packaging:</b> Alu-Alu Blister (Hygroscopic)." : "<b>Packaging:</b> PVC/ALU Blister.");
    recs.push(`<b>Storage:</b> Store at 20-25°C${api.moisture ? ", Humidity <60%" : ""}.`);
    recs.push(`<b>Safety Alert:</b> ${api.alert}`);
    
    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');

    renderChart(api.dose, fillerAmt, binderAmt, otherAmt);
}

function renderChart(a, f, b, o) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['API', 'Filler', 'Binder', 'Other'],
            datasets: [{
                data: [a, f, b, o],
                backgroundColor: ['#2c3e50', '#3498db', '#f1c40f', '#e74c3c']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PharmaForm AI Optimization Report", 15, 20);
    doc.setFontSize(10);
    doc.text("Confidential Manufacturing Data", 15, 28);
    
    doc.autoTable({
        startY: 35,
        head: [['Logistics Parameter', 'Calculated Value']],
        body: Array.from(document.querySelectorAll('#logisticsTable tr')).map(tr => [tr.cells[0].innerText, tr.cells[1].innerText]),
        theme: 'striped'
    });

    doc.save("Pharma_Optimization_Report.pdf");
}
