import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, ToggleLeft, ToggleRight, QrCode, Printer, Phone, Mail, Building2, Edit2, Calendar, Users, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { avt } from '../../utils/api';
import { toast } from '../../components/Toast';
import Swal from 'sweetalert2';

const emptyForm = { name: '', email: '', password: '', phone: '', companyName: '', accountType: 'demo', validityDays: 7, maxEmployees: 5, maxOffices: 1 };

export default function SuperAdminPanel() {
  const [admins, setAdmins] = useState([]);
  const [subscription, setSubscription] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [qrAdmin, setQrAdmin] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [rejectionModal, setRejectionModal] = useState(null);

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
    if (!form.name || !form.password || !form.phone || !form.companyName)
      return toast('Fill all required fields');
    try {
      // Calculate validUntil date based on validityDays
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(form.validityDays));
      
      const adminData = {
        ...form,
        validUntil: validUntil.toISOString().split('T')[0],
        maxEmployees: parseInt(form.maxEmployees),
        maxOffices: parseInt(form.maxOffices)
      };
      
      await api.post('/superadmin/admins', adminData);
      toast('Admin created ✓'); setShowModal(false); setForm(emptyForm); load();
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

  const openEditAdmin = (admin) => {
    setEditAdmin(admin);
    setEditForm({
      validUntil: admin.validUntil.slice(0, 10),
      maxEmployees: admin.maxEmployees,
      maxOffices: admin.maxOffices,
      accountType: admin.accountType
    });
  };

  const requestPaidAccount = async (admin) => {
    const isReRequest = admin.renewalRejected;
    const title = isReRequest ? `Re-request Paid Account for ${admin.name}?` : `Request Paid Account for ${admin.name}?`;
    const text = isReRequest 
      ? `Previous request was rejected. Reason: "${admin.renewalRejectionReason || 'No reason provided'}". Send a new request?`
      : 'This will send a request to Master Admin to upgrade this account to paid.';
    
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      cancelButtonColor: '#5a5248',
      confirmButtonText: isReRequest ? 'Send New Request' : 'Send Request',
      background: '#faf7f2',
      color: '#1a1612',
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await api.post(`/superadmin/admins/${admin._id}/request-paid`);
      toast(isReRequest ? 'New paid account request sent ✓' : 'Paid account request sent to Master Admin ✓');
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Error sending request');
    }
  };

  const saveEditAdmin = async () => {
    try {
      await api.put(`/superadmin/admins/${editAdmin._id}/subscription`, editForm);
      toast('Admin settings updated ✓');
      setEditAdmin(null);
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Error updating admin');
    }
  };

  const showRejectionDetails = (admin) => {
    setRejectionModal(admin);
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
            onEdit={openEditAdmin}
            onRequestPaid={requestPaidAccount}
            onShowRejection={showRejectionDetails}
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

      {/* Edit Admin Modal */}
      {editAdmin && (
        <EditAdminModal 
          admin={editAdmin}
          form={editForm}
          setForm={setEditForm}
          onSave={saveEditAdmin}
          onClose={() => setEditAdmin(null)}
        />
      )}

      {/* Rejection Details Modal */}
      {rejectionModal && (
        <RejectionModal 
          admin={rejectionModal}
          onClose={() => setRejectionModal(null)}
        />
      )}
    </>
  );
}

function AdminCard({ admin, onToggle, onShowQR, onEdit, onRequestPaid, onShowRejection, getDaysLeft }) {
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
          <span>Phone:</span>
          <span style={{ fontWeight: 600 }}>{admin.phone}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Email:</span>
          <span style={{ fontWeight: 600 }}>{admin.email || 'Not provided'}</span>
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
        <button className="btn btn-sm" onClick={() => onEdit(admin)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Edit2 size={13} />Edit
        </button>
        {admin.accountType === 'demo' && !admin.renewalRequested && (
          <button className="btn btn-sm btn-warning" onClick={() => onRequestPaid(admin)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            💰 Request Paid
          </button>
        )}
        {admin.accountType === 'demo' && admin.renewalRejected && (
          <button className="btn btn-sm btn-warning" onClick={() => onRequestPaid(admin)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            🔄 Request Again
          </button>
        )}
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
        {admin.renewalRejected && (
          <>
            <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, padding: '4px 8px', background: 'var(--danger-bg)', borderRadius: 3 }}>
              Request Rejected
            </span>
            <button 
              className="btn btn-sm btn-danger" 
              onClick={() => onShowRejection(admin)}
              style={{ fontSize: 10, padding: '2px 6px' }}
            >
              View Reason
            </button>
          </>
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
            <label>Phone Number *</label>
            <input className="form-inp" type="tel" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email (Optional)</label>
            <input className="form-inp" type="email" placeholder="admin@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Password *</label>
          <input className="form-inp" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Account Type</label>
            <select className="form-inp" value={form.accountType} onChange={e => set('accountType', e.target.value)} disabled>
              <option value="demo">Demo Account</option>
            </select>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 4 }}>Contact Master Admin for Paid accounts</div>
          </div>
          <div className="form-group">
            <label>Validity (Days) *</label>
            <input 
              className="form-inp" 
              type="number" 
              min="1" 
              max="365" 
              value={form.validityDays} 
              onChange={e => set('validityDays', parseInt(e.target.value) || 7)} 
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Max Employees *</label>
            <input 
              className="form-inp" 
              type="number" 
              min="1" 
              max="1000" 
              value={form.maxEmployees} 
              onChange={e => set('maxEmployees', parseInt(e.target.value) || 5)} 
            />
          </div>
          <div className="form-group">
            <label>Max Offices *</label>
            <input 
              className="form-inp" 
              type="number" 
              min="1" 
              max="100" 
              value={form.maxOffices} 
              onChange={e => set('maxOffices', parseInt(e.target.value) || 1)} 
            />
          </div>
        </div>
        
        <button className="btn btn-primary btn-full" onClick={onSave}>Create Admin</button>
      </div>
    </div>
  );
}

