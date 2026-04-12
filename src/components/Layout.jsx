import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Home, Calendar, Search, User, Bell, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabState, setTabState] = useState({});
  const currentPath = location.pathname;

  const handleTabClick = (path) => {
    if (tabState[path] === currentPath) {
      navigate(path);
      setTabState(s => ({ ...s, [path]: path }));
    } else {
      const target = tabState[path] || path;
      navigate(target);
      setTabState(s => ({ ...s, [path]: target }));
    }
  };

  useEffect(() => {
    const navItems = role === 'caregiver' ? caregiverNav : role === 'admin' ? adminNav : familyNav;
    const tab = navItems.find(t => currentPath.startsWith(t.path))?.path || '/';
    setTabState(s => ({ ...s, [tab]: currentPath }));
  }, [currentPath]);

  const { user } = useAuth();
  const role = user?.role || 'family';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const familyNav = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/Caregivers', icon: Search, label: 'Find Care' },
    { path: '/MyBookings', icon: Calendar, label: 'Bookings' },
    { path: '/ChatList', icon: MessageCircle, label: 'Messages' },
    { path: '/Profile', icon: User, label: 'Profile' },
  ];

  const caregiverNav = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/MyBookings', icon: Calendar, label: 'Jobs' },
    { path: '/ChatList', icon: MessageCircle, label: 'Messages' },
    { path: '/Profile', icon: User, label: 'Profile' },
  ];

  const adminNav = [
    { path: '/', icon: Home, label: 'Overview' },
    { path: '/AdminBookings', icon: Calendar, label: 'Bookings' },
    { path: '/AdminUsers', icon: Search, label: 'Users' },
    { path: '/Profile', icon: User, label: 'Profile' },
  ];

  const navItems = role === 'caregiver' ? caregiverNav : role === 'admin' ? adminNav : familyNav;

  // Per-tab scroll persistence
  const scrollRef = useRef({});
  const mainRef = useRef(null);
  const historyRef = useRef([location.pathname]);

  // Determine push vs pop for slide direction
  const prevPath = historyRef.current[historyRef.current.length - 2];
  const navItems_flat = [...(role === 'caregiver' ? ['/','  /MyBookings','/ChatList','/Profile'] : role === 'admin' ? ['/','/AdminBookings','/AdminUsers','/Profile'] : ['/','/Caregivers','/MyBookings','/ChatList','/Profile'])];
  const isTabSwitch = navItems_flat.includes(location.pathname);
  const xIn = isTabSwitch ? 0 : 30;
  const xOut = isTabSwitch ? 0 : -30;

  useEffect(() => {
    const hist = historyRef.current;
    if (hist[hist.length - 1] !== location.pathname) {
      hist.push(location.pathname);
    }
  }, [location.pathname]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const saved = scrollRef.current[location.pathname] || 0;
    el.scrollTop = saved;
    const onScroll = () => { scrollRef.current[location.pathname] = el.scrollTop; };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto relative select-none" style={{ overscrollBehavior: 'none', paddingTop: 'env(safe-area-inset-top)' }}>
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20" style={{ overscrollBehavior: 'none' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: xIn }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: xOut }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-around px-3 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = currentPath === path || currentPath.startsWith(path + '/');
            return (
              <button
                key={path}
                onClick={() => handleTabClick(path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-200 relative min-w-[56px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-11 h-7 flex items-center justify-center rounded-2xl transition-all duration-200 relative',
                  isActive ? 'bg-primary/12' : ''
                )}>
                  <Icon className={cn('w-[19px] h-[19px] transition-all', isActive ? 'stroke-[2.5]' : 'stroke-[1.8]')} />
                  {notifications.length > 0 && path === '/Notifications' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-sm">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[9.5px] font-semibold tracking-wide leading-none transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                )}>{label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}