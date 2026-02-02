// أسعار المكونات التقديرية لكل كجم
const excipientPrices = { filler: 5, binder: 25, other: 15 };

function calculateAll() {
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const form = document.getElementById('dosageForm').value;
    const batch = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // 1. حساب الوزن التلقائي
    let unitW = (form === 'syrup') ? 100 : (api.dose < 100 ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10);
    
    // 2. توزيع المكونات بناءً على الاستراتيجية
    let rem = unitW - api.dose;
    let f_amt, b_amt, o_amt;
    if(strategy === 'cost') { f_amt = rem*0.85; b_amt = rem*0.1; o_amt = rem*0.05; }
    else if(strategy === 'quality') { f_amt = rem*0.6; b_amt = rem*0.25; o_amt = rem*0.15; }
    else { f_amt = rem*0.75; b_amt = rem*0.15; o_amt = rem*0.1; }

    // 3. حسابات التكلفة والنسب لكل عنصر
    const ingredients = [
        { name: apiName, role: "Active (API)", qty: api.dose, perc: (api.dose/unitW)*100, cost: (api.dose * api.cost / 1000000) },
        { name: "Filler (MCC/Lactose)", role: "Diluent", qty: f_amt, perc: (f_amt/unitW)*100, cost: (f_amt * excipientPrices.filler / 1000000) },
        { name: "Binder (PVP/HPMC)", role: "Adhesive", qty: b_amt, perc: (b_amt/unitW)*100, cost: (b_amt * excipientPrices.binder / 1000000) },
        { name: "Lubricant/Others", role: "Flow/Glidant", qty: o_amt, perc: (o_amt/unitW)*100, cost: (o_amt * excipientPrices.other / 1000000) }
    ];

    // 4. عرض النتائج في الجداول
    document.getElementById('resultsArea').style.display = 'block';
    
    // أ. جدول التركيبة الأساسي
    let formulaHtml = "";
    ingredients.forEach(ing => {
        formulaHtml += `<tr>
            <td>${ing.name}</td>
            <td>${ing.role}</td>
            <td>${ing.qty.toFixed(1)} mg</td>
            <td>${ing.perc.toFixed(1)}%</td>
            <td>$${ing.cost.toFixed(4)}</td>
        </tr>`;
    });
    document.getElementById('formulaBody').innerHTML = formulaHtml;

    // ب. ملخص التشغيلة المختصر
    const totalMass = (unitW * batch / 1000000).toFixed(2);
    const totalCost = (ingredients.reduce((sum, i) => sum + i.cost, 0) * batch).toFixed(2);
    const area = (totalMass / (api.dens * 400)).toFixed(2);
    
    document.getElementById('batchSummaryBody').innerHTML = `
        <tr><td>إجمالي وزن التشغيلة:</td><td>${totalMass} كجم</td></tr>
        <tr><td>تكلفة الإنتاج الإجمالية:</td><td>$${totalCost}</td></tr>
        <tr><td>المساحة التخزينية المقدرة:</td><td>${area} م²</td></tr>
        <tr><td>العبوات النهائية:</td><td>${Math.ceil(batch/30)} عبوة</td></tr>
    `;

    // ج. التوصيات المختصرة و IPQC
    renderCompactRecs(api, form, unitW);
    drawChart(api.dose, f_amt, b_amt, o_amt);
}

function renderCompactRecs(api, form, unitW) {
    const list = document.getElementById('recList');
    const isAr = currentLang === 'ar';
    
    // حدود تفاوت الوزن
    const limit = unitW > 324 ? 5 : 7.5;
    const range = `${(unitW * (1 - limit/100)).toFixed(1)} - ${(unitW * (1 + limit/100)).toFixed(1)}`;

    list.innerHTML = `
        <li><b>التغليف:</b> ${api.moist ? 'Alu-Alu' : 'PVC/PVDC'}</li>
        <li><b>المعالجة:</b> ${unitW > 500 ? 'التحبيب الرطب' : 'الكبس المباشر'}</li>
        <hr>
        <span style="color:var(--p); font-weight:bold;">معايير الجودة (IPQC):</span>
        <li><b>تفاوت الوزن:</b> ${range} ملجم (±${limit}%)</li>
        <li><b>الصلابة:</b> 8 - 14 كجم</li>
        <li><b>التفكك:</b> < 15 دقيقة</li>
    `;
}
