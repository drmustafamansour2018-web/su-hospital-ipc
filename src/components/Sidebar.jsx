import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { 
      nameEn: 'Dashboard',
      nameAr: 'لوحة التحكم',
      path: '/', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
        </svg>
      ) 
    },
    { 
      nameEn: 'Patients Entry',
      nameAr: 'تسجيل مريض',
      path: '/patients', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ) 
    },
    { 
      nameEn: 'HAI Surveillance',
      nameAr: 'ترصد العدوى',
      path: '/hai', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ) 
    },
    // --- السطر المضاف الجديد (سجل التقارير) ---
    { 
      nameEn: 'Reports History',
      nameAr: 'سجل التقارير',
      path: '/reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) 
    },
    { 
      nameEn: 'Surveillance Log',
      nameAr: 'سجل الحالات',
      path: '/cases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ) 
    },
    { 
      nameEn: 'OR Audits',
      nameAr: 'فحص العمليات',
      path: '/audits', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) 
    },
    { 
      nameEn: 'History',
      nameAr: 'الأرشيف',
      path: '/history', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) 
    }
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto" dir="ltr">
      <div className="p-8">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
            <span className="text-white font-black text-xl tracking-tighter">SU</span>
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="font-black text-slate-900 text-sm tracking-tight uppercase">Sohag Hospitals</h1>
            <p className="text-[9px] font-bold text-blue-600 mt-1 uppercase tracking-widest">Infection Control</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-blue-700 text-white shadow-xl shadow-blue-100 translate-x-[5px]' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-blue-700'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-700'} transition-colors`}>
                  {item.icon}
                </div>
                
                <div className="flex flex-col items-start leading-tight">
                  <span className={`text-[12px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-700'}`}>
                    {item.nameEn}
                  </span>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.nameAr}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Card */}
      <div className="mt-auto p-8">
        <div className="bg-slate-900 rounded-[2rem] p-5 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-white font-black text-[10px] uppercase tracking-wider mb-1">Safety Ambassador</p>
            <p className="text-blue-400 text-[10px] font-bold">سفير سلامة المرضى</p>
            <div className="w-8 h-[2px] bg-blue-600 mt-3 rounded-full group-hover:w-full transition-all duration-500"></div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-600/20 rounded-full blur-xl"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;