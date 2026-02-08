import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Bell,
  History,
  Compass,
  Zap,
  Settings,
  User,
  LayoutDashboard,
  Users,
  Database,
  Activity,
  BarChart3,
  Mail,
  Check,
  Circle,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationItem: React.FC<{ 
  notification: AppNotification; 
  onDismiss: (id: string) => void;
  onToggleRead: (id: string) => void;
}> = ({ 
  notification, 
  onDismiss, 
  onToggleRead 
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    if (diff < 0) {
      setCurrentX(diff);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (currentX < -80) {
      setCurrentX(-500);
      setTimeout(() => onDismiss(notification.id), 200);
    } else {
      setCurrentX(0);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-100">
      {/* Hidden Swipe Layer - Light Slate Theme */}
      <div className="absolute inset-0 bg-slate-100 flex items-center justify-end px-8 text-slate-400">
        <Trash2 className="w-5 h-5" />
      </div>
      
      {/* Sliding Content Layer */}
      <div 
        ref={itemRef}
        style={{ transform: `translateX(${currentX}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        className={`relative z-10 p-5 border-b border-slate-100 bg-white select-none transition-colors ${!notification.read ? 'bg-purple-50/20' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleRead(notification.id); }}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${notification.read ? 'border-slate-200 text-slate-200' : 'border-[rgb(152,16,250)] text-[rgb(152,16,250)] bg-white shadow-sm'}`}
            >
              {notification.read ? <Circle className="w-2.5 h-2.5 fill-current" /> : <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className={`text-[13px] leading-tight ${notification.read ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>
                {notification.title}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{notification.time}</span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed font-normal">
              {notification.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPublicMobileMenuOpen, setIsPublicMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.getNotifications(false);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Silently fail - keep empty array
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    setUserName(localStorage.getItem('userName'));
    setUserRole(localStorage.getItem('userRole'));

    // Fetch notifications on mount and location change (for internal pages)
    if (isInternalPage) {
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 30000); // 30 seconds

      // Cleanup interval on unmount or when leaving internal pages
      return () => clearInterval(pollInterval);
    }
  }, [location]);

  const isInternalPage = ['/dashboard', '/preferences', '/admin', '/discover', '/profile', '/history', '/onboarding'].includes(location.pathname);
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);
  const isHomePage = location.pathname === '/';
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (href: string) => {
    const currentPath = location.pathname + location.search;
    return href.includes('?') ? currentPath === href : location.pathname === href;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (isHomePage) {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsPublicMobileMenuOpen(false);
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await api.dismissNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const toggleReadStatus = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    try {
      if (notification.read) {
        await api.markNotificationAsUnread(id);
      } else {
        await api.markNotificationAsRead(id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    } catch (error) {
      console.error('Failed to toggle notification read status:', error);
    }
  };

  const userSections = [
    { title: 'RESEARCH ASSISTANT', links: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }] },
    { title: 'KNOWLEDGE ENGINE', links: [{ name: 'Discover', href: '/discover', icon: Compass }, { name: 'History', href: '/history', icon: History }] },
    { title: 'ACCOUNT', links: [{ name: 'Settings', href: '/preferences', icon: Settings }, { name: 'Profile', href: '/profile', icon: User }] }
  ];

  const adminSections = [
    { title: 'ADMIN CONTROL', links: [{ name: 'System Analytics', href: '/admin?tab=analytics', icon: BarChart3 }, { name: 'Subscribers', href: '/admin?tab=users', icon: Users }] },
    { title: 'OPERATIONS', links: [{ name: 'Knowledge Base', href: '/admin?tab=content', icon: Database }, { name: 'Dispatch Logs', href: '/admin?tab=newsletters', icon: Mail }, { name: 'Pipeline Workers', href: '/admin?tab=jobs', icon: Activity }] },
    { title: 'CONFIGURATION', links: [{ name: 'App Settings', href: '/admin?tab=settings', icon: Settings }] }
  ];

  const activeSections = userRole === 'admin' ? adminSections : userSections;
  const unreadCount = notifications.filter(n => !n.read).length;

  const PublicNavbar = () => (
    <>
      <header className="h-20 border-b border-slate-100 bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 lg:px-12 shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(152,16,250)] flex items-center justify-center shadow-lg shadow-purple-100">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">IntelliNews</span>
        </Link>
        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>
        )}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            {isAuthPage ? (
              <Link to="/" className="text-sm font-bold text-slate-900 hover:underline">Back to Home</Link>
            ) : userName ? (
              <Link
                to={userRole === 'admin' ? '/admin' : '/dashboard'}
                className="px-6 py-2.5 bg-[rgb(152,16,250)] text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-200 hover:bg-[rgb(130,10,220)] transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-xl transition-all">Sign In</Link>
                <Link to="/signup" className="px-6 py-2.5 bg-[rgb(152,16,250)] text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-200 hover:bg-[rgb(130,10,220)] transition-all">Get Started</Link>
              </>
            )}
          </div>
          {!isAuthPage && (
            <button className="md:hidden p-2 text-slate-500" onClick={() => setIsPublicMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>
    </>
  );

  if (!isInternalPage) {
    return (
      <div className="min-h-screen bg-white">
        <PublicNavbar />
        <main className="pt-20">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <aside className="hidden lg:flex w-[280px] flex-col fixed inset-y-0 border-r border-slate-200 bg-white z-[60]">
        <div className="p-8 pb-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(152,16,250)] flex items-center justify-center shadow-lg shadow-purple-100">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 block leading-none">IntelliNews</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userRole === 'admin' ? 'System Admin' : 'AI Intelligence'}</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
          {activeSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[11px] font-semibold text-slate-900 uppercase tracking-widest leading-none mb-4">{section.title}</h3>
              <div className="space-y-1">
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-normal text-[13px] ${
                      isActive(link.href) ? 'sidebar-item-active' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <link.icon className={`w-5 h-5 ${isActive(link.href) ? 'text-[rgb(152,16,250)]' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full h-12 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-[0.98]">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-[280px] flex flex-col">
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-[80] flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-slate-900">
                <span className="font-bold text-black uppercase">Hey {userName?.split(' ')[0] || 'Member'} - </span>
                <span className="text-slate-500 font-normal">{userRole === 'admin' ? "Ready to manage the systems?" : "here's what's happening today"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div 
              className="relative cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
                <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen ? 'text-[rgb(152,16,250)]' : 'text-slate-400 hover:text-slate-600'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                    {unreadCount}
                  </span>
                )}
            </div>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-[85]" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute top-14 right-0 w-[380px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-[90] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Notifications</h3>
                    <button onClick={markAllRead} className="text-[10px] font-bold text-[rgb(152,16,250)] uppercase hover:underline tracking-widest">Read all</button>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => <NotificationItem key={n.id} notification={n} onDismiss={dismissNotification} onToggleRead={toggleReadStatus} />)
                    ) : (
                      <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                          <Bell className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">All caught up! No alerts found.</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Swipe left to dismiss alerts</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 cursor-pointer group" onClick={() => navigate('/profile')}>
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400 p-0.5 group-hover:border-[rgb(152,16,250)] transition-colors">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`} alt="User" className="w-full h-full rounded-full bg-slate-100" />
                </div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="w-[280px] h-full bg-white flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-8 flex justify-between items-center">
                 <span className="text-xl font-black text-slate-900">IntelliNews</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400"><X className="w-6 h-6" /></button>
              </div>
              <nav className="flex-1 px-4 overflow-y-auto space-y-6 pb-20 pt-4">
                 {activeSections.map((section, idx) => (
                   <div key={idx} className="space-y-1">
                     <p className="px-4 text-[11px] font-semibold text-slate-900 uppercase tracking-widest mb-2">{section.title}</p>
                     {section.links.map(link => (
                        <Link key={link.name} to={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl font-normal text-[13px] ${isActive(link.href) ? 'sidebar-item-active' : 'text-slate-500'}`}>
                           <link.icon className="w-5 h-5" /> {link.name}
                        </Link>
                     ))}
                   </div>
                 ))}
              </nav>
              <div className="p-4 border-t">
                  <button onClick={handleLogout} className="w-full h-12 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;