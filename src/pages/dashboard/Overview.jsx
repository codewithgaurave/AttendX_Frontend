import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { avt, fmtTime, fmtDate, today } from '../../utils/api';
import { Users, UserCheck, UserX, Clock, TrendingDown, PartyPopper } from 'lucide-react';

export default function Overview() {
  const { auth } = useAuth();
  const isSA = auth?.role === 'superadmin';
  const [report, setReport] = useState(null);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    if (isSA) api.get('/superadmin/admins').then(r => setAdmins(r.data));
    else api.get(`/attendance/report/${auth.user.id}?date=${today()}`).then(r => setReport(r.data));
  }, []);

  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; };

  if (isSA) {
    return (
      <>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Good {greet()}, Super Admin</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 24 }}>System overview</div>
        <div className="stats-grid">
          <div className="stat-box s-total"><div className="stat-label">Total Admins</div><div className="stat-val">{admins.length}</div></div>
          <div className="stat-box s-present"><div className="stat-label">Active</div><div className="stat-val">{admins.filter(a => a.isActive).length}</div></div>
          <div className="stat-box s-absent"><div className="stat-label">Inactive</div><div className="stat-val">{admins.filter(a => !a.isActive).length}</div></div>
        </div>
      </>
    );
  }

  const summary = report?.summary;
  const present = report?.present || [];
  const absent  = report?.absent  || [];

  return (
    <>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Good {greet()}, {auth?.user?.name}</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 24 }}>{fmtDate(today())} — Today's snapshot</div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[
          { label: 'Total',    val: summary?.total   ?? '—', cls: 's-total',   icon: <Users size={16} /> },
          { label: 'Present',  val: summary?.present ?? '—', cls: 's-present', icon: <UserCheck size={16} /> },
          { label: 'Absent',   val: summary?.absent  ?? '—', cls: 's-absent',  icon: <UserX size={16} /> },
          { label: 'Half Day', val: summary?.halfDay ?? '—', cls: 's-out',     icon: <Clock size={16} /> },
          { label: 'Late',     val: summary?.late    ?? '—', cls: '',          icon: <TrendingDown size={16} /> },
        ].map(s => (
          <div key={s.label} className={`stat-box ${s.cls}`}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{s.icon}{s.label}</div>
            <div className="stat-val" style={{ color: s.label === 'Late' && summary?.late > 0 ? 'var(--warning)' : undefined }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <div className="tbl-wrap">
          <div className="tbl-head-row"><div className="tbl-title">Today's Status</div></div>
          <table>
            <thead><tr><th>Employee</th><th>In</th><th>Out</th><th>Worked</th><th>Status</th></tr></thead>
            <tbody>
              {present.map(r => (
                <tr key={r.employeeId}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="emp-avt" style={{ width: 28, height: 28, fontSize: 11 }}>{avt(r.name)}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div><div style={{ fontSize: 11, color: 'var(--ink2)' }}>{r.designation}</div></div>
                  </div></td>
                  <td><span className="time-tag">{r.checkInTime || '—'}</span></td>
                  <td><span className="time-tag">{r.checkOutTime || '—'}</span></td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--success)' }}>{r.hoursWorked || (r.checkInTime ? 'Working…' : '—')}</td>
                  <td><span className={`badge ${r.status === 'present' ? 'b-in' : r.status === 'half-day' ? 'b-out' : 'b-absent'}`}>{r.status}</span></td>
                </tr>
              ))}
              {absent.map(r => (
                <tr key={r.employeeId}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="emp-avt" style={{ width: 28, height: 28, fontSize: 11 }}>{avt(r.name)}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  </div></td>
                  <td><span className="time-tag">—</span></td>
                  <td><span className="time-tag">—</span></td>
                  <td>—</td>
                  <td><span className="badge b-absent">Absent</span></td>
                </tr>
              ))}
              {!summary && <tr><td colSpan={5}><div className="empty-state"><Users size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--ink2)' }} /><div>Loading…</div></div></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="tbl-wrap">
          <div className="tbl-head-row"><div className="tbl-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingDown size={15} />Late Arrivals</div></div>
          <div style={{ padding: '8px 0' }}>
            {present.filter(r => r.isLate).length === 0
              ? <div className="empty-state"><PartyPopper size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--success)' }} /><div>No late arrivals today</div></div>
              : present.filter(r => r.isLate).map(r => (
                <div key={r.employeeId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(216,208,192,0.4)' }}>
                  <div className="emp-avt" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>{avt(r.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />Late by {r.lateBy}</div>
                  </div>
                  <span className="time-tag">{r.checkInTime}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
