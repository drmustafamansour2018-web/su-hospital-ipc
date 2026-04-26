// src/core/haiEngine.js

export const calculateHAI = (data) => {
  if (!data) return { score: 0, status: "Normal", reasons: [], alerts: [] };

  let score = 0;
  const reasons = [];
  const alerts = []; // تنبيهات للإجراءات الفورية

  // 1. المؤشرات الحيوية (Clinical Signs)
  if (data.temperature >= 38.5) {
    score += 25;
    reasons.push("High Grade Fever (≥38.5°C)");
  } else if (data.temperature >= 38) {
    score += 15;
    reasons.push("Low Grade Fever");
  }

  // 2. التحاليل المخبرية (Laboratory Findings)
  const wbc = Number(data.wbc || 0);
  if (wbc > 12000 || wbc < 4000) {
    score += 25;
    reasons.push("Abnormal WBC Count (Leukocytosis/Leukopenia)");
  }

  // 3. تحليل مخاطر الأجهزة (Device-Associated Risks)
  // في مكافحة العدوى، المخاطر تزيد بزيادة عدد أيام تركيب الجهاز
  if (data.hasVentilator) {
    const ventDays = Number(data.ventDays || 0);
    score += 20 + (ventDays * 2); // تزيد الخطورة 2% كل يوم
    reasons.push(`Ventilator Use (${ventDays} days)`);
    if (ventDays > 48) alerts.push("VAP Bundle Audit Required");
  }

  if (data.hasCentralLine) {
    const lineDays = Number(data.lineDays || 0);
    score += 20;
    reasons.push(`Central Line Present (${lineDays} days)`);
    if (lineDays > 72) alerts.push("Evaluate Central Line Necessity");
  }

  if (data.hasCatheter) {
    score += 15;
    reasons.push("Urinary Catheter Present");
  }

  // 4. الموقع والخطورة (Location Factor)
  if (data.department?.toUpperCase().includes("ICU")) {
    score += 10;
    reasons.push("Critical Care Unit Risk");
  }

  // 5. الحالة النهائية (Final Status Determination)
  score = Math.min(score, 100); // لا يتجاوز 100%

  let status = "Normal";
  let color = "green";

  if (score >= 75) {
    status = "HAI Confirmed / High Suspicion";
    color = "red";
  } else if (score >= 45) {
    status = "High Risk / Surveillance Needed";
    color = "orange";
  } else if (score >= 20) {
    status = "Monitoring";
    color = "blue";
  }

  return { 
    score, 
    status, 
    reasons, 
    alerts, 
    color,
    timestamp: new Date().toISOString()
  };
};