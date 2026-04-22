import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { avt, fmtDate, today } from '../../utils/api';
import Swal from 'sweetalert2';
import {
  CalendarDays, Calendar, BarChart2, ChevronDown, ChevronUp,
  MapPin, Clock, CheckCircle, XCircle, Loader, Inbox, ChevronRight, Camera
} from 'lucide-react';

const MODE_TABS = [
  { id: 'date',    icon: <CalendarDays size={14} />, label: 'Date Wise' },
  { id: 'monthly', icon: <Calendar size={14} />,     label: 'Monthly' },
  { id: 'range',   icon: <BarChart2 size={14} />,    label: 'Date Range' },
];

export default function AttendanceLog() {
  const { auth } = useAuth();
  const [mode, setMode] = useState('date');

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Attendance Log</div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Check-in / check-out records with GPS & analysis</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface2)', padding: 4, borderRadius: 6, width: 'fit-content', border: '1px solid var(--border)' }}>
        {MODE_TABS.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: mode === t.id ? 'var(--ink)' : 'transparent', color: mode === t.id ? 'var(--bg)' : 'var(--ink2)', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {mode === 'date'    && <DateView    adminId={auth.user.id} />}
      {mode === 'monthly' && <MonthlyView adminId={auth.user.id} />}
      {mode === 'range'   && <RangeView   adminId={auth.user.id} />}
    </>
  );
}

