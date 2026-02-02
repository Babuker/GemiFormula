let formulaChartObj = null;

function runFormulation() {

    const apiDose = Number(document.getElementById("apiDose").value);
    const batchSize = Number(document.getElementById("batchSize").value);
    const strategy = document.getElementById("strategy").value;

    /* ---------- Strategy → internal decisions ---------- */
    let processingMethod, packaging, costPerKg;

    if (strategy === "cost") {
        processingMethod = "Direct Compression";
        packaging = "PVC Blister";
        costPerKg = 22;
    } else if (strategy === "quality") {
        processingMethod = "Wet Granulation";
        packaging = "Alu-Alu Blister";
        costPerKg = 40;
    } else {
        processingMethod = "Dry Granulation";
        packaging = "PVC/PVDC Blister";
        costPerKg = 30;
    }

    /* ---------- Simple formulation model ---------- */
    const api = apiDose;
    const filler = apiDose * 0.20;
    const binder = apiDose * 0.05;
    const disintegrant = apiDose * 0.05;

    const totalUnitWeight = api + filler + binder + disintegrant;

    /* ---------- Formula table ---------- */
    document.getElementById("formulaTable").innerHTML = `
        <tr><td>API</td><td>${api.toFixed(1)}</td><td>Active</td><td>70</td></tr>
        <tr><td>MCC</td><td>${filler.toFixed(1)}</td><td>Diluent</td><td>20</td></tr>
        <tr><td>PVP K30</td><td>${binder.toFixed(1)}</td><td>Binder</td><td>5</td></tr>
        <tr><td>SSG</td><td>${disintegrant.toFixed(1)}</td><td>Disintegrant</td><td>5</td></tr>
    `;

    /* ---------- Pie chart ---------- */
    if (formulaChartObj) formulaChartObj.destroy();

    formulaChartObj = new Chart(
        document.getElementById("formulaChart"),
        {
            type: "pie",
            data: {
                labels: ["API", "MCC", "PVP K30", "SSG"],
                datasets: [{
                    data: [70, 20, 5, 5]
                }]
            }
        }
    );

    /* ---------- Batch calculations ---------- */
    const totalKg = (totalUnitWeight * batchSize) / 1_000_000;
    const totalCost = (totalKg * costPerKg).toFixed(2);
    const pallets = Math.ceil(totalKg / 500);
    const area = (pallets * 1.2).toFixed(2);

    document.getElementById("batchLine").innerText =
        `Size: ${batchSize} units | Cost: $${totalCost} | Pallets: ${pallets} | Area: ${area} m²`;

    /* ---------- Recommendation line ---------- */
    document.getElementById("recLine").innerText =
        `Method: ${processingMethod} | Storage: Below 25°C, dry | Packaging: ${packaging}`;

    document.getElementById("resultsArea").style.display = "block";
}

/* ---------- PDF EXPORT ---------- */
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.text("GemiFormula – Results Summary", 14, 15);
    pdf.text("Formulation & Batch Overview", 14, 25);

    pdf.text(document.getElementById("batchLine").innerText, 14, 40);
    pdf.text(document.getElementById("recLine").innerText, 14, 50);

    pdf.save("GemiFormula_Results.pdf");
}
