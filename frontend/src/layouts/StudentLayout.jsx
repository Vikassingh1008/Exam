import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, Award, LogOut, Bell, User, Sun, Moon } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useState, useEffect } from 'react';

const StudentLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navigation = [
    { name: 'My Exams', href: '/student/exams', icon: BookOpen },
    { name: 'Exam History', href: '/student/history', icon: Clock },
  ];

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try { setUserInfo(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">
              ExamEdge
            </span>
          </div>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Menu
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              dispatch(logout());
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 w-full rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:text-red-500 text-gray-400 transition-colors" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden dark:bg-slate-950 transition-colors duration-200">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-8 z-10 sticky top-0 transition-colors duration-200">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            {navigation.find(n => location.pathname.includes(n.href))?.name || 'My Exams'}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-all"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 mx-2"></div>
            <button className="flex items-center gap-3 p-1 pr-3 rounded-full border border-gray-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all group">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 transition-colors">
                <User size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{userInfo?.name || 'Student Profile'}</span>
            </button>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
