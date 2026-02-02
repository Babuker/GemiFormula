function runFormulation() {

    const apiDose = Number(document.getElementById("apiDose").value);
    const batchSize = Number(document.getElementById("batchSize").value);
    const strategy = document.getElementById("strategy").value;

    /* ---- Internal logic (hidden from user) ---- */

    let processingMethod, packaging;

    if (strategy === "cost") {
        processingMethod = "Direct Compression";
        packaging = "PVC Blister";
    } else if (strategy === "quality") {
        processingMethod = "Wet Granulation";
        packaging = "Alu-Alu Blister";
    } else {
        processingMethod = "Dry Granulation";
        packaging = "PVC/PVDC Blister";
    }

    /* ---- Batch calculations ---- */

    const unitWeight = apiDose * 1.4; // simple, realistic assumption
    const totalKg = (unitWeight * batchSize) / 1_000_000;

    const costPerKg = strategy === "cost" ? 22 : strategy === "quality" ? 40 : 30;
    const totalCost = (totalKg * costPerKg).toFixed(2);

    const pallets = Math.ceil(totalKg / 500);
    const area = (pallets * 1.2).toFixed(2);

    /* ---- Render batch table (ONE LINE) ---- */

    document.getElementById("batchTable").innerHTML = `
        <tr>
            <td>${batchSize}</td>
            <td>${totalCost}</td>
            <td>${pallets}</td>
            <td>${area}</td>
        </tr>
    `;

    /* ---- Single-line recommendation ---- */

    document.getElementById("recLine").innerText =
        `Method: ${processingMethod} | Storage: Below 25°C, dry place | Packaging: ${packaging}`;
}
