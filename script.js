const apiData = {
    "Paracetamol": { d: 500, dens: 0.6, moist: false, cost: 12, unit: "mg" },
    "Metronidazole": { d: 500, dens: 0.5, moist: true, cost: 38, unit: "mg" },
    "Diclofenac": { d: 50, dens: 0.7, moist: true, cost: 75, unit: "mg" },
    "Ibuprofen": { d: 200, dens: 0.5, moist: false, cost: 22, unit: "mg" }
};

const i18n = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO",
        run: "تحسين ومعالجة",
        method: "طريقة التصنيع",
        pack: "نوع التغليف",
        store: "ظروف التخزين",
        qc: "رقابة الجودة (IPQC)",
        weight: "الوزن المثالي للوحدة",
        mass: "كتلة التشغيلة الكلية",
        cost: "تكلفة المواد التقديرية",
        area: "المساحة المطلوبة للتخزين",
        packing: "إجمالي العبوات (30 وحدة)"
    },
    en: {
        title: "PharmaForm AI PRO",
        run: "Optimize & Process",
        method: "Manufacturing Method",
        pack: "Packaging Type",
        store: "Storage Conditions",
        qc: "Quality Control (IPQC)",
        weight: "Optimum Unit Weight",
        mass: "Total Batch Mass",
        cost: "Estimated Material Cost",
        area: "Required Storage Area",
        packing: "Total Boxes (30 units)"
    }
};

let currentLang = 'ar';
let chartObj = null;

function toggleLanguage(lang) {
    currentLang = lang;
    const html = document.getElementById('mainHtml');
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
    document.getElementById('title').innerText = i18n[lang].title;
    document.getElementById('btnRun').innerText = i18n[lang].run;
}

function processOptimization() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batch = parseInt(document.getElementById('batchSize').value);
    const form = document.getElementById('dosageForm').value;
    const api = apiData[apiName];

    // 1. حساب الوزن التلقائي (Logic)
    let unitW = (form === 'syrup') ? 100 : (api.d < 100 ? 150 : Math.ceil(api.d * 1.35 / 10) * 10);
    
    // 2. توزيع المكونات
    let filler, binder, other;
    let rem = unitW - api.d;
    if(strategy === 'cost') { filler = rem*0.85; binder = rem*0.1; other = rem*0.05; }
    else if(strategy === 'quality') { filler = rem*0.6; binder = rem*0.25; other = rem*0.15; }
    else { filler = rem*0.75; binder = rem*0.15; other = rem*0.1; }

    // 3. اللوجستيات
    const totalKg = (unitW * batch) / 1000000;
    const cost = (totalKg * api.cost).toFixed(2);
    const area = (totalKg / (api.dens * 400)).toFixed(2); // m2
    const boxes = Math.ceil(batch / 30);

    // 4. عرض النتائج
    document.getElementById('resultsArea').style.display = 'block';
    renderTable(unitW, totalKg, cost, area, boxes, form);
    renderRecs(api, form, strategy);
    drawChart(api.d, filler, binder, other);
}

function renderTable(w, kg, c, a, b, form) {
    const unit = form === 'syrup' ? 'ml' : 'mg';
    document.getElementById('logisticsBody').innerHTML = `
        <tr><td><b>${i18n[currentLang].weight}:</b></td><td>${w} ${unit}</td></tr>
        <tr><td><b>${i18n[currentLang].mass}:</b></td><td>${kg.toFixed(2)} kg</td></tr>
        <tr><td><b>${i18n[currentLang].cost}:</b></td><td>$${c}</td></tr>
        <tr><td><b>${i18n[currentLang].area}:</b></td><td>${a} m²</td></tr>
        <tr><td><b>${i18n[currentLang].packing}:</b></td><td>${b} Units</td></tr>
    `;
}

function renderRecs(api, form, strategy) {
    const list = document.getElementById('recList');
    let recs = [];
    
    if(form === 'tablet') {
        recs.push(`<b>${i18n[currentLang].method}:</b> ${api.d > 400 ? 'Wet Granulation' : 'Direct Compression'}`);
        recs.push(`<b>${i18n[currentLang].qc}:</b> Hardness (6-10 kg), Friability (<1%)`);
    } else if(form === 'syrup') {
        recs.push(`<b>${i18n[currentLang].method}:</b> Hot Process (Dissolution & Filtration)`);
        recs.push(`<b>Additives:</b> Sodium Benzoate (Preservative), Sorbitol (Sweetener)`);
    }

    recs.push(`<b>${i18n[currentLang].pack}:</b> ${api.moist ? 'Alu-Alu Blister' : 'PVC/PVDC Blister'}`);
    recs.push(`<b>${i18n[currentLang].store}:</b> Below 25°C, ${api.moist ? 'RH < 60%' : 'Dry place'}`);
    
    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

function drawChart(a, f, b, o) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(chartObj) chartObj.destroy();
    chartObj = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['API', 'Filler', 'Binder', 'Others'],
            datasets: [{ data: [a, f, b, o], backgroundColor: ['#004d40', '#00acc1', '#ffc107', '#e74c3c'] }]
        }
    });
}
