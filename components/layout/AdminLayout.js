import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, Home, Package, ShoppingCart, Mail, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/authContext';
import { authService } from '../../lib/auth';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { title: 'Dashboard', icon: <Home size={22} />, path: '/admin' },
    { title: 'Products', icon: <Package size={22} />, path: '/admin/products' },
    { title: 'Orders', icon: <ShoppingCart size={22} />, path: '/admin/orders' },
    { title: 'Newsletter', icon: <Mail size={22} />, path: '/admin/newsletter' },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen">
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
        aria-label="Toggle navigation"
      >
        {isSidebarOpen ? (
          <X size={24} className="text-gray-700" />
        ) : (
          <Menu size={24} className="text-gray-700" />
        )}
      </button>

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4 border-r border-gray-100">
          <div className="flex items-center justify-center mb-8 p-4">
            <img src="/logo.png" alt="Logo" className="h-10" />
          </div>
          
          {user && (
            <div className="mb-6 p-4 bg-[#46c7c7]/20 rounded-xl">
              <p className="text-xs font-medium text-[#46c7c7] uppercase tracking-wide">Logged in as</p>
              <p className="font-semibold text-gray-900 truncate mt-1">{user.email}</p>
            </div>
          )}

          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all
                  ${router.pathname === item.path 
                    ? 'bg-[#46c7c7] text-white shadow-md' 
                    : 'text-gray-600 hover:bg-[#46c7c7]/20 hover:text-[#46c7c7]'}`}
              >
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-6 flex items-center gap-3 p-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={`transition-all duration-300 min-h-screen
        ${isSidebarOpen ? 'md:ml-64' : 'ml-0'} 
        p-4 md:p-6 lg:p-8 pt-20 md:pt-6`}
      >
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
