import { ref, push } from "firebase/database";
import { db } from "../firebase/config";
import getDecision from "./getDecision";
import { z } from "zod"; // سنستخدم Zod اللي عندك

// 1. تعريف "Schema" لبيانات المريض لضمان جودة البيانات
const patientSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  age: z.coerce.number().min(0).max(120),
  department: z.string(),
  // أضف أي حقول أخرى تأتي من الـ Form هنا
});

export default async function savePatient(form) {
  try {
    // 2. التأكد من صحة البيانات قبل أي معالجة
    const validatedForm = patientSchema.parse(form);

    // 3. استدعاء محرك القرار (العقل المدبر)
    const { risk } = getDecision(validatedForm);

    // 4. بناء كائن المريض بمعايير iPC احترافية
    const patient = {
      ...validatedForm,
      riskScore: risk,
      status: "active",
      // حالة الـ HAI لا تعتمد فقط على الـ Score بل يمكن ربطها بالـ haiEngine لاحقاً
      hai: risk > 75, 
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };

    // 5. الحفظ في Firebase Realtime Database
    const newPatientRef = await push(ref(db, "patients"), patient);
    
    return { success: true, id: newPatientRef.key };

  } catch (error) {
    // التعامل مع أخطاء التحقق أو أخطاء السيرفر
    console.error("IPC Save Error:", error);
    return { 
      success: false, 
      error: error instanceof z.ZodError ? "بيانات المدخلات غير صحيحة" : "فشل الاتصال بالسيرفر" 
    };
  }
}