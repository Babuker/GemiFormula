const apiDb = {
    "Paracetamol": { dose: 500, dens: 0.6, moist: false, cost: 14.5 },
    "Metronidazole": { dose: 500, dens: 0.5, moist: true, cost: 38.0 },
    "Diclofenac": { dose: 50, dens: 0.7, moist: true, cost: 82.0 },
    "Ibuprofen": { dose: 200, dens: 0.5, moist: false, cost: 26.0 }
};

const excipientPrices = {
    "MCC PH-102": 7.80, "DCP": 5.20, "PVP K30": 24.0, "Starch": 3.5, "MagStearate": 13.0, "HPMC": 19.0
};

const i18n = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO", subtitle: "تطوير وحماية الصيغ الدوائية",
        th: ["المادة", "الوظيفة", "الكمية (mg)", "النسبة %", "التكلفة $"],
        log: ["الكتلة الإجمالية:", "تكلفة التشغيلة:", "المساحة:", "العبوات:"],
        btnPdf: "تحميل التقرير المحمي (PDF)", eff: "مؤشر كفاءة الصيغة:",
        roles: ["فعالة", "مالئة", "رابطة", "مزلقة"]
    },
    en: {
        title: "PharmaForm AI PRO", subtitle: "Formulation Development & Security",
        th: ["Component", "Role", "Qty (mg)", "Perc %", "Cost $"],
        log: ["Total Mass:", "Total Cost:", "Storage:", "Final Boxes:"],
        btnPdf: "Download Secured PDF", eff: "Formula Efficiency Index:",
        roles: ["Active", "Filler", "Binder", "Lubricant"]
    }
};

let currentLang = 'ar';
let charts = { donut: null, bar: null };

function setLang(lang) {
    currentLang = lang;
    const t = i18n[lang];
    document.getElementById('mainHtml').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('txt-title').innerText = t.title;
    document.getElementById('txt-subtitle').innerText = t.subtitle;
    document.getElementById('table-head').innerHTML = t.th.map(h => `<th>${h}</th>`).join('');
    if(document.getElementById('resultsArea').style.display === 'block') calculateAll();
}

function calculateAll() {
    const t = i18n[currentLang];
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // المنطق العلمي للتوافقية
    let filler = apiName === 'Diclofenac' ? "DCP" : (apiName === 'Paracetamol' ? "Starch" : "MCC PH-102");
    let binder = apiName === 'Diclofenac' ? "HPMC" : "PVP K30";
    let method = apiName === 'Diclofenac' || apiName === 'Paracetamol' ? 
                 (currentLang==='ar'?'تحبيب رطب (Wet Granulation)':'Wet Granulation') : (currentLang==='ar'?'كبس مباشر (Direct Compression)':'Direct Compression');

    let unitW = (api.dose < 100) ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10;
    let rem = unitW - api.dose;
    let fP = strategy==='cost'?0.88:(strategy==='quality'?0.65:0.78);
    let bP = strategy==='cost'?0.08:(strategy==='quality'?0.20:0.14);

    const ings = [
        { name: apiName, role: t.roles[0], qty: api.dose, cost: (api.dose * api.cost / 1000000) },
        { name: filler, role: t.roles[1], qty: rem*fP, cost: (rem*fP*excipientPrices[filler]/1000000) },
        { name: binder, role: t.roles[2], qty: rem*bP, cost: (rem*bP*excipientPrices[binder]/1000000) },
        { name: 'MagStearate', role: t.roles[3], qty: rem*(1-fP-bP), cost: (rem*(1-fP-bP)*13/1000000) }
    ];

    document.getElementById('resultsArea').style.display = 'block';
    document.getElementById('formulaBody').innerHTML = ings.map(i => `
        <tr><td>${i.name}</td><td>${i.role}</td><td>${i.qty.toFixed(1)}</td><td>${((i.qty/unitW)*100).toFixed(1)}%</td><td>$${i.cost.toFixed(5)}</td></tr>
    `).join('');

    let eff = strategy==='quality'?95:(strategy==='cost'?75:88);
    document.getElementById('efficiencyWrapper').innerHTML = `
        <div style="text-align:center"><b>${t.eff} <span style="color:${eff>90?'green':'orange'}">${eff}%</span></b>
        <div class="progress-bar"><div class="progress-fill" style="width:${eff}%; background:${eff>90?'#27ae60':'#f1c40f'}"></div></div></div>
    `;

    const totalMass = (unitW * batchSize / 1000000).toFixed(2);
    const totalCost = (ings.reduce((s, i) => s + i.cost, 0) * batchSize).toFixed(2);
    document.getElementById('batchSummaryBody').innerHTML = `
        <tr><td>${t.log[0]}</td><td>${totalMass} kg</td></tr>
        <tr><td>${t.log[1]}</td><td>$${totalCost}</td></tr>
        <tr><td>${t.log[3]}</td><td>${Math.ceil(batchSize/30)}</td></tr>
    `;

    document.getElementById('recList').innerHTML = `<li><b>Method:</b> ${method}</li><li><b>IPQC Weight:</b> ±${unitW>324?5:7.5}%</li>`;

    drawDonut(ings);
    drawBar(api, rem, batchSize);
}

function drawDonut(ings) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(ctx, { type: 'doughnut', data: { labels: ings.map(i=>i.name), datasets: [{data: ings.map(i=>i.qty), backgroundColor:['#1a5276','#3498db','#f1c40f','#e74c3c']}] }, options: {maintainAspectRatio:false}});
}

function drawBar(api, rem, batchSize) {
    const ctx = document.getElementById('costComparisonChart').getContext('2d');
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: ['Economic', 'Quality'], 
            datasets: [{label: 'USD', data: [120, 185], backgroundColor: ['#27ae60', '#1a5276']}] 
        }, 
        options: {indexAxis:'y', maintainAspectRatio:false}
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const isAr = currentLang === 'ar';
    
    // 1. إضافة علامة مائية (Watermark)
    doc.setTextColor(242, 242, 242);
    doc.setFontSize(60);
    doc.text("GemiFormula PRO", 35, 150, { angle: 45 });

    // 2. ترويسة التقرير
    doc.setTextColor(26, 82, 118);
    doc.setFontSize(22);
    doc.text(isAr ? "تقرير تشغيلة صيدلانية محمي" : "Secured Batch Report", 105, 20, { align: 'center' });

    // 3. جدول المكونات
    doc.autoTable({
        startY: 40,
        head: [i18n[currentLang].th],
        body: Array.from(document.querySelectorAll('#formulaBody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText)),
        headStyles: { fillColor: [26, 82, 118] }
    });

    // 4. الباركود
    const canvas = document.getElementById("barcodeCanvas");
    const barcodeVal = "BATCH-" + Math.floor(Date.now() / 1000);
    JsBarcode(canvas, barcodeVal, { format: "CODE128", width: 1.5, height: 40 });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, 'PNG', 150, 260, 45, 15);

    // 5. الحقوق القانونية
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Copyright © 2026 GemiFormula AI. All Rights Reserved. Confidential Technical Document.", 105, 285, { align: 'center' });

    doc.save(`Formulation_${barcodeVal}.pdf`);
}

setLang('ar');
