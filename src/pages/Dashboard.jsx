import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, MapPin, Users, ClipboardList, BarChart2, UserCog, LogOut, CalendarDays, IndianRupee, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import Overview from './dashboard/Overview';
import QRPanel from './dashboard/QRPanel';
import Employees from './dashboard/Employees';
import Offices from './dashboard/Offices';
import AttendanceLog from './dashboard/AttendanceLog';
import Reports from './dashboard/Reports';
import SuperAdminPanel from './dashboard/SuperAdminPanel';
import Holidays from './dashboard/Holidays';
import Salary from './dashboard/Salary';
import OfficeWise from './dashboard/OfficeWise';

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const isSA = auth?.role === 'superadmin';

  const tabs = isSA
    ? [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { id: 'admins',   label: 'Admins',   icon: <UserCog size={18} /> },
      ]
    : [
        { id: 'overview',   label: 'Overview',    icon: <LayoutDashboard size={18} /> },
        { id: 'qrcode',     label: 'QR Code',     icon: <QrCode size={18} /> },
        { id: 'offices',    label: 'Offices',     icon: <MapPin size={18} /> },
        { id: 'employees',  label: 'Employees',   icon: <Users size={18} /> },
        { id: 'attendance', label: 'Attendance',  icon: <ClipboardList size={18} /> },
        { id: 'reports',    label: 'Reports',     icon: <BarChart2 size={18} /> },
        { id: 'holidays',   label: 'Holidays',    icon: <CalendarDays size={18} /> },
        { id: 'salary',     label: 'Salary',      icon: <IndianRupee size={18} /> },
        { id: 'officewise', label: 'Office Wise', icon: <Building2 size={18} /> },
      ];

  const doLogout = async () => {
    const result = await Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      cancelButtonColor: '#5a5248',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      background: '#faf7f2',
      color: '#1a1612',
    });
    if (result.isConfirmed) { logout(); nav('/'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', paddingBottom: 64 }}>

      {/* Top header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--ink)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: 'var(--bg)', letterSpacing: -0.5 }}>
          Attend<span style={{ color: 'var(--accent)' }}>X</span>
        </div>
        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '7px 12px', borderRadius: 3, border: 'none', background: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? '#fff' : '#888', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={doLogout}
            style={{ padding: '6px 10px', border: '1px solid #444', borderRadius: 3, background: 'transparent', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888'; }}>
            <LogOut size={14} /><span className="desktop-only">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {tab === 'overview'   && <Overview />}
        {tab === 'qrcode'     && !isSA && <QRPanel />}
        {tab === 'offices'    && !isSA && <Offices />}
        {tab === 'employees'  && !isSA && <Employees />}
        {tab === 'attendance' && !isSA && <AttendanceLog />}
        {tab === 'reports'    && !isSA && <Reports />}
        {tab === 'holidays'   && !isSA && <Holidays />}
        {tab === 'salary'     && !isSA && <Salary />}
        {tab === 'officewise' && !isSA && <OfficeWise />}
        {tab === 'admins'     && isSA  && <SuperAdminPanel />}
      </div>

      {/* Mobile bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--ink)', borderTop: '1px solid #333', display: 'flex', zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)', overflowX: 'auto' }} className="mobile-nav">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: '0 0 auto', minWidth: 56, padding: '10px 8px 8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: tab === t.id ? 'var(--accent)' : '#666', transition: 'color 0.15s' }}>
            <div style={{ color: tab === t.id ? 'var(--accent)' : '#666' }}>{t.icon}</div>
            <span style={{ fontSize: 9, fontFamily: 'DM Sans, sans-serif', fontWeight: tab === t.id ? 700 : 400, whiteSpace: 'nowrap' }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
