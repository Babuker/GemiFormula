function calculateAll() {
    const t = i18n[currentLang];
    const apiName = document.getElementById('apiSelect').value;
    const strategy = document.getElementById('strategy').value;
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const api = apiDb[apiName];

    // 1. منطق اختيار المواد المضافة بناءً على التوافقية والكفاءة
    let fillerName, binderName, lubricantName;
    let manufacturingMethod = "";

    // تحليل التوافقية (Compatibility Logic)
    if (apiName === 'Diclofenac') {
        fillerName = "Dicalcium Phosphate (DCP)"; // توافقية كيميائية ممتازة
        binderName = "HPMC (Hydroxypropyl Methylcellulose)";
        manufacturingMethod = currentLang === 'ar' ? "تحبيب رطب (لضمان توزيع الجرعة الصغيرة)" : "Wet Granulation (for low dose uniformity)";
    } else if (apiName === 'Paracetamol') {
        fillerName = "Pregelatinized Starch"; // كفاءة عالية في التفكك للجرعات الكبيرة
        binderName = "Povidone (PVP K30)";
        manufacturingMethod = currentLang === 'ar' ? "التحبيب الرطب (بسبب حجم الجرعة)" : "Wet Granulation (due to high dose bulk)";
    } else {
        fillerName = "Microcrystalline Cellulose (MCC PH-102)"; // الكفاءة القصوى
        binderName = "PVP K30";
        manufacturingMethod = currentLang === 'ar' ? "الكبس المباشر (كفاءة اقتصادية)" : "Direct Compression (Cost-efficient)";
    }
    lubricantName = "Magnesium Stearate"; // المادة الأمثل عالميًا للكفاءة والسعر

    // 2. توزيع النسب (Optimization)
    let unitW = (api.dose < 100) ? 150 : Math.ceil(api.dose * 1.35 / 10) * 10;
    let rem = unitW - api.dose;
    let f, b, o;
    
    // موازنة الكلفة (Cost Balancing)
    if(strategy === 'cost') { f = rem*0.88; b = rem*0.08; o = rem*0.04; }
    else if(strategy === 'quality') { f = rem*0.65; b = rem*0.20; o = rem*0.15; }
    else { f = rem*0.78; b = rem*0.14; o = rem*0.08; }

    // 3. عرض النتائج في الجدول
    const ings = [
        { name: apiName, role: t.roles[0], qty: api.dose, perc: (api.dose/unitW)*100, cost: (api.dose * api.cost / 1000000) },
        { name: fillerName, role: t.roles[1], qty: f, perc: (f/unitW)*100, cost: (f * 6.5 / 1000000) },
        { name: binderName, role: t.roles[2], qty: b, perc: (b/unitW)*100, cost: (b * 24 / 1000000) },
        { name: lubricantName, role: t.roles[3], qty: o, perc: (o/unitW)*100, cost: (o * 15 / 1000000) }
    ];

    // استكمال عرض النتائج...
    renderFinalReport(ings, unitW, batchSize, manufacturingMethod, t);
}

function renderFinalReport(ings, unitW, batch, method, t) {
    // عرض جدول التركيبة
    document.getElementById('formulaBody').innerHTML = ings.map(ing => `
        <tr><td>${ing.name}</td><td>${ing.role}</td><td>${ing.qty.toFixed(1)} mg</td><td>${ing.perc.toFixed(1)}%</td><td>$${ing.cost.toFixed(4)}</td></tr>
    `).join('');

    // عرض التوصيات مع طريقة التصنيع الناتجة
    document.getElementById('recList').innerHTML = `
        <li class="highlight-rec"><b>${currentLang === 'ar' ? 'طريقة التصنيع المقترحة:' : 'Suggested Method:'}</b> ${method}</li>
        <hr>
        <li>${t.recLabels[3]} ±${unitW > 324 ? 5 : 7.5}%</li>
        <li>${t.recLabels[4]} 8-14 kg</li>
    `;
}
