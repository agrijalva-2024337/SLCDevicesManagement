import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastHost } from '@/shared/feedback/ToastHost';
import { Header } from '@/shared/layout/Header';
import { Sidebar } from '@/shared/layout/Sidebar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed inset-x-0 top-0 z-40">
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} />
      </div>

      <div className="flex min-h-screen pt-header">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
