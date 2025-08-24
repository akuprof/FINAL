interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const adminNavItems = [
    { icon: "fas fa-tachometer-alt", label: "Overview", href: "/" },
    { icon: "fas fa-users", label: "Drivers", href: "/drivers" },
    { icon: "fas fa-car", label: "Vehicles", href: "/vehicles" },
    { icon: "fas fa-route", label: "Trips", href: "/trips" },
    { icon: "fas fa-money-bill-wave", label: "Payouts", href: "/payouts" },
    { icon: "fas fa-exclamation-triangle", label: "Incidents", href: "/incidents" },
    { icon: "fas fa-chart-line", label: "Reports", href: "/reports" },
    { icon: "fas fa-cog", label: "Settings", href: "/settings" },
  ];

  const managerNavItems = [
    { icon: "fas fa-tachometer-alt", label: "Operations", href: "/" },
    { icon: "fas fa-users", label: "Drivers", href: "/drivers" },
    { icon: "fas fa-route", label: "Trips", href: "/trips" },
    { icon: "fas fa-money-bill-wave", label: "Payouts", href: "/payouts" },
    { icon: "fas fa-exclamation-triangle", label: "Incidents", href: "/incidents" },
    { icon: "fas fa-chart-line", label: "Reports", href: "/reports" },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : managerNavItems;
  const dashboardTitle = userRole === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard';

  return (
    <aside className="w-64 bg-surface min-h-screen shadow-sm border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {dashboardTitle}
          </div>
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                index === 0
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} mr-3 text-sm`}></i>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}