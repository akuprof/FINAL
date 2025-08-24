import { User } from "@shared/schema";

interface NavigationBarProps {
  user: User;
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export function NavigationBar({ user, onMenuClick, showMenuButton }: NavigationBarProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName || "";
    const last = lastName || "";
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || "U";
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return user.email || "User";
  };

  return (
    <nav className="bg-surface shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="text-gray-600 hover:text-primary lg:hidden"
                data-testid="menu-button"
              >
                <i className="fas fa-bars text-lg"></i>
              </button>
            )}
            <div className="text-xl font-semibold text-primary">
              <i className="fas fa-bus mr-2"></i>
              PLS Travels
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-primary" data-testid="notifications">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getInitials(user.firstName, user.lastName)}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {getDisplayName(user.firstName, user.lastName)}
                </span>
                <span className="text-xs text-gray-500 capitalize">{user.role}</span>
              </div>
              <button 
                onClick={() => window.location.href = '/api/logout'}
                className="ml-2 text-sm text-gray-600 hover:text-primary"
                data-testid="logout-button"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
