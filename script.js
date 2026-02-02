// 1. قاعدة بيانات المواد الفعالة (API Database)
const apiDb = {
    "Paracetamol": { dose: 500, dens: 0.6, moist: false, cost: 14.50 }, // سعر الكيلو
    "Metronidazole": { dose: 500, dens: 0.5, moist: true, cost: 38.00 },
    "Diclofenac": { dose: 50, dens: 0.7, moist: true, cost: 82.00 },
    "Ibuprofen": { dose: 200, dens: 0.5, moist: false, cost: 26.00 }
};

// 2. قاعدة بيانات أسعار المواد المضافة (Real Market Prices Estimate)
const excipientPrices = {
    "MCC PH-102": 7.80,
    "Lactose Monohydrate": 4.50,
    "Dicalcium Phosphate (DCP)": 5.20,
    "Pregelatinized Starch": 3.80,
    "Povidone (PVP K30)": 24.00,
    "HPMC": 19.50,
    "Magnesium Stearate": 13.00,
    "Colloidal Silicon Dioxide": 15.00
};

// 3. نصوص الترجمة (Localization)
const i18n = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO", subtitle: "نظام الخبير لتصميم الصيغ الدوائية والتحليل الاقتصادي",
        lblForm: "الشكل الصيدلاني:", lblApi: "المادة الفعالة (API):", lblStrat: "إستراتيجية التركيبة:", lblBatch: "حجم التشغيلة (الوحدات):",
        optTablet: "أقراص", optCapsule: "كبسولات", optBal: "متوازنة", optCost: "اقتصادية", optQual: "عالية الجودة",
        btnRun: "تحليل واقتراح التركيبة المثلى",
        formulaTitle: "تفاصيل التركيبة المختارة (للوحدة الواحدة)", chartTitle: "توزيع المكونات",
        batchDetails: "ملخص التشغيلة واللوجستيات", recsTitle: "التوصيات وطريقة التصنيع",
        costTitle: "تحليل مقارنة التكاليف (اقتصادي vs جودة)", effLabel: "مؤشر كفاءة الصيغة:",
        th: ["المكون العلمي", "الوظيفة", "الكمية (mg)", "النسبة %", "التكلفة ($)"],
        logLabels: ["إجمالي الوزن:", "التكلفة الإجمالية:", "المساحة التخزينية:", "العبوات النهائية:"],
        recLabels: ["طريقة التصنيع المقترحة:", "التغليف:", "معايير الجودة (IPQC):", "تفاوت الوزن:", "الصلابة:", "التفكك:"],
        roles: ["مادة فعالة", "مادة مالئة", "مادة رابطة", "مادة مزلقة"],
        btnPdf: "تحميل التقرير الفني (PDF)"
    },
    en: {
        title: "PharmaForm AI PRO", subtitle: "Expert System for Formulation & Economic Analysis",
        lblForm: "Dosage Form:", lblApi: "Active API:", lblStrat: "Strategy:", lblBatch: "Batch Size (Units):",
        optTablet: "Tablets", optCapsule: "Capsules", optBal: "Balanced", optCost: "Cost-Wise", optQual: "Quality-Wise",
        btnRun: "Analyze & Optimize Formula",
        formulaTitle: "Selected Formula Details (Per Unit)", chartTitle: "Ingredient Distribution",
        batchDetails: "Batch & Logistics Summary", recsTitle: "Recommendations & Mfg Method",
        costTitle: "Cost Analysis: Economic vs Quality", effLabel: "Formula Efficiency Index:",
        th: ["Scientific Name", "Role", "Qty (mg)", "Perc %", "Cost ($)"],
        logLabels: ["Total Mass:", "Total Cost:", "Storage Space:", "Final Boxes:"],
        recLabels: ["Suggested Method:", "Packaging:", "Quality (IPQC):", "Weight Var:", "Hardness:", "Disintegration:"],
        roles: ["Active API", "Filler", "Binder", "Lubricant"],
        btnPdf: "Download Technical Report (PDF)"
    }
};

let currentLang = 'ar';
let charts = { donut: null, bar: null };