/* ── DATE WISE ── */
function DateView({ adminId }) {
  const [date, setDate] = useState(today());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/report/${adminId}?date=${date}`)
      .then(r => setReport(r.data)).finally(() => setLoading(false));
  }, [date]);

  const present = report?.present || [];
  const absent  = report?.absent  || [];
  const summary = report?.summary;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Select Date</label>
          <input className="form-inp" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
        {summary && <SummaryPills summary={summary} />}
      </div>
      <AttTable rows={[...present, ...absent]} title={fmtDate(date)} loading={loading} />
    </>
  );
}

/* ── MONTHLY ── */
function MonthlyView({ adminId }) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [selEmp, setSelEmp] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { api.get('/admin/employees').then(r => setEmployees(r.data)); }, []);

  const load = () => {
    setLoading(true);
    const empParam = selEmp !== 'all' ? `&employeeId=${selEmp}` : '';
    const firstDay = `${month}-01`;
    const lastDay  = new Date(month.slice(0,4), parseInt(month.slice(5,7)), 0).toISOString().split('T')[0];
    api.get(`/attendance/range/${adminId}?from=${firstDay}&to=${lastDay}${empParam}`)
      .then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, selEmp]);

  const chgMonth = (d) => {
    const dt = new Date(month + '-01');
    dt.setMonth(dt.getMonth() + d);
    setMonth(dt.toISOString().slice(0, 7));
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const overall = data?.overallSummary;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Month</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavBtn onClick={() => chgMonth(-1)}><ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /></NavBtn>
            <input className="form-inp" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ maxWidth: 180 }} />
            <NavBtn onClick={() => chgMonth(1)}><ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></NavBtn>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Employee</label>
          <select className="form-inp" value={selEmp} onChange={e => setSelEmp(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {overall && <OverallStats overall={overall} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <EmptyState icon={<Loader size={32} />} text="Loading…" />}
        {!loading && data?.dailySummary?.map(day => (
          <DayAccordion key={day.date} day={day} expanded={expanded} setExpanded={setExpanded} />
        ))}
        {!loading && data?.dailySummary?.length === 0 && (
          <EmptyState icon={<Inbox size={32} />} text={`No data for ${monthLabel}`} />
        )}
      </div>
    </>
  );
}

/* ── DATE RANGE ── */
function RangeView({ adminId }) {
  const [from, setFrom] = useState(today().slice(0, 8) + '01');
  const [to, setTo]     = useState(today());
  const [employees, setEmployees] = useState([]);
  const [selEmp, setSelEmp] = useState('all');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { api.get('/admin/employees').then(r => setEmployees(r.data)); }, []);

  const load = () => {
    if (!from || !to) return;
    setLoading(true);
    const empParam = selEmp !== 'all' ? `&employeeId=${selEmp}` : '';
    api.get(`/attendance/range/${adminId}?from=${from}&to=${to}${empParam}`)
      .then(r => setData(r.data)).finally(() => setLoading(false));
  };

  const overall = data?.overallSummary;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>From</label>
          <input className="form-inp" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ maxWidth: 180 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>To</label>
          <input className="form-inp" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ maxWidth: 180 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Employee</label>
          <select className="form-inp" value={selEmp} onChange={e => setSelEmp(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Apply <ChevronRight size={14} />
        </button>
      </div>

      {overall && <OverallStats overall={overall} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <EmptyState icon={<Loader size={32} />} text="Loading…" />}
        {!loading && data?.dailySummary?.map(day => (
          <DayAccordion key={day.date} day={day} expanded={expanded} setExpanded={setExpanded} />
        ))}
        {!loading && data?.dailySummary?.length === 0 && (
          <EmptyState icon={<Inbox size={32} />} text="No data for selected range" />
        )}
        {!data && !loading && (
          <EmptyState icon={<BarChart2 size={32} />} text="Select range and click Apply" />
        )}
      </div>
    </>
  );
}

/* ── SHARED ── */

function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 32, height: 38, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}>
      {children}
    </button>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: 'var(--ink2)' }}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}

function OverallStats({ overall }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
      {[
        { label: 'Total Days',  val: overall.totalDays,              cls: 's-total' },
        { label: 'Present',     val: overall.totalPresent,           cls: 's-present' },
        { label: 'Half Day',    val: overall.totalHalfDay,           cls: 's-out' },
        { label: 'Late',        val: overall.totalLate,              cls: '' },
        { label: 'Total Hours', val: overall.totalHoursWorked + 'h', cls: '' },
      ].map(s => (
        <div key={s.label} className={`stat-box ${s.cls}`} style={{ padding: 16 }}>
          <div className="stat-label">{s.label}</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 500 }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

function DayAccordion({ day, expanded, setExpanded }) {
  const isOpen = expanded === day.date;
  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(isOpen ? null : day.date)}
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', cursor: 'pointer', background: isOpen ? 'var(--surface2)' : 'transparent', transition: 'background 0.15s' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, minWidth: 100 }}>{fmtDate(day.date)}</div>
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} />{day.present} Present</span>
          {day.halfDay > 0 && <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>{day.halfDay} Half</span>}
          <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} />{day.absent} Absent</span>
          {day.late > 0 && <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{day.late} Late</span>}
        </div>
        <span style={{ color: 'var(--ink2)', display: 'flex', alignItems: 'center' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>
      {isOpen && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
          {day.records.length > 0
            ? <MiniTable rows={day.records} />
            : <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--ink2)' }}>No records for this day</div>}
        </div>
      )}
    </div>
  );
}

function SummaryPills({ summary }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 2 }}>
      <Pill bg="#e8f5ee" border="#b8dcc8" color="var(--success)"><CheckCircle size={11} />{summary.present} Present</Pill>
      <Pill bg="#fdeee8" border="#f0c0b0" color="var(--danger)"><XCircle size={11} />{summary.absent} Absent</Pill>
      {summary.halfDay > 0 && <Pill bg="#fff8e8" border="#f0d090" color="var(--warning)">{summary.halfDay} Half Day</Pill>}
      {summary.late > 0 && <Pill bg="#fff8e8" border="#f0d090" color="var(--warning)"><Clock size={11} />{summary.late} Late</Pill>}
      {summary.stillWorking > 0 && <Pill bg="#e8f0fe" border="#b0c8f0" color="var(--accent2)">{summary.stillWorking} Working</Pill>}
    </div>
  );
}

function Pill({ bg, border, color, children }) {
  return (
    <span style={{ fontSize: 12, background: bg, border: `1px solid ${border}`, color, fontWeight: 700, padding: '4px 10px', borderRadius: 3, fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}
    </span>
  );
}

function showSelfie(name, type, selfie, time, location) {
  if (!selfie) {
    Swal.fire({
      title: 'No Photo',
      text: `${name} did not capture a selfie during ${type}.`,
      icon: 'info',
      confirmButtonColor: '#c84b2f',
      background: '#faf7f2',
      color: '#1a1612',
    });
    return;
  }
  Swal.fire({
    title: `${name} — Check ${type}`,
    html: `
      <img src="${selfie}" style="width:200px;height:200px;border-radius:50%;object-fit:cover;border:3px solid #2a7a4b;margin-bottom:12px;" />
      <div style="font-family:DM Mono,monospace;font-size:12px;color:#5a5248;">${time || ''}${location ? ' · ' + location : ''}</div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Close',
    confirmButtonColor: '#1a1612',
    background: '#faf7f2',
    color: '#1a1612',
    width: 360,
  });
}

