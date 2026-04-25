import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { avt } from '../../utils/api';
import { exportEmployeeReport } from '../../utils/exportExcel';
import { ChevronLeft, ChevronRight, Users, BarChart2, Download } from 'lucide-react';

export default function Reports() {
  const { auth } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selEmp, setSelEmp] = useState(null);
  const [empReport, setEmpReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { api.get('/admin/employees').then(r => setEmployees(r.data)); }, []);

  useEffect(() => {
    if (!selEmp) return;
    setLoading(true);
    api.get(`/attendance/employee/${selEmp._id}?month=${month}`)
      .then(r => setEmpReport(r.data))
      .finally(() => setLoading(false));
  }, [selEmp, month]);

  const chgMonth = (d) => {
    const dt = new Date(month + '-01');
    dt.setMonth(dt.getMonth() + d);
    setMonth(dt.toISOString().slice(0, 7));
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Reports</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 20 }}>Monthly attendance analysis per employee</div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => chgMonth(-1)} style={{ width: 32, height: 32, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><ChevronLeft size={16} /></button>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800 }}>{monthLabel}</div>
        <button onClick={() => chgMonth(1)} style={{ width: 32, height: 32, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}><ChevronRight size={16} /></button>
      </div>

      {/* Employee list - full width */}
      <div className="tbl-wrap" style={{ marginBottom: 24 }}>
        <div className="tbl-head-row">
          <div className="tbl-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={15} />Select Employee</div>
          {selEmp && <button className="btn btn-sm" onClick={() => { setSelEmp(null); setEmpReport(null); }}>✕ Clear</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
          {employees.map(e => (
            <div key={e._id} onClick={() => setSelEmp(e)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(216,208,192,0.3)', borderRight: '1px solid rgba(216,208,192,0.3)', cursor: 'pointer', background: selEmp?._id === e._id ? 'var(--ink)' : 'transparent', transition: 'background 0.15s' }}
              onMouseEnter={ev => { if (selEmp?._id !== e._id) ev.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={ev => { if (selEmp?._id !== e._id) ev.currentTarget.style.background = 'transparent'; }}>
              <div className="emp-avt" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0, background: selEmp?._id === e._id ? 'var(--accent)' : undefined }}>{avt(e.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: selEmp?._id === e._id ? 'var(--bg)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: selEmp?._id === e._id ? '#ccc' : 'var(--ink2)' }}>{e.employeeCode} · {e.designation}</div>
              </div>
              {selEmp?._id === e._id && <ChevronRight size={14} color="var(--accent)" style={{ flexShrink: 0 }} />}
            </div>
          ))}
          {employees.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink2)', fontSize: 13 }}>No employees found</div>
          )}
        </div>
      </div>

      {/* Report section - full width below */}
      {selEmp && (
        <div>
          {/* Employee header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px 20px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 4 }}>
            <div className="emp-avt" style={{ width: 48, height: 48, fontSize: 16, fontWeight: 800 }}>{avt(selEmp.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800 }}>{selEmp.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{selEmp.employeeCode} · {selEmp.designation} · {monthLabel}</div>
            </div>
            {empReport && <button className="btn btn-primary" onClick={() => exportEmployeeReport(empReport, selEmp.name, month)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} />Export
            </button>}
          </div>

          {loading && (
            <div className="empty-state"><BarChart2 size={32} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--ink2)' }} /><div>Loading report…</div></div>
          )}

          {!loading && empReport && (
            <>
              {/* Stats cards - same as Overview */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 20 }}>
                {[
                  { label: 'Present',   val: empReport.summary.present,                  cls: 's-present' },
                  { label: 'Absent',    val: empReport.summary.absent,                   cls: 's-absent' },
                  { label: 'Half Day',  val: empReport.summary.halfDay,                  cls: 's-out' },
                  { label: 'Late Days', val: empReport.summary.lateDays,                 cls: 's-out' },
                  { label: 'Total Hrs', val: empReport.summary.totalHoursWorked + 'h',   cls: 's-total' },
                ].map(s => (
                  <div key={s.label} className={`stat-box ${s.cls}`}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-val">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Daily records table */}
              <div className="tbl-wrap">
                <div className="tbl-head-row">
                  <div className="tbl-title">{selEmp.name} — Daily Records</div>
                  <span style={{ fontSize: 11, color: 'var(--ink2)' }}>{empReport.records.length} days</span>
                </div>
                <table>
                  <thead><tr>
                    <th>Date</th><th>Check In</th><th>Check Out</th>
                    <th>Hours Worked</th><th>Late By</th><th>Early Leave</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {empReport.records.map(r => (
                      <tr key={r.date}>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{r.date}</td>
                        <td><span className="time-tag">{r.checkInTime || '—'}</span></td>
                        <td><span className="time-tag">{r.checkOutTime || '—'}</span></td>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--success)' }}>{r.hoursWorked || '—'}</td>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: r.isLate ? 'var(--warning)' : 'var(--ink2)' }}>
                          {r.isLate ? r.lateBy : '—'}
                        </td>
                        <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: r.isEarlyLeave ? 'var(--warning)' : 'var(--ink2)' }}>
                          {r.isEarlyLeave ? r.earlyLeaveBy : '—'}
                        </td>
                        <td><span className={`badge ${r.status === 'present' ? 'b-in' : r.status === 'half-day' ? 'b-out' : 'b-absent'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                    {empReport.records.length === 0 && (
                      <tr><td colSpan={7}>
                        <div className="empty-state"><div>No records for {monthLabel}</div></div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!selEmp && (
        <div className="empty-state">
          <Users size={36} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--ink2)' }} />
          <div>Select an employee above to view their report</div>
        </div>
      )}
    </>
  );
}
