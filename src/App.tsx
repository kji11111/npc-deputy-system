import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/AppStore';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Deputies from './pages/Deputies';
import Activities from './pages/Activities';
import Proposals from './pages/Proposals';

/**
 * 路由与登录守卫：
 * - 未登录只能访问 /login；
 * - 管理员默认进入仪表盘，代表角色默认进入“我的档案”且不可访问仪表盘。
 */
export default function App() {
  const { user } = useStore();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to={user.role === 'admin' ? '/dashboard' : '/deputies'} replace />} />
        {user.role === 'admin' && <Route path="/dashboard" element={<Dashboard />} />}
        <Route path="/deputies" element={<Deputies />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}