import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, ClipboardList } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const AdminLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // const token = localStorage.getItem('adminToken');
  // if (!token) {
  //   return <Navigate to="/vkadmin/login" replace />;
  // }

  const navigation = [
    { name: 'Categories', href: '/vkadmin/categories', icon: LayoutDashboard },
    { name: 'Exams', href: '/vkadmin/exams', icon: BookOpen },
    { name: 'Test Papers', href: '/vkadmin/tests', icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary-600">ExamEdge Admin</span>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
                <span className="font-medium">{item.name}</span>
              </Link>
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
      <div className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Admin Panel'}
          </h1>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
