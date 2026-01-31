const apiDatabase = {
    "Paracetamol": { dose: 500, solubility: "Medium", heatSensitive: false, moistureSensitive: false },
    "Ibuprofen": { dose: 200, solubility: "Poor", heatSensitive: true, moistureSensitive: false },
    "Metronidazole": { dose: 500, solubility: "Poor", heatSensitive: false, moistureSensitive: true },
    "Diclofenac": { dose: 50, solubility: "Good", heatSensitive: false, moistureSensitive: true }
};

let formulaChart = null;

function optimizeFormulation() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const dosageForm = document.getElementById('dosageForm').value;
    const apiData = apiDatabase[apiName];

    // 1. Automatic Optimum Weight Calculation
    let totalWeight = 0;
    if (dosageForm === 'tablet' || dosageForm === 'capsule') {
        // Rule: Excipients should be at least 20-30% of total weight
        totalWeight = apiData.dose < 100 ? 150 : Math.ceil(apiData.dose * 1.3 / 10) * 10;
    } else {
        totalWeight = 5000; // Default 5ml for Syrup
    }

    // 2. Logic for Ingredient Ratios based on Strategy
    let formula = calculateRatios(apiData.dose, totalWeight, strategy);
    
    // 3. Display Results
    document.getElementById('resultsArea').style.display = 'block';
    updateTable(apiName, formula);
    updateChart(formula);
    generateRecommendations(apiName, apiData, dosageForm, strategy);
}

function calculateRatios(apiDose, total, strategy) {
    const remaining = total - apiDose;
    let ratios = {};

    if (strategy === 'cost') {
        ratios = { api: apiDose, filler: remaining * 0.8, binder: remaining * 0.1, other: remaining * 0.1 };
    } else if (strategy === 'quality') {
        ratios = { api: apiDose, filler: remaining * 0.6, binder: remaining * 0.25, other: remaining * 0.15 };
    } else {
        ratios = { api: apiDose, filler: remaining * 0.7, binder: remaining * 0.2, other: remaining * 0.1 };
    }
    return ratios;
}

function updateTable(apiName, formula) {
    const body = document.getElementById('formulaBody');
    body.innerHTML = `
        <tr><td>${apiName}</td><td>Active (API)</td><td>${formula.api.toFixed(1)}</td></tr>
        <tr><td>Filler (Lactose/MCC)</td><td>Diluent</td><td>${formula.filler.toFixed(1)}</td></tr>
        <tr><td>Binder (PVP/HPMC)</td><td>Cohesion</td><td>${formula.binder.toFixed(1)}</td></tr>
        <tr><td>Other (Lubricant/Glidant)</td><td>Flow/Release</td><td>${formula.other.toFixed(1)}</td></tr>
    `;
}

function updateChart(formula) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if (formulaChart) formulaChart.destroy();
    
    formulaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['API', 'Filler', 'Binder', 'Others'],
            datasets: [{
                data: [formula.api, formula.filler, formula.binder, formula.other],
                backgroundColor: ['#3498db', '#95a5a6', '#f1c40f', '#e74c3c']
            }]
        }
    });
}

function generateRecommendations(name, data, form, strategy) {
    const list = document.getElementById('recList');
    let recs = [];

    // Processing Method
    if (form === 'tablet') {
        recs.push(data.dose > 400 ? "<b>Method:</b> Wet Granulation recommended for high drug load." : "<b>Method:</b> Direct Compression suitable for this dose.");
    }

    // Storage & Packing
    if (data.moistureSensitive) {
        recs.push("<b>Packing:</b> Alu-Alu Blister required (Moisture sensitive).");
        recs.push("<b>Storage:</b> Store in a dry place below 25°C.");
    } else {
        recs.push("<b>Packing:</b> PVC/PVDC Blister is sufficient.");
        recs.push("<b>Storage:</b> Store below 30°C.");
    }

    // Strategy Advice
    if (strategy === 'cost') recs.push("<b>Advice:</b> Use Corn Starch as a primary filler to minimize costs.");
    if (strategy === 'quality') recs.push("<b>Advice:</b> Use Microcrystalline Cellulose (MCC PH-102) for superior tablet hardness.");

    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}
