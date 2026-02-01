const apiDb = {
    "Paracetamol": { dose: 500, density: 0.6, moisture: false, cost: 15 },
    "Metronidazole": { dose: 500, density: 0.5, moisture: true, cost: 40 },
    "Diclofenac": { dose: 50, density: 0.7, moisture: true, cost: 85 },
    "Ibuprofen": { dose: 200, density: 0.5, moisture: false, cost: 25 }
};

let chartInstance = null;

function calculateFormula() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // 1. حساب الوزن المثالي تلقائياً
    // إذا كانت الجرعة صغيرة، نرفع الوزن لسهولة التصنيع، إذا كانت كبيرة نزيد 30% كمواد مضافة
    let unitWeight = api.dose < 100 ? 150 : Math.ceil((api.dose * 1.3) / 10) * 10;
    
    // 2. توزيع النسب بناءً على الاستراتيجية
    let filler, binder, others;
    const excipientTotal = unitWeight - api.dose;

    if (strategy === "cost") {
        filler = excipientTotal * 0.85; binder = excipientTotal * 0.10; others = excipientTotal * 0.05;
    } else if (strategy === "quality") {
        filler = excipientTotal * 0.60; binder = excipientTotal * 0.25; others = excipientTotal * 0.15;
    } else {
        filler = excipientTotal * 0.75; binder = excipientTotal * 0.15; others = excipientTotal * 0.10;
    }

    // 3. الحسابات اللوجستية
    const totalMassKg = (unitWeight * batchSize) / 1000000;
    const volumeM3 = (totalMassKg / (api.density * 1000)).toFixed(4);
    const areaM2 = (volumeM3 * 2.2).toFixed(2); // مساحة التخزين مع الممرات
    const totalCost = (totalMassKg * api.cost).toFixed(2);
    const boxes = Math.ceil(batchSize / 30); // 30 قرص لكل عبوة

    // 4. عرض النتائج
    document.getElementById('resultsArea').style.display = 'block';
    showLogistics(unitWeight, totalMassKg, volumeM3, areaM2, totalCost, boxes);
    showRecs(apiName, api, strategy);
    drawChart(api.dose, filler, binder, others);
}

function showLogistics(w, mass, vol, area, cost, boxes) {
    const html = `
        <tr><td><b>الوزن المثالي للوحدة:</b></td><td>${w} ملجم</td></tr>
        <tr><td><b>كتلة التشغيلة الإجمالية:</b></td><td>${mass.toFixed(2)} كجم</td></tr>
        <tr><td><b>الحجم الفيزيائي (Volume):</b></td><td>${vol} متر مكعب</td></tr>
        <tr><td><b>مساحة التخزين المطلوبة:</b></td><td>${area} متر مربع</td></tr>
        <tr><td><b>التكلفة التقديرية للمواد:</b></td><td>$${cost}</td></tr>
        <tr><td><b>عدد العبوات النهائية (30 وحدة):</b></td><td>${boxes} عبوة</td></tr>
    `;
    document.getElementById('logisticsTable').innerHTML = html;
}

function showRecs(name, api, strategy) {
    const list = document.getElementById('recommendationsText');
    let recs = [
        `<b>طريقة التصنيع:</b> ${api.dose >= 500 ? "التحبيب الرطب (Wet Granulation)" : "الكبس المباشر (Direct Compression)"}`,
        `<b>ظروف التخزين:</b> درجة حرارة 20-25 مئوية ${api.moisture ? "مع رطوبة أقل من 60%" : ""}`,
        `<b>خيار التغليف الأفضل:</b> ${api.moisture ? "ألومنيوم-ألومنيوم (Alu-Alu)" : "PVC/PVDC Standard"}`,
        `<b>نصيحة الاستراتيجية:</b> ${strategy === 'quality' ? "استخدم MCC PH-102 لضمان صلابة ممتازة." : "استخدم نشا الذرة لتقليل التكاليف."}`
    ];
    list.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}

function drawChart(api, filler, binder, others) {
    const ctx = document.getElementById('formulaChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['المادة الفعالة', 'المواد المالئة', 'المواد الرابطة', 'أخرى'],
            datasets: [{
                data: [api, filler, binder, others],
                backgroundColor: ['#2c3e50', '#27ae60', '#f1c40f', '#e74c3c']
            }]
        }
    });
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("تقرير تحسين الصيغة الدوائية", 150, 20, { align: 'right' });
    doc.autoTable({
        startY: 30,
        head: [['المعيار', 'القيمة']],
        body: Array.from(document.querySelectorAll('#logisticsTable tr')).map(tr => [tr.cells[1].innerText, tr.cells[0].innerText]),
        styles: { font: 'courier', halign: 'right' }
    });
    doc.save("Pharma_Report.pdf");
}
