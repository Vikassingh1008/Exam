import { Link, NavLink, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, ClipboardList, Menu, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useState, useEffect } from 'react';

const AdminLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Categories', href: '/vkadmin/categories', icon: LayoutDashboard },
    { name: 'Exams', href: '/vkadmin/exams', icon: BookOpen },
    { name: 'Test Papers', href: '/vkadmin/tests', icon: ClipboardList },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out xl:translate-x-0 xl:static xl:inset-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary-600">ExamEdge Admin</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="xl:hidden text-gray-500 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: isNavLinkActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isNavLinkActive || isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {({ isActive: isNavLinkActive }) => (
                  <>
                    <Icon size={20} className={isNavLinkActive || isActive ? 'text-primary-600' : 'text-gray-400'} />
                    <span className="font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              dispatch(logout());
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminInfo');
              navigate('/vkadmin/login');
            }}
            className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-red-600 w-full rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 sm:px-8 shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="xl:hidden p-2 -ml-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 truncate">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Admin Panel'}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
