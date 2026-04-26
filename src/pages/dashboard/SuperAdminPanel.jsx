import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, ToggleLeft, ToggleRight, QrCode, Printer, Phone, Mail, Building2, Edit2, Calendar, Users, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { avt } from '../../utils/api';
import { toast } from '../../components/Toast';

const emptyForm = { name: '', email: '', password: '', phone: '', companyName: '', accountType: 'demo', validityDays: 7, maxEmployees: 5, maxOffices: 1 };

export default function SuperAdminPanel() {
  const [admins, setAdmins] = useState([]);
  const [subscription, setSubscription] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [qrAdmin, setQrAdmin] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/superadmin/admins');
      setAdmins(data.admins || data);
      if (data.subscription) setSubscription(data.subscription);
    } catch (err) {
      if (err.response?.data?.expired) {
        toast('Your account has expired. Please contact master admin.');
      }
    }
  };
  
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.companyName)
      return toast('Fill all fields');
    try {
      await api.post('/superadmin/admins', form);
      toast('Demo admin created ✓'); setShowModal(false); setForm(emptyForm); load();
    } catch (e) { 
      toast(e.response?.data?.message || 'Error');
      if (e.response?.data?.limitReached || e.response?.data?.expired) {
        setShowModal(false);
      }
    }
  };

  const toggle = async (id, name, active) => {
    try {
      await api.patch(`/superadmin/admins/${id}/toggle`);
      toast(`${name} ${active ? 'deactivated' : 'activated'}`); 
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Error');
    }
  };

  const getDaysLeft = (validUntil) => {
    const days = Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admins</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
            {admins.length} admins • {subscription.accountType} account • {subscription.currentAdmins || 0}/{subscription.maxAdmins} used
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setForm(emptyForm); setShowModal(true); }} 
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={subscription.isExpired}
        >
          <UserPlus size={15} /> Create Admin
        </button>
      </div>

      {/* Subscription Warning */}
      {subscription.isExpired && (
        <div style={{ background: '#fdeee8', border: '1px solid #f0c0b0', borderRadius: 4, padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="var(--danger)" />
          <span style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Your subscription has expired. Contact master admin to renew.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 14 }}>
        {admins.map(a => (
          <AdminCard 
            key={a._id} 
            admin={a} 
            onToggle={toggle}
            onShowQR={setQrAdmin}
            getDaysLeft={getDaysLeft}
          />
        ))}
        {admins.length === 0 && <div className="empty-state"><div className="empty-icon">👤</div>No admins yet</div>}
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <CreateAdminModal 
          form={form}
          setForm={setForm}
          onSave={save}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* QR Modal */}
      {qrAdmin && (
        <QRModal admin={qrAdmin} onClose={() => setQrAdmin(null)} />
      )}
    </>
  );
}

function AdminCard({ admin, onToggle, onShowQR, getDaysLeft }) {
  const daysLeft = getDaysLeft(admin.validUntil);
  const isExpired = admin.isExpired || daysLeft <= 0;

  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: `1.5px solid ${isExpired ? 'var(--danger)' : admin.isActive ? 'var(--border)' : 'var(--warning)'}`, 
      borderRadius: 4, 
      padding: 18, 
      opacity: admin.isActive ? 1 : 0.7, 
      transition: 'all 0.15s' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="emp-avt" style={{ width: 44, height: 44, fontSize: 15, fontWeight: 800 }}>{avt(admin.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{admin.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{admin.companyName}</div>
          <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
            <span className={`badge ${admin.isActive ? 'b-in' : 'b-absent'}`}>
              {admin.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`badge ${admin.accountType === 'paid' ? 'b-in' : 'b-out'}`}>
              {admin.accountType.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Email:</span>
          <span style={{ fontWeight: 600 }}>{admin.email}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Max Employees:</span>
          <span style={{ fontWeight: 600 }}>{admin.maxEmployees}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Max Offices:</span>
          <span style={{ fontWeight: 600 }}>{admin.maxOffices}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Valid Until:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'var(--ink)' }}>
            {new Date(admin.validUntil).toLocaleDateString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Days Left:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}>
            {daysLeft} days
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => onShowQR(admin)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <QrCode size={13} />QR
        </button>
        <button 
          className={`btn btn-sm ${admin.isActive ? 'btn-danger' : 'btn-success'}`} 
          onClick={() => onToggle(admin._id, admin.name, admin.isActive)} 
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {admin.isActive ? <><ToggleLeft size={13} />Deactivate</> : <><ToggleRight size={13} />Activate</>}
        </button>
        {admin.renewalRequested && (
          <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, padding: '4px 8px', background: 'var(--warning-bg)', borderRadius: 3 }}>
            Renewal Requested
          </span>
        )}
      </div>
    </div>
  );
}

function CreateAdminModal({ form, setForm, onSave, onClose }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">Create Admin <button className="modal-close" onClick={onClose}>✕</button></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-inp" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Company Name *</label>
            <input className="form-inp" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Email *</label>
            <input className="form-inp" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input className="form-inp" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Password *</label>
          <input className="form-inp" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Account Type</label>
            <select className="form-inp" value={form.accountType} onChange={e => set('accountType', e.target.value)} disabled>
              <option value="demo">Demo (7 days)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Max Employees</label>
            <input className="form-inp" type="number" value={5} disabled />
          </div>
          <div className="form-group">
            <label>Max Offices</label>
            <input className="form-inp" type="number" value={1} disabled />
          </div>
        </div>
        
        <button className="btn btn-primary btn-full" onClick={onSave}>Create Admin</button>
      </div>
    </div>
  );
}

function QRModal({ admin, onClose }) {
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{admin.name} — QR Code <button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{ display: 'inline-block', padding: 16, border: '2px solid var(--ink)', borderRadius: 4, background: '#fff', marginBottom: 16 }}>
          <QRCodeSVG value={JSON.stringify({ adminId: admin._id, companyName: admin.companyName })} size={180} fgColor="#1a1612" bgColor="#ffffff" level="H" />
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--ink2)', marginBottom: 16 }}>{admin.companyName}</div>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Printer size={14} />Print
        </button>
      </div>
    </div>
  );
}
