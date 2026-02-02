const apiDb = {
    "Paracetamol": { dose: 500, dens: 0.6, moist: false, cost: 15, alert: "Hepatotoxicity alert." },
    "Metronidazole": { dose: 500, dens: 0.5, moist: true, cost: 42, alert: "Avoid alcohol." },
    "Diclofenac": { dose: 50, dens: 0.7, moist: true, cost: 88, alert: "NSAID precautions." },
    "Ibuprofen": { dose: 200, dens: 0.5, moist: false, cost: 28, alert: "Take with food." }
};

const translations = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO", subtitle: "تصميم الصيغ الدوائية واللوجستيات المتقدمة",
        lblForm: "الشكل الصيدلاني:", lblApi: "المادة الفعالة:", lblStrat: "إستراتيجية التركيبة:", lblBatch: "حجم التشغيلة (Batch):",
        btnRun: "تحليل وتحسين الصيغة", txtChart: "توزيع المكونات", txtRecs: "التوصيات والبيانات الفنية",
        txtLog: "النتائج اللوجستية والإنتاجية", btnPdf: "تحميل التقرير (PDF)",
        unitW: "الوزن المثالي للوحدة", mass: "إجمالي الكتلة", vol: "الحجم الفيزيائي", area: "مساحة التخزين", cost: "التكلفة التقديرية", boxes: "عدد الصناديق"
    },
    en: {
        title: "PharmaForm AI Master", subtitle: "Drug Formulation & Advanced Logistics",
        lblForm: "Dosage Form:", lblApi: "Active Ingredient:", lblStrat: "Strategy:", lblBatch: "Batch Size (Units):",
        btnRun: "Optimize Formulation", txtChart: "Ingredient Distribution", txtRecs: "Technical Recommendations",
        txtLog: "Logistics & Production Results", btnPdf: "Download PDF Report",
        unitW: "Optimum Unit Weight", mass: "Total Batch Mass", vol: "Physical Volume", area: "Storage Floor Area", cost: "Estimated Cost", boxes: "Total Boxes"
    }
};

let currentLang = 'ar';
let myChart = null;

function setLang(lang) {
    currentLang = lang;
    const html = document.getElementById('mainHtml');
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
    
    Object.keys(translations[lang]).forEach(key => {
        const el = document.getElementById(key) || document.getElementById(`lbl-${key.split('lbl')[1]?.toLowerCase()}`) || document.getElementById(`btn-${key.split('btn')[1]?.toLowerCase()}`) || document.getElementById(`txt-${key.split('txt')[1]?.toLowerCase()}`);
        if(el) el.innerText = translations[lang][key];
    });
}

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const form = document.getElementById('dosageForm').value;
    const batch = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // 1. حساب الوزن التلقائي
    let unitW = (form === 'syrup') ? 100 : (api.dose < 100 ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10);
    
    // 2. منطق المكونات بناءً على الاستراتيجية
    let rem = unitW - api.dose;
    let filler, binder, other;
    if(strategy === 'cost') { filler = rem*0.85; binder = rem*0.1; other = rem*0.05; }
    else if(strategy === 'quality') { filler = rem*0.6; binder = rem*0.25; other = rem*0.15; }
    else { filler = rem*0.75; binder = rem*0.15; other = rem*0.1; }

    // 3. اللوجستيات
    const kg = (unitW * batch) / 1000000;
    const m3 = (kg / (api.dens * 1000)).toFixed(4);
    const m2 = (m3 * 2.5).toFixed(2);
    const cost = (kg * api.cost).toFixed(2);
    const boxes = Math.ceil(batch / 30);

    // 4. العرض
    document.getElementById('resultsArea').style.display = 'block';
    renderTable(unitW, kg, m3, m2, cost, boxes, form);
    renderRecs(api, form, strategy);
    drawChart(api.dose, filler, binder, other);
}

function renderTable(w, kg, m3, m2, cost, boxes, form) {
    const unit = form === 'syrup' ? 'ml' : 'mg';
    const t = translations[currentLang];
    document.getElementById('logisticsBody').innerHTML = `
        <tr><td><b>${t.unitW}:</b></td><td>${w} ${unit}</td></tr>
        <tr><td><b>${t.mass}:</b></td><td>${kg.toFixed(2)} kg</td></tr>
        <tr><td><b>${t.vol}:</b></td><td>${m3} m³</td></tr>
        <tr><td><b>${t.area}:</b></td><td>${m2} m²</td></tr>
        <tr><td><b>${t.cost}:</b></td><td>$${cost}</td></tr>
        <tr><td><b>${t.boxes}:</b></td><td>${boxes} Units</td></tr>
    `;
}

function renderRecs(api, form, strategy) {
    const list = document.getElementById('recList');
    const isAr = currentLang === 'ar';
    let recs = [];

    if(form === 'tablet') {
        recs.push(isAr ? `<b>طريقة التصنيع:</b> ${api.dose > 400 ? 'التحبيب الرطب' : 'الكبس المباشر'}` : `<b>Method:</b> ${api.dose > 400 ? 'Wet Granulation' : 'Direct Compression'}`);
    } else if(form === 'syrup') {
        recs.push(isAr ? `<b>المعالجة:</b> الخلط بالحرارة مع إضافة مادة بنزوات الصوديوم كحافظة.` : `<b>Process:</b> Hot mixing with Sodium Benzoate as preservative.`);
    }

    recs.push(isAr ? `<b>التغليف:</b> ${api.moist ? 'Alu-Alu لحماية المادة من الرطوبة' : 'PVC/PVDC قياسي'}` : `<b>Packaging:</b> ${api.moist ? 'Alu-Alu (Moisture barrier)' : 'PVC/PVDC Standard'}`);
    recs.push(isAr ? `<b>التخزين:</b> درجة حرارة أقل من 25° مئوية.` : `<b>Storage:</b> Store below 25°C.`);
    recs.push(`<b>Alert:</b> ${api.alert}`);

    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

function drawChart(a, f, b, o) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: currentLang === 'ar' ? ['المادة الفعالة', 'مالئ', 'رابط', 'أخرى'] : ['API', 'Filler', 'Binder', 'Others'],
            datasets: [{ data: [a, f, b, o], backgroundColor: ['#1a5276', '#27ae60', '#f1c40f', '#e74c3c'] }]
        },
        options: { plugins: { legend: { position: 'bottom', rtl: currentLang === 'ar' } } }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("PharmaForm Optimization Report", 20, 20);
    doc.autoTable({
        startY: 30,
        head: [['Metric', 'Value']],
        body: Array.from(document.querySelectorAll('#logisticsTable tr')).map(tr => [tr.cells[0].innerText, tr.cells[1].innerText])
    });
    doc.save("Pharma_Report.pdf");
}
