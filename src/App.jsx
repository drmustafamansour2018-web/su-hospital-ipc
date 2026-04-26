import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react'; // إضافة useEffect و useState
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Audits from './pages/Audits';
import History from './pages/History';
import PatientEntry from './pages/PatientEntry'; 
import PatientList from './pages/PatientList';
import HAIForm from './components/HAIForm'; 
import Reports from './components/Reports'; 
import ViolationsPage from './pages/ViolationsPage'; 

function App() {
  // 1. نظام حفظ الوضع الليلي في المتصفح
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // 2. تحديث كلاس html عند تغيير الوضع
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <Router>
      {/* 3. إضافة كلاسات dark للكونتينر الرئيسي */}
      <div dir="ltr" className={`flex min-h-screen font-sans selection:bg-blue-100 transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'
      }`}>
        
        {/* Sidebar ثابت على اليسار */}
        <Sidebar />

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header - الهوية الرسمية لجامعة سوهاج مع زر التبديل */}
          <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-8 justify-between sticky top-0 z-10 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                  SU-IPC | Smart IPC Governance System
                </h1>
              </div>

              {/* زر تبديل الوضع الليلي (Dark Mode Toggle) */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-all text-lg shadow-inner"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            
            <div className="flex flex-col items-end">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                    Last Sync: {new Date().toLocaleDateString('en-US')}
                </div>
                {darkMode && <span className="text-[8px] text-blue-400 font-bold">DARK MODE ACTIVE</span>}
            </div>
          </header>

          {/* منطقة محتوى الصفحات */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<PatientEntry />} />
              <Route path="/cases" element={<PatientList />} />
              <Route path="/hai" element={<HAIForm />} />
              <Route path="/violations" element={<ViolationsPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<History />} />
              <Route path="/audits" element={<Audits />} />

              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full font-black text-blue-900 dark:text-blue-400">
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