const apiDb = {
    "Paracetamol": { dose: 500, cost: 14.5 },
    "Metronidazole": { dose: 500, cost: 38.0 },
    "Diclofenac": { dose: 50, cost: 82.0 },
    "Ibuprofen": { dose: 200, cost: 26.0 }
};

const i18n = {
    ar: {
        title: "المنظم الصيدلاني الذكي PRO",
        th: ["المادة", "الوظيفة", "الكمية (mg)", "النسبة %", "التكلفة $"],
        eff: "مؤشر كفاءة الصيغة:"
    },
    en: {
        title: "PharmaForm AI PRO",
        th: ["Component", "Role", "Qty (mg)", "Perc %", "Cost $"],
        eff: "Formula Efficiency Index:"
    }
};

let currentLang = 'ar';
let charts = { donut: null, bar: null };

function setLang(lang) {
    currentLang = lang;
    document.getElementById('mainHtml').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('table-head').innerHTML = i18n[lang].th.map(h => `<th>${h}</th>`).join('');
    if(document.getElementById('resultsArea').style.display === 'block') calculateAll();
}

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const api = apiDb[apiName];
    const unitW = api.dose < 100 ? 150 : 650;
    
    const ings = [
        { name: apiName, role: 'API', qty: api.dose, cost: (api.dose * api.cost / 1000000) },
        { name: 'Filler', role: 'Filler', qty: unitW - api.dose - 20, cost: 0.002 },
        { name: 'Binder/Lub', role: 'Excipient', qty: 20, cost: 0.005 }
    ];

    document.getElementById('resultsArea').style.display = 'block';
    document.getElementById('formulaBody').innerHTML = ings.map(i => `
        <tr><td>${i.name}</td><td>${i.role}</td><td>${i.qty}</td><td>${((i.qty/unitW)*100).toFixed(1)}%</td><td>$${i.cost.toFixed(4)}</td></tr>
    `).join('');

    const eff = 92;
    document.getElementById('efficiencyWrapper').innerHTML = `
        <b>${i18n[currentLang].eff} ${eff}%</b>
        <div class="progress-bar"><div class="progress-fill" style="width:${eff}%; background:#27ae60"></div></div>
    `;

    drawCharts(ings);
}

function drawCharts(ings) {
    const ctxD = document.getElementById('formulaChart').getContext('2d');
    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(ctxD, {
        type: 'doughnut',
        data: { labels: ings.map(i=>i.name), datasets: [{data: ings.map(i=>i.qty), backgroundColor:['#1a5276','#3498db','#f1c40f']}] },
        options: { maintainAspectRatio: false }
    });

    const ctxB = document.getElementById('costComparisonChart').getContext('2d');
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctxB, {
        type: 'bar',
        data: { labels: ['Economy', 'Quality'], datasets: [{label: 'Cost $', data: [100, 150], backgroundColor: ['#27ae60', '#1a5276']}] },
        options: { indexAxis: 'y', maintainAspectRatio: false }
    });
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. العلامة المائية
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(50);
    doc.text("GemiFormula PRO - CONFIDENTIAL", 20, 150, { angle: 45 });

    // 2. العنوان
    doc.setTextColor(26, 82, 118);
    doc.setFontSize(20);
    doc.text("Pharmaceutical Batch Report", 105, 20, { align: 'center' });

    // 3. الجدول
    doc.autoTable({
        startY: 40,
        head: [i18n[currentLang].th],
        body: Array.from(document.querySelectorAll('#formulaBody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText)),
        headStyles: { fillColor: [26, 82, 118] }
    });

    // 4. الباركود
    const canvas = document.getElementById("barcodeCanvas");
    JsBarcode(canvas, "BATCH-" + Date.now().toString().slice(-6), { format: "CODE128" });
    doc.addImage(canvas.toDataURL("image/png"), 'PNG', 150, 260, 40, 15);

    // 5. الحقوق
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("© 2026 GemiFormula AI - All Rights Reserved.", 105, 290, { align: 'center' });

    doc.save("GemiFormula_Report.pdf");
}

// البدء بالعربية
setLang('ar');