function setLang(lang) {
    currentLang = lang;
    const t = i18n[lang];
    document.getElementById('mainHtml').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('mainHtml').lang = lang;

    // تحديث كل النصوص في الصفحة
    const map = {
        'txt-title': t.title, 'txt-subtitle': t.subtitle, 'lbl-form': t.lblForm, 'lbl-api': t.lblApi,
        'lbl-strat': t.lblStrat, 'lbl-batch': t.lblBatch, 'opt-tablet': t.optTablet, 'opt-capsule': t.optCapsule,
        'opt-bal': t.optBal, 'opt-cost': t.optCost, 'opt-qual': t.optQual, 'btn-run': t.btnRun,
        'txt-formula-title': t.formulaTitle, 'txt-chart-title': t.chartTitle, 'txt-batch-details': t.batchDetails,
        'txt-recs': t.recsTitle, 'txt-cost-compare': t.costTitle, 'btn-pdf': t.btnPdf
    };
    for (let id in map) { if(document.getElementById(id)) document.getElementById(id).innerText = map[id]; }
    
    document.getElementById('table-head').innerHTML = t.th.map(h => `<th>${h}</th>`).join('');

    if(document.getElementById('resultsArea').style.display === 'block') calculateAll();
}

function calculateAll() {
    const t = i18n[currentLang];
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // --- 1. المحرك العلمي: اختيار المواد وطريقة التصنيع ---
    let filler, binder, methodAr, methodEn;
    
    // منطق التوافقية (Compatibility Logic)
    if (apiName === 'Diclofenac') {
        // الديكلوفيناك حساس، نستخدم DCP الخامل كيميائياً بدلاً من اللاكتوز
        filler = "Dicalcium Phosphate (DCP)";
        binder = "HPMC";
        methodAr = "التحبيب الرطب (لضمان التجانس لجرعة 50 ملجم)";
        methodEn = "Wet Granulation (ensure uniformity for low dose)";
    } else if (apiName === 'Paracetamol') {
        // الباراسيتامول جرعة كبيرة، يحتاج نشا للتفكك
        filler = "Pregelatinized Starch";
        binder = "Povidone (PVP K30)";
        methodAr = "التحبيب الرطب (لتحسين انضغاطية المسحوق الكبير)";
        methodEn = "Wet Granulation (improve compressibility of high bulk)";
    } else {
        // الحالات القياسية، نستخدم MCC الأفضل للكبس المباشر
        filler = "MCC PH-102";
        binder = "Povidone (PVP K30)";
        methodAr = "الكبس المباشر (Direct Compression) - الأكثر كفاءة";
        methodEn = "Direct Compression (Most Efficient)";
    }
    const lubricant = "Magnesium Stearate";

    // --- 2. حساب النسب بناءً على الاستراتيجية ---
    // تحديد وزن القرص
    let unitW = (api.dose < 100) ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10;
    let rem = unitW - api.dose;
    
    // نسب المواد المضافة (Filler / Binder / Lubricant)
    let fPerc, bPerc, oPerc;
    let efficiencyScore = 85; // درجة أساسية

    if(strategy === 'cost') {
        // تقليل الرابط الغالي وزيادة المادة المالئة الرخيصة
        fPerc = 0.88; bPerc = 0.08; oPerc = 0.04; 
        efficiencyScore -= 10; // كفاءة أقل قليلاً بسبب قلة الرابط
    } else if(strategy === 'quality') {
        // زيادة الرابط والمزلق لضمان جودة عالية
        fPerc = 0.65; bPerc = 0.20; oPerc = 0.15;
        efficiencyScore += 12; // كفاءة قصوى
    } else {
        // متوازن
        fPerc = 0.78; bPerc = 0.14; oPerc = 0.08;
    }
    // تحسين الدرجة إذا كانت المواد متوافقة تماماً
    if(apiName === 'Diclofenac' || apiName === 'Paracetamol') efficiencyScore += 3;
    efficiencyScore = Math.min(efficiencyScore, 99);

    // --- 3. بناء مصفوفة المكونات وحساب التكلفة ---
    const ings = [
        { name: apiName, role: t.roles[0], qty: api.dose, cost: (api.dose * api.cost / 1000000) },
        { name: filler, role: t.roles[1], qty: rem * fPerc, cost: (rem * fPerc * excipientPrices[filler] / 1000000) },
        { name: binder, role: t.roles[2], qty: rem * bPerc, cost: (rem * bPerc * excipientPrices[binder] / 1000000) },
        { name: lubricant, role: t.roles[3], qty: rem * oPerc, cost: (rem * oPerc * excipientPrices[lubricant] / 1000000) }
    ];

    // --- 4. العرض (Rendering) ---
    document.getElementById('resultsArea').style.display = 'block';
    
    // جدول التركيبة
    document.getElementById('formulaBody').innerHTML = ings.map(i => `
        <tr>
            <td>${i.name}</td>
            <td>${i.role}</td>
            <td>${i.qty.toFixed(1)}</td>
            <td>${((i.qty/unitW)*100).toFixed(1)}%</td>
            <td>$${i.cost.toFixed(5)}</td>
        </tr>
    `).join('');

    // مؤشر الكفاءة
    const color = efficiencyScore > 90 ? '#27ae60' : (efficiencyScore > 75 ? '#f1c40f' : '#e74c3c');
    document.getElementById('efficiencyWrapper').innerHTML = `
        <div class="efficiency-container">
            <b>${t.effLabel}</b> <span class="score-text" style="color:${color}">${efficiencyScore}%</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${efficiencyScore}%; background:${color}"></div>
            </div>
        </div>
    `;

    // ملخص التشغيلة
    const totalMass = (unitW * batchSize / 1000000).toFixed(2);
    const totalCost = (ings.reduce((s, i) => s + i.cost, 0) * batchSize).toFixed(2);
    document.getElementById('batchSummaryBody').innerHTML = `
        <tr><td>${t.logLabels[0]}</td><td>${totalMass} kg</td></tr>
        <tr><td>${t.logLabels[1]}</td><td>$${totalCost}</td></tr>
        <tr><td>${t.logLabels[2]}</td><td>${(totalMass/(api.dens*400)).toFixed(2)} m²</td></tr>
        <tr><td>${t.logLabels[3]}</td><td>${Math.ceil(batchSize/30)}</td></tr>
    `;

    // التوصيات
    const limit = unitW > 324 ? 5 : 7.5;
    const methodDisplay = currentLang === 'ar' ? methodAr : methodEn;
    document.getElementById('recList').innerHTML = `
        <li><b>${t.recLabels[0]}</b> ${methodDisplay}</li>
        <li><b>${t.recLabels[1]}</b> ${api.moist ? 'Alu-Alu Blister' : 'PVC/PVDC'}</li>
        <hr>
        <b>${t.recLabels[2]}</b>
        <li>${t.recLabels[3]} ±${limit}% (${(unitW*(1-limit/100)).toFixed(1)} - ${(unitW*(1+limit/100)).toFixed(1)} mg)</li>
        <li>${t.recLabels[4]} 8-14 kg | ${t.recLabels[5]} < 15 min</li>
    `;

    // الرسوم البيانية
    drawDonut(ings);
    drawComparison(api, rem, batchSize, t);
}

