export const departments = [
  // ================= العنايات المركزة =================
  { id: "ICU_ADULT", name: "عناية مركزة كبار", abbr: "ICU", category: "critical" },
  { id: "PICU", name: "عناية أطفال مركزة", abbr: "PICU", category: "critical" },
  { id: "CCU", name: "عناية قلب", abbr: "CCU", category: "critical" },
  { id: "STROKE_UNIT", name: "وحدة السكتة الدماغية", abbr: "SU", category: "critical" },
  { id: "NICU", name: "عناية حديثي الولادة", abbr: "NICU", category: "critical" },
  { id: "IMCU", name: "عناية متوسطة", abbr: "IMCU", category: "critical" },

  // ================= العمليات =================
  { id: "GENERAL_SURG_OP", name: "عمليات جراحة عامة", abbr: "GS-OR", category: "operation" },
  { id: "ORTHO_OP", name: "عمليات عظام", abbr: "ORTHO-OR", category: "operation" },
  { id: "NEURO_SURG_OP", name: "عمليات مخ وأعصاب", abbr: "NS-OR", category: "operation" },
  { id: "ENT_OP", name: "عمليات أنف وأذن", abbr: "ENT-OR", category: "operation" },
  { id: "GYNE_OP", name: "عمليات نساء وتوليد", abbr: "GYN-OR", category: "operation" },
  { id: "UROLOGY_OP", name: "عمليات مسالك", abbr: "URO-OR", category: "operation" },
  { id: "OPHTH_OP", name: "عمليات رمد", abbr: "OPH-OR", category: "operation" },
  { id: "PLASTIC_OP", name: "عمليات تجميل", abbr: "PLS-OR", category: "operation" },
  { id: "MICRO_SURG_OP", name: "جراحات ميكروسكوبية", abbr: "MICRO-OR", category: "operation" },
  { id: "CATH_LAB", name: "قسطرة القلب", abbr: "CATH", category: "operation" },

  // ================= أقسام باطنة =================
  { id: "INTERNAL_M", name: "باطنة رجال", abbr: "IM-M", category: "medical" },
  { id: "INTERNAL_F", name: "باطنة سيدات", abbr: "IM-F", category: "medical" },
  { id: "CARDIO", name: "قلب", abbr: "CARD", category: "medical" },
  { id: "CHEST", name: "صدرية", abbr: "CHEST", category: "medical" },
  { id: "NEURO", name: "عصبية", abbr: "NEURO", category: "medical" },
  { id: "DERMA", name: "جلدية", abbr: "DERM", category: "medical" },
  { id: "RHEUM", name: "روماتيزم", abbr: "RHEUM", category: "medical" },
  { id: "ONCO", name: "أورام", abbr: "ONC", category: "medical" },
  { id: "VASCULAR", name: "أوعية دموية", abbr: "VASC", category: "medical" },
  { id: "NEPHRO_ADULT", name: "كلى كبار", abbr: "NEPH-A", category: "medical" },
  { id: "NEPHRO_PED", name: "كلى أطفال", abbr: "NEPH-P", category: "medical" },

  // ================= جراحة =================
  { id: "GENERAL_SURG", name: "جراحة عامة", abbr: "GS", category: "surgical" },
  { id: "ORTHO", name: "عظام", abbr: "ORTHO", category: "surgical" },
  { id: "NEURO_SURG", name: "مخ وأعصاب", abbr: "NS", category: "surgical" },
  { id: "UROLOGY", name: "مسالك", abbr: "URO", category: "surgical" },
  { id: "ENT", name: "أنف وأذن", abbr: "ENT", category: "surgical" },
  { id: "OPHTH", name: "رمد", abbr: "OPH", category: "surgical" },
  { id: "PLASTIC", name: "تجميل", abbr: "PLS", category: "surgical" },
  { id: "PED_SURG", name: "جراحة أطفال", abbr: "PED-SURG", category: "surgical" },
  { id: "GYNE", name: "نساء وتوليد", abbr: "GYN", category: "surgical" },

  // ================= أقسام خاصة =================
  { id: "ENDOSCOPY", name: "مناظير", abbr: "ENDO", category: "special" },
  { id: "TROPICAL", name: "متوطنة", abbr: "TROP", category: "special" },
  { id: "PEDIATRICS", name: "أطفال", abbr: "PED", category: "special" }
];