function AttTable({ rows, title, loading }) {
  return (
    <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
      <div className="tbl-head-row">
        <div className="tbl-title">{title}</div>
        <span style={{ fontSize: 11, color: 'var(--ink2)' }}>{rows.length} employees</span>
      </div>
      <table>
        <thead><tr>
          <th>Employee</th><th>Check In</th><th>In Photo</th><th>Check Out</th><th>Out Photo</th>
          <th>Hours</th><th>Late</th><th>GPS</th><th>Status</th>
        </tr></thead>
        <tbody>
          {loading && <tr><td colSpan={9}><EmptyState icon={<Loader size={28} />} text="Loading…" /></td></tr>}
          {!loading && rows.map((r, i) => (
            <tr key={r.employeeId + i}>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="emp-avt" style={{ width: 28, height: 28, fontSize: 11 }}>{avt(r.name || '')}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{r.employeeCode}</div>
                </div>
              </div></td>
              <td><span className="time-tag">{r.checkInTime || '—'}</span></td>
              <td>
                <button onClick={() => showSelfie(r.name, 'In', r.checkInSelfie, r.checkInTime, r.checkInLocation)}
                  style={{ background: r.checkInSelfie ? '#e8f5ee' : 'var(--surface2)', border: `1px solid ${r.checkInSelfie ? '#b8dcc8' : 'var(--border)'}`, borderRadius: 3, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: r.checkInSelfie ? 'var(--success)' : 'var(--ink2)' }}>
                  <Camera size={11} />{r.checkInSelfie ? 'View' : 'None'}
                </button>
              </td>
              <td><span className="time-tag">{r.checkOutTime || '—'}</span></td>
              <td>
                {r.checkOutTime
                  ? <button onClick={() => showSelfie(r.name, 'Out', r.checkOutSelfie, r.checkOutTime, r.checkOutLocation)}
                      style={{ background: r.checkOutSelfie ? '#e8f5ee' : 'var(--surface2)', border: `1px solid ${r.checkOutSelfie ? '#b8dcc8' : 'var(--border)'}`, borderRadius: 3, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: r.checkOutSelfie ? 'var(--success)' : 'var(--ink2)' }}>
                      <Camera size={11} />{r.checkOutSelfie ? 'View' : 'None'}
                    </button>
                  : <span style={{ color: 'var(--border)' }}>—</span>}
              </td>
              <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--success)' }}>
                {r.hoursWorked || (r.checkInTime && !r.checkOutTime ? 'Working…' : '—')}
              </td>
              <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--warning)' }}>{r.isLate ? r.lateBy : '—'}</td>
              <td>{r.checkInLocation
                ? <span className="gps-ok-tag" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{r.checkInDistance}m</span>
                : <span className="gps-na-tag">—</span>}
              </td>
              <td><span className={`badge ${r.status === 'present' ? 'b-in' : r.status === 'half-day' ? 'b-out' : 'b-absent'}`}>{r.status || 'absent'}</span></td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={9}><EmptyState icon={<Inbox size={28} />} text="No records" /></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MiniTable({ rows }) {
  const thStyle = { textAlign: 'left', padding: '8px 16px', fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 0.8, background: 'var(--surface2)', fontWeight: 600 };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr>
        <th style={thStyle}>Employee</th><th style={thStyle}>In</th><th style={thStyle}>Out</th>
        <th style={thStyle}>Hours</th><th style={thStyle}>Late</th><th style={thStyle}>Status</th>
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.employeeId + i} style={{ borderBottom: '1px solid rgba(216,208,192,0.4)' }}>
            <td style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="emp-avt" style={{ width: 26, height: 26, fontSize: 10 }}>{avt(r.name || '')}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{r.employeeCode}</div>
                </div>
              </div>
            </td>
            <td style={{ padding: '10px 16px' }}><span className="time-tag">{r.checkInTime || '—'}</span></td>
            <td style={{ padding: '10px 16px' }}><span className="time-tag">{r.checkOutTime || '—'}</span></td>
            <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--success)' }}>
              {r.hoursWorked || (r.checkInTime && !r.checkOutTime ? 'Working…' : '—')}
            </td>
            <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--warning)' }}>
              {r.isLate ? r.lateBy : '—'}
            </td>
            <td style={{ padding: '10px 16px' }}>
              <span className={`badge ${r.status === 'present' ? 'b-in' : r.status === 'half-day' ? 'b-out' : 'b-absent'}`}>{r.status || 'absent'}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
