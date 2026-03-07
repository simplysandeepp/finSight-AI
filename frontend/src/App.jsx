// ================================================================
// FinSight AI - Minimal App Router
// Backend APIs intact - Simple grid UI
// TODO: re-enable for production - Firebase auth currently commented out
// ================================================================

import React, { useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, BarChart } from 'lucide-react';
// TODO: re-enable for production - Firebase auth pages
// import Landing from './pages/Landing.jsx';
// import Login from './pages/Login.jsx';
// import Signup from './pages/Signup.jsx';
// import { useAuth } from './context/AuthContext.jsx';
// import RoleSelectModal from './components/RoleSelectModal.jsx';
import SimpleDashboard from './pages/SimpleDashboard.jsx';
// import { signOut } from 'firebase/auth';
// import { auth } from './firebase/config';

// ================================================================
// AUTH COMPONENTS - TODO: re-enable for production
// ================================================================
// const AuthGateLoader = () => (
//   <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
//     <div className="text-zinc-400 text-sm tracking-[0.2em] uppercase">Loading FinSight...</div>
//   </div>
// );

// const ProtectedRoute = ({ children }) => {
//   const { user, loading, firestoreError } = useAuth();
//   const location = useLocation();

//   if (loading) return <AuthGateLoader />;
  
//   if (firestoreError) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-red-400 mb-4">Error loading user data</p>
//           <p className="text-zinc-500 text-sm">{firestoreError}</p>
//         </div>
//       </div>
//     );
//   }
  
//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }
  
//   return children;
// };

// const PublicRoute = ({ children }) => {
//   const { user, loading } = useAuth();

//   if (loading) return <AuthGateLoader />;
//   if (user) return <Navigate to="/dashboard" replace />;
  
//   return children;
// };

// ================================================================
// MAIN APP
// ================================================================
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ================================================================
  // SIDEBAR
  // ================================================================
  const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
      { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    ];

    return (
      <div className={`fixed left-0 top-0 h-full bg-[#0a0a0b] border-r border-white/[0.06] transition-all duration-300 z-40 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-8">FinSight AI</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/[0.02] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  // ================================================================
  // TOP BAR
  // ================================================================
  const TopBar = () => {
    // TODO: re-enable for production - Firebase auth
    // const navigate = useNavigate();
    // const { userRole, user } = useAuth();

    // const handleLogout = async () => {
    //   try {
    //     await signOut(auth);
    //     navigate('/login');
    //   } catch (error) {
    //     console.error('Logout error:', error);
    //   }
    // };

    return (
      <div className="fixed top-0 right-0 left-0 h-16 bg-[#0a0a0b] border-b border-white/[0.06] flex items-center justify-between px-6 z-30">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/[0.02] rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-zinc-400" /> : <Menu className="w-5 h-5 text-zinc-400" />}
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-emerald-400 text-sm">FinSight AI - Demo Mode</div>
          {/* TODO: re-enable for production - Role selector and logout */}
          {/* <button
            onClick={() => setShowRoleModal(true)}
            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/20"
          >
            {userRole === 'investor' ? '👤 Investor' : '🏢 Organization'}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button> */}
        </div>
      </div>
    );
  };

  // ================================================================
  // LAYOUT WRAPPER
  // ================================================================
  const DashboardLayout = ({ children }) => {
    return (
      <div className="min-h-screen bg-[#0a0a0b]">
        <Sidebar />
        <TopBar />
        <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {children}
          </div>
        </div>
        {/* TODO: re-enable for production - Role modal */}
        {/* {showRoleModal && <RoleSelectModal onClose={() => setShowRoleModal(false)} />} */}
      </div>
    );
  };

  // ================================================================
  // ROUTES - TODO: re-enable auth routes for production
  // ================================================================
  return (
    <BrowserRouter>
      <Routes>
        {/* Direct access to dashboard - no auth required for local dev */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardLayout><SimpleDashboard /></DashboardLayout>} />

        {/* TODO: re-enable for production - Auth routes */}
        {/* <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><SimpleDashboard /></DashboardLayout></ProtectedRoute>} /> */}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
