const apiDb = {
    "Paracetamol": { dose: 500, dens: 0.6, moist: false, cost: 14 },
    "Metronidazole": { dose: 500, dens: 0.5, moist: true, cost: 40 },
    "Diclofenac": { dose: 50, dens: 0.7, moist: true, cost: 85 },
    "Ibuprofen": { dose: 200, dens: 0.5, moist: false, cost: 25 }
};

const i18n = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO",
        subtitle: "نظام تصميم الصيغ الدوائية والتحليل المالي واللوجستي",
        lblForm: "الشكل الصيدلاني:",
        lblApi: "المادة الفعالة (API):",
        lblStrat: "إستراتيجية التركيبة:",
        lblBatch: "حجم التشغيلة (الوحدات):",
        optTablet: "أقراص (Tablet)", optCapsule: "كبسولات (Capsule)", optSyrup: "شراب (Syrup)",
        optBal: "متوازنة", optCost: "اقتصادية", optQual: "عالية الجودة",
        btnRun: "تحليل وتحسين الصيغة",
        formulaTitle: "تفاصيل التركيبة الأساسية (لكل وحدة)",
        chartTitle: "توزيع المكونات",
        batchDetails: "ملخص التشغيلة واللوجستيات",
        recsTitle: "التوصيات ومعايير الجودة (IPQC)",
        costTitle: "تحليل مقارنة التكاليف (اقتصادي vs جودة)",
        th: ["المكون", "الوظيفة", "الكمية", "النسبة", "التكلفة"],
        ingNames: ["المادة الفعالة", "مادة مالئة", "مادة رابطة", "إضافات أخرى"],
        roles: ["مادة فعالة", "مخفف", "لاصق", "مساعد سريان"],
        logLabels: ["إجمالي الوزن:", "التكلفة الإجمالية:", "المساحة التخزينية:", "العبوات النهائية:"],
        recLabels: ["التغليف:", "طريقة التصنيع:", "معايير الجودة (IPQC):", "تفاوت الوزن:", "الصلابة:", "التفكك:"],
        btnPdf: "تحميل التقرير المكتمل (PDF)"
    },
    en: {
        title: "PharmaForm AI PRO",
        subtitle: "Drug Formulation, Financial & Logistics System",
        lblForm: "Dosage Form:",
        lblApi: "Active Ingredient (API):",
        lblStrat: "Strategy:",
        lblBatch: "Batch Size (Units):",
        optTablet: "Tablets", optCapsule: "Capsules", optSyrup: "Syrup",
        optBal: "Balanced", optCost: "Cost-Wise", optQual: "Quality-Wise",
        btnRun: "Optimize & Analyze",
        formulaTitle: "Core Formula Details (Per Unit)",
        chartTitle: "Ingredient Distribution",
        batchDetails: "Batch Summary & Logistics",
        recsTitle: "Recommendations & Quality (IPQC)",
        costTitle: "Cost Analysis (Economic vs Quality)",
        th: ["Ingredient", "Role", "Qty", "Perc %", "Cost"],
        ingNames: ["Active API", "Filler", "Binder", "Others"],
        roles: ["Active", "Diluent", "Adhesive", "Glidant"],
        logLabels: ["Total Batch Mass:", "Total Production Cost:", "Storage Space:", "Final Boxes:"],
        recLabels: ["Packaging:", "Method:", "Quality (IPQC):", "Weight Var:", "Hardness:", "Disintegration:"],
        btnPdf: "Download Full PDF Report"
    }
};

let currentLang = 'ar';
let charts = { donut: null, bar: null };

function setLang(lang) {
    currentLang = lang;
    const html = document.getElementById('mainHtml');
    const t = i18n[lang];
    
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;

    // تبديل النصوص في الواجهة
    document.getElementById('txt-title').innerText = t.title;
    document.getElementById('txt-subtitle').innerText = t.subtitle;
    document.getElementById('lbl-form').innerText = t.lblForm;
    document.getElementById('lbl-api').innerText = t.lblApi;
    document.getElementById('lbl-strat').innerText = t.lblStrat;
    document.getElementById('lbl-batch').innerText = t.lblBatch;
    document.getElementById('opt-tablet').innerText = t.optTablet;
    document.getElementById('opt-capsule').innerText = t.optCapsule;
    document.getElementById('opt-syrup').innerText = t.optSyrup;
    document.getElementById('opt-bal').innerText = t.optBal;
    document.getElementById('opt-cost').innerText = t.optCost;
    document.getElementById('opt-qual').innerText = t.optQual;
    document.getElementById('btn-run').innerText = t.btnRun;
    document.getElementById('txt-formula-title').innerText = t.formulaTitle;
    document.getElementById('txt-chart-title').innerText = t.chartTitle;
    document.getElementById('txt-batch-details').innerText = t.batchDetails;
    document.getElementById('txt-recs').innerText = t.recsTitle;
    document.getElementById('txt-cost-compare').innerText = t.costTitle;
    document.getElementById('btn-pdf').innerText = t.btnPdf;

    // تحديث رؤوس الجدول
    document.getElementById('table-head').innerHTML = t.th.map(h => `<th>${h}</th>`).join('');

    // إعادة الحساب إذا كانت النتائج معروضة
    if(document.getElementById('resultsArea').style.display === 'block') calculateAll();
}

