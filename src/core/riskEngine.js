// src/core/riskEngine.js

/**
 * محرك تقييم المخاطر عند الدخول (Admission Risk Engine)
 * يقيم مدى قابلية المريض للإصابة بالعدوى بناءً على تاريخه المرضي وحالته عند الدخول.
 */
export function calculateRisk(patient) {
  if (!patient) return 0;

  let score = 0;

  // 1. عامل العمر (Physiological Reserve)
  const age = Number(patient.age || 0);
  if (age > 75) score += 35; // كبار السن جداً
  else if (age > 60) score += 20;
  else if (age < 5) score += 25; // الأطفال (مناعة لم تكتمل)

  // 2. التشخيص عالي الخطورة (Comorbidities & Diagnosis)
  const highRiskDiseases = {
    "Sepsis": 45,
    "COVID-19": 40,
    "Tuberculosis": 35,
    "Pneumonia": 30,
    "Diabetes": 20,      // مريض السكر أكثر عرضة للعدوى
    "Renal Failure": 25  // الفشل الكلوي
  };

  if (patient.disease && highRiskDiseases[patient.disease]) {
    score += highRiskDiseases[patient.disease];
  }

  // 3. درجة التدخل الطبي (Invasiveness Level)
  // هل المريض داخل لعملية جراحية أم علاج تحفظي؟
  if (patient.isSurgical) score += 20;
  if (patient.isImmunocompromised) score += 40; // نقص المناعة

  // 4. القسم (Environmental Risk)
  const dept = patient.department?.name || patient.department || "";
  if (dept.includes("ICU")) score += 25;
  if (dept.includes("Neonatal")) score += 30;
  if (dept.includes("Burn Unit")) score += 40; // وحدة الحروق خطر جداً

  // 5. التاريخ المرضي (Previous Admissions)
  if (patient.hadRecentSurgery) score += 15;

  return Math.min(score, 100);
}