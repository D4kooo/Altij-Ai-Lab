import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - fixed, never scrolls */}
      <Sidebar />
      {/* Main content area with inset canvas effect */}
      <div className="flex flex-1 flex-col overflow-hidden p-3 pl-0">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-primary/[0.04] bg-white shadow-premium">
          {/* Header - fixed at top */}
          <Header />
          {/* Content area - this is where scrolling happens */}
          <main className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 overflow-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
