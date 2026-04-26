import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Audits from './pages/Audits';
import History from './pages/History';
import PatientEntry from './pages/PatientEntry'; 
import PatientList from './pages/PatientList';
import HAIForm from './components/HAIForm'; 
// 1. استيراد مكون التقارير الجديد هنا
import Reports from './components/Reports'; 

function App() {
  return (
    <Router>
      <div dir="ltr" className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
        
        {/* Sidebar ثابت على اليسار */}
        <Sidebar />

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header - الهوية الرسمية لجامعة سوهاج */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
                SU-IPC Institutional Portal | Patient Safety Ambassador
              </h1>
            </div>
            
            <div className="text-[10px] font-black text-slate-400 uppercase">
                Last Sync: {new Date().toLocaleDateString('en-US')}
            </div>
          </header>

          {/* منطقة محتوى الصفحات */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Routes>
              {/* الصفحة الرئيسية للداشبورد */}
              <Route path="/" element={<Dashboard />} />
              
              {/* صفحة إدخال بيانات مريض جديد */}
              <Route path="/patients" element={<PatientEntry />} />
              
              {/* صفحة سجل المرضى (قائمة الحالات) */}
              <Route path="/cases" element={<PatientList />} />

              {/* صفحة تسجيل العدوى المكتسبة HAI */}
              <Route path="/hai" element={<HAIForm />} />

              {/* 2. إضافة مسار صفحة التقارير الجديد هنا */}
              <Route path="/reports" element={<Reports />} />

              {/* الصفحات الإضافية */}
              <Route path="/history" element={<History />} />
              <Route path="/audits" element={<Audits />} />

              {/* صفحة الخطأ 404 */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full font-black text-blue-900">
                   <h1 className="text-6xl">404</h1>
                   <p>PAGE NOT FOUND</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;