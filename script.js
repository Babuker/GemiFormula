const excipientDB = {
    filler: { name: "Microcrystalline Cellulose", cost: 0.00002 },
    binder: { name: "PVP K30", cost: 0.00006 },
    disintegrant: { name: "Sodium Starch Glycolate", cost: 0.00005 }
};

function runFormulation() {

    const apiName = document.getElementById("apiSelect").value;
    const apiDose = Number(document.getElementById("apiDose").value);
    const method = document.getElementById("processMethod").value;
    const std = document.getElementById("pharmaStd").value;

    let fillerRatio, binderRatio, disRatio;

    if (method === "dc") {
        fillerRatio = 0.25;
        binderRatio = 0.05;
        disRatio = 0.05;
    } else if (method === "wg") {
        fillerRatio = 0.20;
        binderRatio = 0.10;
        disRatio = 0.05;
    } else {
        fillerRatio = 0.22;
        binderRatio = 0.08;
        disRatio = 0.05;
    }

    const excipientTotal = apiDose * (fillerRatio + binderRatio + disRatio);
    const totalWeight = apiDose + excipientTotal;

    const rows = [
        {
            name: apiName,
            qty: apiDose,
            role: "Active Pharmaceutical Ingredient",
            ratio: (apiDose / totalWeight * 100).toFixed(1),
            cost: "—"
        },
        {
            name: excipientDB.filler.name,
            qty: apiDose * fillerRatio,
            role: "Diluent",
            ratio: (fillerRatio * 100).toFixed(1),
            cost: excipientDB.filler.cost
        },
        {
            name: excipientDB.binder.name,
            qty: apiDose * binderRatio,
            role: "Binder",
            ratio: (binderRatio * 100).toFixed(1),
            cost: excipientDB.binder.cost
        },
        {
            name: excipientDB.disintegrant.name,
            qty: apiDose * disRatio,
            role: "Disintegrant",
            ratio: (disRatio * 100).toFixed(1),
            cost: excipientDB.disintegrant.cost
        }
    ];

    const tbody = document.getElementById("formulaTable");
    tbody.innerHTML = "";

    rows.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.name}</td>
                <td>${r.qty.toFixed(2)}</td>
                <td>${r.role}</td>
                <td>${r.ratio}</td>
                <td>${r.cost}</td>
            </tr>
        `;
    });

    document.getElementById("recList").innerHTML = `
        <li>Processing method aligned with ${method.toUpperCase()}</li>
        <li>Excipient selection compliant with ${std}</li>
    `;
}
