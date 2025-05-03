import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners'; // Import spinner từ react-spinners
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';

import UserInfo from './pages/userInfo/UserInfo';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './global.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './pages/PrivateRoute';
import SocketProvider from './components/SocketProvider';
const App = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false); // State để theo dõi trạng thái loading

  useEffect(() => {
    setLoading(true); // Khi thay đổi location thì bắt đầu loading
    const timeout = setTimeout(() => setLoading(false), 120); // Giả lập thời gian loading 120ms
    return () => clearTimeout(timeout); // Dọn dẹp khi unmount
  }, [location]);

  return (
    <Provider store={store}>
      {loading && (
        <div className="loading-overlay">
          {/* Hiển thị spinner khi đang loading */}
          <ClipLoader size={50} color="#00FF7F" loading={loading} />
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
      <Toaster position="top-center" reverseOrder={false} />

      <SocketProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/userinfo" element={<UserInfo />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ✅ GIỮ cái này để chặn chưa login */}
          <Route
            path="/home/*"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

        </Routes>
      </SocketProvider>
    </Provider>
  );
};

export default App;