function QRModal({ admin, onClose }) {
  const downloadQR = () => {
    const svg = document.querySelector('#qr-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 400;
    canvas.height = 500;
    
    img.onload = () => {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 500);
      
      // Company name at top
      ctx.fillStyle = '#1a1612';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(admin.companyName, 200, 40);
      
      // QR code (centered)
      ctx.drawImage(img, 50, 80, 300, 300);
      
      // Admin name at bottom
      ctx.font = '14px Arial';
      ctx.fillText(`Admin: ${admin.name}`, 200, 420);
      ctx.fillText(`Phone: ${admin.phone}`, 200, 445);
      ctx.fillText('Scan to mark attendance', 200, 470);
      
      // Download
      const link = document.createElement('a');
      link.download = `${admin.companyName}-QR.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{admin.name} — QR Code <button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{ display: 'inline-block', padding: 20, border: '2px solid var(--ink)', borderRadius: 4, background: '#fff', marginBottom: 16 }}>
          <QRCodeSVG 
            id="qr-svg"
            value={JSON.stringify({ adminId: admin._id, companyName: admin.companyName })} 
            size={280} 
            fgColor="#1a1612" 
            bgColor="#ffffff" 
            level="H" 
          />
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--ink2)', marginBottom: 16 }}>{admin.companyName}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} />Print
          </button>
          <button className="btn" onClick={downloadQR} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            📥 Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAdminModal({ admin, form, setForm, onSave, onClose }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">
          Edit {admin.name} Settings
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 8 }}>Company: {admin.companyName}</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 8 }}>Phone: {admin.phone}</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 8 }}>Email: {admin.email || 'Not provided'}</div>
        </div>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Account Valid Until *</label>
          <input 
            className="form-inp" 
            type="date" 
            value={form.validUntil} 
            onChange={e => set('validUntil', e.target.value)} 
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label>Account Type</label>
            <select className="form-inp" value={form.accountType} onChange={e => set('accountType', e.target.value)} disabled>
              <option value="demo">Demo Account</option>
            </select>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 4 }}>Contact Master Admin for Paid accounts</div>
          </div>
          <div className="form-group">
            <label>Max Employees *</label>
            <input 
              className="form-inp" 
              type="number" 
              min="1" 
              max="1000" 
              value={form.maxEmployees} 
              onChange={e => set('maxEmployees', parseInt(e.target.value) || 1)} 
            />
          </div>
          <div className="form-group">
            <label>Max Offices *</label>
            <input 
              className="form-inp" 
              type="number" 
              min="1" 
              max="100" 
              value={form.maxOffices} 
              onChange={e => set('maxOffices', parseInt(e.target.value) || 1)} 
            />
          </div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 12, color: 'var(--ink2)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Current Usage:</div>
          <div>• Account expires: {new Date(admin.validUntil).toLocaleDateString()}</div>
          <div>• Days left: {Math.max(0, Math.ceil((new Date(admin.validUntil) - new Date()) / (1000 * 60 * 60 * 24)))} days</div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={onSave} style={{ flex: 1 }}>Update Settings</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RejectionModal({ admin, onClose }) {
  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">
          Renewal Request Rejected - {admin.name}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 12 }}>Company: {admin.companyName}</div>
          
          <div style={{ 
            background: 'var(--danger-bg)', 
            border: '1px solid var(--danger)', 
            borderRadius: 4, 
            padding: 16, 
            marginBottom: 16 
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              ❌ Rejection Details
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong>Rejected by:</strong> {admin.renewalRejectedBy?.name || 'Master Admin'}<br/>
              <strong>Date:</strong> {new Date(admin.renewalRejectedDate).toLocaleDateString()}<br/>
              <strong>Reason:</strong>
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.8)', 
              padding: 12, 
              borderRadius: 3, 
              marginTop: 8, 
              fontSize: 13, 
              fontStyle: 'italic',
              border: '1px solid rgba(200,75,47,0.3)'
            }}>
              "{admin.renewalRejectionReason || 'No reason provided'}"
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--accent-bg)', 
            border: '1px solid var(--accent)', 
            borderRadius: 4, 
            padding: 12, 
            fontSize: 12, 
            color: 'var(--ink2)' 
          }}>
            💡 <strong>What you can do:</strong><br/>
            • Address the concerns mentioned in the rejection reason<br/>
            • Contact Master Admin for clarification if needed<br/>
            • Submit a new request with improvements
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
