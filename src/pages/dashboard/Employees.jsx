import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { avt } from '../../utils/api';
import { toast } from '../../components/Toast';
import Swal from 'sweetalert2';
import { UserPlus, Pencil, Clock, Trash2, Users } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const emptyForm = { name: '', email: '', phone: '', employeeCode: '', designation: '', joiningDate: '', officeId: '', department: '', address: '', emergencyContact: '', bloodGroup: '', gender: '', dob: '', monthlySalary: '', weeklyOff: [0], workingHours: { startTime: '09:00', endTime: '18:00' } };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [whModal, setWhModal] = useState(null);
  const [filterOffice, setFilterOffice] = useState('all');

  const load = () => {
    api.get('/admin/employees').then(r => setEmployees(r.data));
    api.get('/admin/offices').then(r => setOffices(r.data));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.email || !form.phone || !form.employeeCode || !form.designation || !form.joiningDate || !form.officeId)
      return toast('Fill all mandatory fields');
    try {
      if (editId) await api.put(`/admin/employees/${editId}`, form);
      else await api.post('/admin/employees', form);
      toast(editId ? 'Employee updated ✓' : 'Employee added ✓');
      setShowModal(false); setForm(emptyForm); setEditId(null); load();
    } catch (e) { toast(e.response?.data?.message || 'Error'); }
  };

  const del = async (id, name) => {
    const result = await Swal.fire({
      title: `Deactivate ${name}?`,
      text: 'This employee will be marked inactive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      cancelButtonColor: '#5a5248',
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      background: '#faf7f2',
      color: '#1a1612',
    });
    if (!result.isConfirmed) return;
    await api.delete(`/admin/employees/${id}`);
    toast(`${name} deactivated`); load();
  };

  const saveWH = async () => {
    if (!whModal) return;
    try {
      await api.patch(`/admin/employees/${whModal._id}/working-hours`, whModal.workingHours);
      toast('Working hours updated ✓'); setWhModal(null); load();
    } catch { toast('Error'); }
  };

  const openEdit = (e) => {
    setForm({ name: e.name, email: e.email, phone: e.phone, employeeCode: e.employeeCode, designation: e.designation, joiningDate: e.joiningDate?.slice(0,10) || '', officeId: e.officeId?._id || e.officeId, department: e.department || '', address: e.address || '', emergencyContact: e.emergencyContact || '', bloodGroup: e.bloodGroup || '', gender: e.gender || '', dob: e.dob?.slice(0,10) || '', monthlySalary: e.monthlySalary || '', weeklyOff: e.weeklyOff || [0], workingHours: e.workingHours || { startTime: '09:00', endTime: '18:00' } });
    setEditId(e._id); setShowModal(true);
  };

  const downloadSlip = async (emp) => {
    const month = new Date().toISOString().slice(0, 7);
    const { data: m } = await Swal.fire({
      title: 'Select Month',
      input: 'month',
      inputValue: month,
      showCancelButton: true,
      confirmButtonText: 'Download PDF',
      background: '#faf7f2',
      color: '#1a1612',
    });
    if (!m) return;
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const url = `${base}/admin/salary/slip/${emp._id}?month=${m}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return toast('Error generating slip');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `salary-slip-${emp.employeeCode}-${m}.pdf`;
    a.click();
  };

  const toggleWeeklyOff = (day) => {
    setForm(f => ({
      ...f,
      weeklyOff: f.weeklyOff.includes(day) ? f.weeklyOff.filter(d => d !== day) : [...f.weeklyOff, day]
    }));
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Employees</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{employees.length} members</span>
          {offices.length > 1 && (
            <select className="form-inp" value={filterOffice} onChange={e => setFilterOffice(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="all">All Offices</option>
              {offices.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <UserPlus size={14} />Add Employee
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
        {employees.filter(e => filterOffice === 'all' || (e.officeId?._id || e.officeId) === filterOffice).map(e => (
          <div key={e._id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 4, padding: 18, transition: 'all 0.15s' }}
            onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--ink)'; ev.currentTarget.style.boxShadow = '3px 3px 0 var(--ink)'; ev.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'var(--border)'; ev.currentTarget.style.boxShadow = 'none'; ev.currentTarget.style.transform = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="emp-avt" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 800 }}>{avt(e.name)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{e.employeeCode} · {e.designation}</div>
                <div style={{ marginTop: 5 }}><span className="badge b-in">{e.officeId?.name || 'Office'}</span></div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={11} />{e.workingHours?.startTime} – {e.workingHours?.endTime}
            </div>
            {e.monthlySalary > 0 && <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 6 }}>💰 ₹{e.monthlySalary?.toLocaleString('en-IN')}/mo</div>}
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 12 }}>{e.email}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" onClick={() => openEdit(e)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Pencil size={12} />Edit</button>
              <button className="btn btn-sm" onClick={() => setWhModal({ ...e, workingHours: { ...e.workingHours } })} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />Hours</button>
              <button className="btn btn-sm" onClick={() => downloadSlip(e)} style={{ display: 'flex', alignItems: 'center', gap: 5 }} title="Download Salary Slip">💰 Slip</button>
              <button className="btn btn-danger btn-sm" onClick={() => del(e._id, e.name)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {employees.filter(e => filterOffice === 'all' || (e.officeId?._id || e.officeId) === filterOffice).length === 0 && <div className="empty-state"><Users size={36} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--ink2)' }} /><div>No employees yet</div></div>}
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-title">
              {editId ? 'Edit Employee' : 'Add Employee'}
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Mandatory Fields</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Full Name *</label><input className="form-inp" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rahul Sharma" /></div>
              <div className="form-group"><label>Employee Code *</label><input className="form-inp" value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} placeholder="EMP-001" /></div>
              <div className="form-group"><label>Email *</label><input className="form-inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="form-group"><label>Phone *</label><input className="form-inp" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="form-group"><label>Designation *</label><input className="form-inp" value={form.designation} onChange={e => set('designation', e.target.value)} /></div>
              <div className="form-group"><label>Joining Date *</label><input className="form-inp" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Office *</label>
              <select className="form-inp" value={form.officeId} onChange={e => set('officeId', e.target.value)}>
                <option value="">Select Office</option>
                {offices.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Start Time</label><input className="form-inp" type="time" value={form.workingHours.startTime} onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, startTime: e.target.value } }))} /></div>
              <div className="form-group"><label>End Time</label><input className="form-inp" type="time" value={form.workingHours.endTime} onChange={e => setForm(f => ({ ...f, workingHours: { ...f.workingHours, endTime: e.target.value } }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Monthly Salary (₹)</label><input className="form-inp" type="number" value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} placeholder="30000" /></div>
              <div className="form-group">
                <label>Weekly Off Days</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {DAYS.map((d, i) => (
                    <button key={i} type="button" onClick={() => toggleWeeklyOff(i)}
                      style={{ padding: '4px 8px', borderRadius: 3, border: '1.5px solid', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, background: form.weeklyOff.includes(i) ? 'var(--accent)' : 'transparent', color: form.weeklyOff.includes(i) ? '#fff' : 'var(--ink2)', borderColor: form.weeklyOff.includes(i) ? 'var(--accent)' : 'var(--border)' }}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', margin: '4px 0 16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Optional Fields</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Department</label><input className="form-inp" value={form.department} onChange={e => set('department', e.target.value)} /></div>
              <div className="form-group"><label>Gender</label>
                <select className="form-inp" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Date of Birth</label><input className="form-inp" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
              <div className="form-group"><label>Blood Group</label><input className="form-inp" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} placeholder="A+" /></div>
              <div className="form-group"><label>Emergency Contact</label><input className="form-inp" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} /></div>
              <div className="form-group"><label>Address</label><input className="form-inp" value={form.address} onChange={e => set('address', e.target.value)} /></div>
            </div>
            <button className="btn btn-primary btn-full" onClick={save}>{editId ? 'Update Employee' : 'Add Employee'}</button>
          </div>
        </div>
      )}

      {whModal && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setWhModal(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-title">Working Hours — {whModal.name}<button className="modal-close" onClick={() => setWhModal(null)}>✕</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Start Time</label><input className="form-inp" type="time" value={whModal.workingHours.startTime} onChange={e => setWhModal(w => ({ ...w, workingHours: { ...w.workingHours, startTime: e.target.value } }))} /></div>
              <div className="form-group"><label>End Time</label><input className="form-inp" type="time" value={whModal.workingHours.endTime} onChange={e => setWhModal(w => ({ ...w, workingHours: { ...w.workingHours, endTime: e.target.value } }))} /></div>
            </div>
            <button className="btn btn-primary btn-full" onClick={saveWH}>Save Working Hours</button>
          </div>
        </div>
      )}
    </>
  );
}
