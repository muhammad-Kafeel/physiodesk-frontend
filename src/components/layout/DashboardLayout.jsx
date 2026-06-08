import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => (
  <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
    <Navbar />
    <div className="d-flex flex-grow-1">
      <Sidebar />
      <main className="flex-grow-1 p-4 bg-white">
        {children}
      </main>
    </div>
  </div>
);

export default DashboardLayout;
