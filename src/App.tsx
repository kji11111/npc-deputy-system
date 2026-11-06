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
 * - 管理员默认进仪表盘；承办单位默认进提案办理；代表默认进“我的档案”；
 * - 承办单位不可访问档案/活动页面（URL 直达也会被重定向回提案办理）。
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

  const home = user.role === 'admin' ? '/dashboard' : user.role === 'handler' ? '/proposals' : '/deputies';
  const isStaff = user.role === 'admin' || user.role === 'deputy';

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to={home} replace />} />
        {user.role === 'admin' && <Route path="/dashboard" element={<Dashboard />} />}
        {isStaff && <Route path="/deputies" element={<Deputies />} />}
        {isStaff && <Route path="/activities" element={<Activities />} />}
        <Route path="/proposals" element={<Proposals />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}