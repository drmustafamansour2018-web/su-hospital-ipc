export default function KPI({ title, value, color, icon }) {
  // مصفوفة لتحديد الألوان بناءً على الكود المرسل (لو حابب تستخدم Tailwind classes)
  const colorClasses = {
    "#ef4444": "text-red-600 bg-red-50 border-red-200",
    "#dc2626": "text-red-700 bg-red-100 border-red-300",
    "#f97316": "text-orange-600 bg-orange-50 border-orange-200",
    "#3b82f6": "text-blue-600 bg-blue-50 border-blue-200",
    "#16a34a": "text-green-600 bg-green-50 border-green-200",
  };

  const selectedClass = colorClasses[color] || "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div 
      className={`relative overflow-hidden p-5 rounded-3xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group`}
    >
      {/* الشريط الجانبي الملون */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5" 
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            {title}
          </p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {value}
          </h2>
        </div>

        {/* أيقونة اختيارية تعطي شكل احترافي */}
        <div className={`p-2 rounded-xl ${selectedClass} transition-colors group-hover:scale-110 duration-300`}>
          {icon ? icon : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
      </div>

      {/* لمسة جمالية: خلفية باهتة بشعار بسيط */}
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] grayscale pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      </div>
    </div>
  );
}