const apiDb = {
    "Paracetamol": { dose: 500, dens: 0.6, moist: false, cost: 14 },
    "Metronidazole": { dose: 500, dens: 0.5, moist: true, cost: 40 },
    "Diclofenac": { dose: 50, dens: 0.7, moist: true, cost: 85 },
    "Ibuprofen": { dose: 200, dens: 0.5, moist: false, cost: 25 }
};

const excipientPrices = { filler: 6, binder: 28, other: 18 };

const i18n = {
    ar: {
        formula_title: "تفاصيل التركيبة الأساسية (لكل وحدة)",
        batch_details: "ملخص التشغيلة واللوجستيات",
        recs: "التوصيات ومعايير الجودة (IPQC)",
        cost_title: "تحليل مقارنة التكاليف (اقتصادي vs جودة)",
        th: ["المكون", "الوظيفة", "الكمية", "النسبة", "التكلفة"],
        log_labels: ["إجمالي وزن التشغيلة:", "تكلفة الإنتاج الإجمالية:", "المساحة التخزينية:", "العبوات النهائية:"]
    },
    en: {
        formula_title: "Core Formula Details (Per Unit)",
        batch_details: "Batch Summary & Logistics",
        recs: "Recommendations & Quality (IPQC)",
        cost_title: "Cost Analysis (Economic vs Quality)",
        th: ["Ingredient", "Role", "Qty", "Percentage", "Cost"],
        log_labels: ["Total Batch Mass:", "Total Production Cost:", "Storage Space:", "Final Boxes:"]
    }
};

let currentLang = 'ar';
let charts = { donut: null, bar: null };

function setLang(lang) {
    currentLang = lang;
    const html = document.getElementById('mainHtml');
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
    document.getElementById('txt-formula-title').innerText = i18n[lang].formula_title;
    document.getElementById('txt-batch-details').innerText = i18n[lang].batch_details;
    document.getElementById('txt-recs').innerText = i18n[lang].recs;
    document.getElementById('txt-cost-title').innerText = i18n[lang].cost_title;
    
    const head = document.getElementById('table-head');
    head.innerHTML = i18n[lang].th.map(h => `<th>${h}</th>`).join('');
}

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const form = document.getElementById('dosageForm').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // 1. حساب الوزن التلقائي
    let unitW = (form === 'syrup') ? 100 : (api.dose < 100 ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10);
    
    // 2. توزيع المكونات
    let rem = unitW - api.dose;
    let f, b, o;
    if(strategy === 'cost') { f = rem*0.85; b = rem*0.1; o = rem*0.05; }
    else if(strategy === 'quality') { f = rem*0.6; b = rem*0.25; o = rem*0.15; }
    else { f = rem*0.75; b = rem*0.15; o = rem*0.1; }

    const ingredients = [
        { name: apiName, role: "API", qty: api.dose, perc: (api.dose/unitW)*100, cost: (api.dose * api.cost / 1000000) },
        { name: "Filler", role: "Diluent", qty: f, perc: (f/unitW)*100, cost: (f * excipientPrices.filler / 1000000) },
        { name: "Binder", role: "Adhesive", qty: b, perc: (b/unitW)*100, cost: (b * excipientPrices.binder / 1000000) },
        { name: "Others", role: "Glidant", qty: o, perc: (o/unitW)*100, cost: (o * excipientPrices.other / 1000000) }
    ];

    // 3. العرض
    document.getElementById('resultsArea').style.display = 'block';
    
    // جدول التركيبة
    document.getElementById('formulaBody').innerHTML = ingredients.map(ing => `
        <tr><td>${ing.name}</td><td>${ing.role}</td><td>${ing.qty.toFixed(1)} mg</td><td>${ing.perc.toFixed(1)}%</td><td>$${ing.cost.toFixed(4)}</td></tr>
    `).join('');

    // ملخص التشغيلة
    const totalMass = (unitW * batchSize / 1000000).toFixed(2);
    const unitCostTotal = ingredients.reduce((s, i) => s + i.cost, 0);
    const totalCost = (unitCostTotal * batchSize).toFixed(2);
    const area = (totalMass / (api.dens * 400)).toFixed(2);

    document.getElementById('batchSummaryBody').innerHTML = `
        <tr><td>${i18n[currentLang].log_labels[0]}</td><td>${totalMass} kg</td></tr>
        <tr><td>${i18n[currentLang].log_labels[1]}</td><td>$${totalCost}</td></tr>
        <tr><td>${i18n[currentLang].log_labels[2]}</td><td>${area} m²</td></tr>
        <tr><td>${i18n[currentLang].log_labels[3]}</td><td>${Math.ceil(batchSize/30)} Boxes</td></tr>
    `;

    // الرسوم البيانية
    drawDonut(api.dose, f, b, o);
    drawComparison(unitCostTotal * batchSize, api, rem, batchSize);
    renderRecs(api, form, unitW);
}

function drawDonut(a, f, b, o) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['API', 'Filler', 'Binder', 'Others'],
            datasets: [{ data: [a, f, b, o], backgroundColor: ['#1a5276', '#3498db', '#f1c40f', '#e74c3c'] }]
        }
    });
}

function drawComparison(currentCost, api, rem, batch) {
    const ecoEx = ((rem*0.85*6) + (rem*0.1*28) + (rem*0.05*18)) / 1000000 * batch;
    const qualEx = ((rem*0.6*6) + (rem*0.25*28) + (rem*0.15*18)) / 1000000 * batch;
    const apiC = (api.dose * api.cost / 1000000) * batch;

    const ctx = document.getElementById('costComparisonChart').getContext('2d');
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: currentLang === 'ar' ? ['إقتصادي', 'عالي الجودة'] : ['Economic', 'Quality'],
            datasets: [{
                label: 'Total Cost $',
                data: [apiC + ecoEx, apiC + qualEx],
                backgroundColor: ['#27ae60', '#1a5276']
            }]
        },
        options: { indexAxis: 'y', maintainAspectRatio: false }
    });
}

function renderRecs(api, form, unitW) {
    const list = document.getElementById('recList');
    const limit = unitW > 324 ? 5 : 7.5;
    list.innerHTML = `
        <li><b>Packing:</b> ${api.moist ? 'Alu-Alu Blister' : 'PVC Blister'}</li>
        <li><b>Method:</b> ${unitW > 500 ? 'Wet Granulation' : 'Direct Compression'}</li>
        <hr>
        <b>IPQC Standards:</b>
        <li>Weight Var: ±${limit}% (${(unitW*(1-limit/100)).toFixed(1)}-${(unitW*(1+limit/100)).toFixed(1)} mg)</li>
        <li>Hardness: 8-14 kg | Disintegration: < 15 min</li>
    `;
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("PharmaForm AI Production Report", 20, 20);
    doc.autoTable({ html: '#formulaTable', startY: 30 });
    doc.save("Production_Report.pdf");
}
