import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { useThemeStore } from '@/stores/themeStore';

export function Layout() {
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    useThemeStore.getState().setTheme(theme);
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden p-2 pl-0">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-card border border-border shadow-linear dark:shadow-none">
          <main className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname.split('/').slice(0, 2).join('/')}
                className="absolute inset-0 overflow-auto p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
