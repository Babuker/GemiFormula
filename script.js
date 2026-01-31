// Prices per kg (Estimated USD)
const pricing = { API: 120, Filler: 5, Binder: 15, Other: 25 };

function optimizeFormulation() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const dosageForm = document.getElementById('dosageForm').value;
    const batchSize = parseFloat(document.getElementById('batchSize').value);
    const apiData = apiDatabase[apiName];

    // 1. Optimum Weight Logic
    let unitWeight = apiData.dose < 100 ? 150 : Math.ceil(apiData.dose * 1.3 / 10) * 10;
    let formula = calculateRatios(apiData.dose, unitWeight, strategy);
    
    // 2. Batch Calculations
    const totalMassKg = (unitWeight * batchSize) / 1000000;
    const batchVolumeM3 = totalMassKg / 500; // Assuming avg bulk density 0.5 g/ml
    const totalCost = ( (formula.api * pricing.API) + (formula.filler * pricing.Filler) + 
                       (formula.binder * pricing.Binder) + (formula.other * pricing.Other) ) * batchSize / 1000000;

    // 3. UI Updates
    document.getElementById('resultsArea').style.display = 'block';
    document.getElementById('batchLogistics').style.display = 'block';
    document.getElementById('pdfBtn').style.display = 'block';

    updateTable(apiName, formula);
    updateChart(formula);
    renderLogistics(totalMassKg, batchVolumeM3, totalCost, batchSize);
    generateRecommendations(apiName, apiData, dosageForm, strategy, batchSize);
}

function renderLogistics(mass, vol, cost, units) {
    const body = document.getElementById('logisticsBody');
    const storageSpace = (vol * 1.5).toFixed(3); // 50% extra for pallet gaps
    const boxes = Math.ceil(units / 30); // 30 tablets per box standard

    body.innerHTML = `
        <tr><td><b>Batch Total Mass:</b></td><td>${mass.toFixed(2)} kg</td></tr>
        <tr><td><b>Batch Volume (m³):</b></td><td>${vol.toFixed(4)} m³</td></tr>
        <tr><td><b>Estimated Formulation Cost:</b></td><td>$${cost.toFixed(2)}</td></tr>
        <tr><td><b>Required Storage Floor Area:</b></td><td>~${storageSpace} m² (Single Stack)</td></tr>
        <tr><td><b>Final Packaging Units:</b></td><td>${boxes} Boxes (30 units/box)</td></tr>
    `;
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("PharmaForm Optimization Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add Formulation Table
    doc.autoTable({
        startY: 40,
        head: [['Ingredient', 'Role', 'Amount (mg)']],
        body: Array.from(document.querySelectorAll('#formulaBody tr')).map(tr => 
            Array.from(tr.cells).map(cell => cell.innerText)
        )
    });

    // Add Logistics Table
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Metric', 'Value']],
        body: Array.from(document.querySelectorAll('#logisticsBody tr')).map(tr => 
            Array.from(tr.cells).map(cell => cell.innerText)
        )
    });

    doc.save("Formulation_Report.pdf");
}
