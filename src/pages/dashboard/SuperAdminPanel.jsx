import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, ToggleLeft, ToggleRight, QrCode, Printer, Phone, Mail, Building2 } from 'lucide-react';
import api from '../../utils/api';
import { avt } from '../../utils/api';
import { toast } from '../../components/Toast';

const emptyForm = { name: '', email: '', password: '', phone: '', companyName: '' };

export default function SuperAdminPanel() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [qrAdmin, setQrAdmin] = useState(null);

  const load = () => api.get('/superadmin/admins').then(r => setAdmins(r.data));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.companyName)
      return toast('Fill all fields');
    try {
      await api.post('/superadmin/admins', form);
      toast('Admin created ✓'); setShowModal(false); setForm(emptyForm); load();
    } catch (e) { toast(e.response?.data?.message || 'Error'); }
  };

  const toggle = async (id, name, active) => {
    await api.patch(`/superadmin/admins/${id}/toggle`);
    toast(`${name} ${active ? 'deactivated' : 'activated'}`); load();
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admins</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{admins.length} admins registered</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={15} /> Create Admin
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
        {admins.map(a => (
          <div key={a._id} style={{ background: 'var(--surface)', border: `1.5px solid ${a.isActive ? 'var(--border)' : 'var(--danger)'}`, borderRadius: 4, padding: 18, opacity: a.isActive ? 1 : 0.7, transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="emp-avt" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 800 }}>{avt(a.name)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{a.companyName}</div>
                <div style={{ marginTop: 5 }}><span className={`badge ${a.isActive ? 'b-in' : 'b-absent'}`}>{a.isActive ? 'Active' : 'Inactive'}</span></div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 6 }}>✉ {a.email}</div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>📞 {a.phone}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" onClick={() => setQrAdmin(a)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><QrCode size={13} />QR Code</button>
              <button className={`btn btn-sm ${a.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(a._id, a.name, a.isActive)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {a.isActive ? <><ToggleLeft size={13} />Deactivate</> : <><ToggleRight size={13} />Activate</>}
              </button>
            </div>
          </div>
        ))}
        {admins.length === 0 && <div className="empty-state"><div className="empty-icon">👤</div>No admins yet</div>}
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Create Admin <button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label>Full Name *</label><input className="form-inp" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>Company Name *</label><input className="form-inp" value={form.companyName} onChange={e => set('companyName', e.target.value)} /></div>
            <div className="form-group"><label>Email *</label><input className="form-inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone *</label><input className="form-inp" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>Password *</label><input className="form-inp" type="password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <button className="btn btn-primary btn-full" onClick={save}>Create Admin</button>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrAdmin && (
        <div className="modal-overlay active" onClick={() => setQrAdmin(null)}>
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{qrAdmin.name} — QR Code <button className="modal-close" onClick={() => setQrAdmin(null)}>✕</button></div>
            <div style={{ display: 'inline-block', padding: 16, border: '2px solid var(--ink)', borderRadius: 4, background: '#fff', marginBottom: 16 }}>
              <QRCodeSVG value={JSON.stringify({ adminId: qrAdmin._id, companyName: qrAdmin.companyName })} size={180} fgColor="#1a1612" bgColor="#ffffff" level="H" />
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--ink2)', marginBottom: 16 }}>{qrAdmin.companyName}</div>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} />Print</button>
          </div>
        </div>
      )}
    </>
  );
}