function calculateAll() {
    const t = i18n[currentLang];
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const form = document.getElementById('dosageForm').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    let unitW = (form === 'syrup') ? 100 : (api.dose < 100 ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10);
    let rem = unitW - api.dose;
    let f, b, o;
    if(strategy === 'cost') { f = rem*0.85; b = rem*0.1; o = rem*0.05; }
    else if(strategy === 'quality') { f = rem*0.6; b = rem*0.25; o = rem*0.15; }
    else { f = rem*0.75; b = rem*0.15; o = rem*0.1; }

    const ings = [
        { name: apiName, role: t.roles[0], qty: api.dose, perc: (api.dose/unitW)*100, cost: (api.dose * api.cost / 1000000) },
        { name: t.ingNames[1], role: t.roles[1], qty: f, perc: (f/unitW)*100, cost: (f * 6 / 1000000) },
        { name: t.ingNames[2], role: t.roles[2], qty: b, perc: (b/unitW)*100, cost: (b * 28 / 1000000) },
        { name: t.ingNames[3], role: t.roles[3], qty: o, perc: (o/unitW)*100, cost: (o * 18 / 1000000) }
    ];

    document.getElementById('resultsArea').style.display = 'block';
    
    // جدول التركيبة مترجم
    document.getElementById('formulaBody').innerHTML = ings.map(ing => `
        <tr><td>${ing.name}</td><td>${ing.role}</td><td>${ing.qty.toFixed(1)} mg</td><td>${ing.perc.toFixed(1)}%</td><td>$${ing.cost.toFixed(4)}</td></tr>
    `).join('');

    // لوجستيات مترجمة
    const totalMass = (unitW * batchSize / 1000000).toFixed(2);
    const unitCostTotal = ings.reduce((s, i) => s + i.cost, 0);
    const area = (totalMass / (api.dens * 400)).toFixed(2);

    document.getElementById('batchSummaryBody').innerHTML = `
        <tr><td>${t.logLabels[0]}</td><td>${totalMass} kg</td></tr>
        <tr><td>${t.logLabels[1]}</td><td>$${(unitCostTotal * batchSize).toFixed(2)}</td></tr>
        <tr><td>${t.logLabels[2]}</td><td>${area} m²</td></tr>
        <tr><td>${t.logLabels[3]}</td><td>${Math.ceil(batchSize/30)}</td></tr>
    `;

    renderRecs(api, form, unitW, t);
    drawDonut(api.dose, f, b, o, t.ingNames);
    drawComparison(unitCostTotal * batchSize, api, rem, batchSize, t);
}

function renderRecs(api, form, unitW, t) {
    const limit = unitW > 324 ? 5 : 7.5;
    const method = unitW > 500 ? (currentLang === 'ar' ? 'التحبيب الرطب' : 'Wet Granulation') : (currentLang === 'ar' ? 'الكبس المباشر' : 'Direct Compression');
    document.getElementById('recList').innerHTML = `
        <li><b>${t.recLabels[0]}</b> ${api.moist ? 'Alu-Alu' : 'PVC/PVDC'}</li>
        <li><b>${t.recLabels[1]}</b> ${method}</li>
        <hr><b>${t.recLabels[2]}</b>
        <li>${t.recLabels[3]} ±${limit}% (${(unitW*(1-limit/100)).toFixed(1)}-${(unitW*(1+limit/100)).toFixed(1)} mg)</li>
        <li>${t.recLabels[4]} 8-14 kg | ${t.recLabels[5]} < 15 min</li>
    `;
}

function drawDonut(a, f, b, o, labels) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: [a, f, b, o], backgroundColor: ['#1a5276', '#3498db', '#f1c40f', '#e74c3c'] }]
        },
        options: { plugins: { legend: { position: 'bottom', rtl: currentLang === 'ar' } } }
    });
}

function drawComparison(currentCost, api, rem, batch, t) {
    const apiC = (api.dose * api.cost / 1000000) * batch;
    const ecoEx = ((rem*0.85*6) + (rem*0.1*28) + (rem*0.05*18)) / 1000000 * batch;
    const qualEx = ((rem*0.6*6) + (rem*0.25*28) + (rem*0.15*18)) / 1000000 * batch;

    const ctx = document.getElementById('costComparisonChart').getContext('2d');
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [t.optCost, t.optQual],
            datasets: [{ label: '$', data: [apiC + ecoEx, apiC + qualEx], backgroundColor: ['#27ae60', '#1a5276'] }]
        },
        options: { indexAxis: 'y', maintainAspectRatio: false }
    });
}
