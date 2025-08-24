import { useAuth } from "@/hooks/useAuth";
import { NavigationBar } from "./NavigationBar";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <div>{children}</div>;
  }

  const showSidebar = user.role !== 'driver' && !isMobile;
  const showMobileNav = user.role === 'driver' && isMobile;

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar 
        user={user} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={!showSidebar}
      />
      
      <div className="flex">
        {showSidebar && (
          <Sidebar userRole={user.role} />
        )}
        
        {!showSidebar && sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-16 h-full w-64 bg-surface">
              <Sidebar userRole={user.role} />
            </div>
          </div>
        )}
        
        <main className={`flex-1 p-4 lg:p-6 max-w-full overflow-x-hidden ${showMobileNav ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>

      {showMobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex justify-around">
            <button className="flex flex-col items-center p-2 text-primary" data-testid="nav-home">
              <i className="fas fa-home text-lg"></i>
              <span className="text-xs mt-1">Home</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-600" data-testid="nav-trips">
              <i className="fas fa-route text-lg"></i>
              <span className="text-xs mt-1">Trips</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-600" data-testid="nav-earnings">
              <i className="fas fa-money-bill-wave text-lg"></i>
              <span className="text-xs mt-1">Earnings</span>
            </button>
            <button className="flex flex-col items-center p-2 text-gray-600" data-testid="nav-profile">
              <i className="fas fa-user text-lg"></i>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