function drawDonut(ings) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ings.map(i => i.name),
            datasets: [{ 
                data: ings.map(i => i.qty), 
                backgroundColor: ['#1a5276', '#3498db', '#f1c40f', '#e74c3c'],
                borderWidth: 1
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function drawComparison(api, rem, batch, t) {
    // حساب التكلفة للمقارنة (Economy vs Quality scenarios)
    const apiC = (api.dose * api.cost / 1000000) * batch;
    
    // سيناريو اقتصادي (مواد أرخص: لاكتوز + نشا + نسب أقل)
    const ecoExCost = ((rem*0.88*4.50) + (rem*0.08*24.00) + (rem*0.04*13.00)) / 1000000 * batch;
    
    // سيناريو جودة (مواد أغلى: MCC + HPMC + نسب أعلى)
    const qualExCost = ((rem*0.65*7.80) + (rem*0.20*19.50) + (rem*0.15*13.00)) / 1000000 * batch;

    const ctx = document.getElementById('costComparisonChart').getContext('2d');
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [t.optCost, t.optQual],
            datasets: [{
                label: '$ USD',
                data: [(apiC + ecoExCost).toFixed(2), (apiC + qualExCost).toFixed(2)],
                backgroundColor: ['#27ae60', '#1a5276'],
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });
}

function generatePDF() {
    // وظيفة وهمية للعرض، يمكن ربطها بمكتبة jsPDF للتصدير الفعلي
    const msg = currentLang === 'ar' ? 'جاري تجهيز ملف PDF للتحميل...' : 'Generating PDF Report...';
    alert(msg);
}

// تهيئة اللغة عند البدء
setLang('ar');
