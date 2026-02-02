document.getElementById("resultsArea").style.display = "block";

/* ---- Formula table (example values) ---- */
document.getElementById("formulaTable").innerHTML = `
<tr><td>API</td><td>${apiDose}</td><td>Active</td><td>70</td></tr>
<tr><td>MCC</td><td>${apiDose * 0.2}</td><td>Diluent</td><td>20</td></tr>
<tr><td>PVP K30</td><td>${apiDose * 0.05}</td><td>Binder</td><td>5</td></tr>
<tr><td>SSG</td><td>${apiDose * 0.05}</td><td>Disintegrant</td><td>5</td></tr>
`;

/* ---- Pie chart ---- */
if (window.formulaChartObj) formulaChartObj.destroy();
formulaChartObj = new Chart(
    document.getElementById("formulaChart"),
    {
        type: "pie",
        data: {
            labels: ["API", "MCC", "PVP", "SSG"],
            datasets: [{
                data: [70, 20, 5, 5]
            }]
        }
    }
);

/* ---- One-line batch info ---- */
document.getElementById("batchLine").innerText =
    `Size: ${batchSize} units | Cost: $${totalCost} | Pallets: ${pallets} | Area: ${area} m²`;

/* ---- One-line recommendation ---- */
document.getElementById("recLine").innerText =
    `Method: ${processingMethod} | Storage: Below 25°C | Packaging: ${packaging}`;
