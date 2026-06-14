import { useState } from 'react';
import { Menu } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

/**
 * DashboardLayout
 *
 * Desktop  → Sidebar fixed left column + Navbar top bar + scrollable content
 * Mobile   → Navbar with hamburger → sidebar slides in as a drawer overlay
 */
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dl-root">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="dl-body">
        {/* Desktop sidebar (always visible ≥769px) */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="dl-main">
          {/* Mobile top bar with hamburger */}
          <div className="dl-mobile-bar">
            <button
              className="dl-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="dl-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
