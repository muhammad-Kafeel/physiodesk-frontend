import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </AuthProvider>
  );
}

export default App;
