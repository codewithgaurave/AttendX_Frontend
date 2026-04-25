import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from '../../components/Toast';
import Swal from 'sweetalert2';
import { 
  Users, Crown, Calendar, DollarSign, AlertTriangle, 
  Plus, Edit2, Trash2, CheckCircle, XCircle, Clock 
} from 'lucide-react';

export default function MasterDashboard() {
  const { auth } = useAuth();
  const [stats, setStats] = useState({});
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/master/dashboard');
      setStats(data.stats);
      setSuperAdmins(data.superAdmins);
    } catch (err) {
      toast('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createSuperAdmin = async (formData) => {
    try {
      await api.post('/master/superadmin', formData);
      toast('Super Admin created successfully');
      setShowModal(false);
      loadDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Error creating super admin');
    }
  };

  const updateSubscription = async (id, subscriptionData) => {
    try {
      await api.put(`/master/superadmin/${id}/subscription`, subscriptionData);
      toast('Subscription updated successfully');
      loadDashboard();
    } catch (err) {
      toast(err.response?.data?.message || 'Error updating subscription');
    }
  };

  const deactivateSuperAdmin = async (id, name) => {
    const result = await Swal.fire({
      title: `Deactivate ${name}?`,
      text: 'This will disable all admins under this super admin.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      confirmButtonText: 'Yes, Deactivate'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/master/superadmin/${id}`);
        toast('Super Admin deactivated');
        loadDashboard();
      } catch (err) {
        toast('Error deactivating super admin');
      }
    }
  };

  const getDaysLeft = (validUntil) => {
    const days = Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return <div className="empty-state"><Users size={32} /><div>Loading...</div></div>;
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Master Dashboard
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
          Manage super admins and subscriptions
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Super Admins', val: stats.totalSuperAdmins, cls: 's-total', icon: <Crown size={16} /> },
          { label: 'Active', val: stats.activeSuperAdmins, cls: 's-present', icon: <CheckCircle size={16} /> },
          { label: 'Expired', val: stats.expiredSuperAdmins, cls: 's-absent', icon: <XCircle size={16} /> },
          { label: 'Demo Accounts', val: stats.demoAccounts, cls: 's-out', icon: <Clock size={16} /> },
          { label: 'Paid Accounts', val: stats.paidAccounts, cls: 's-present', icon: <DollarSign size={16} /> },
          { label: 'Total Admins', val: stats.totalAdmins, cls: 's-total', icon: <Users size={16} /> },
        ].map(s => (
          <div key={s.label} className={`stat-box ${s.cls}`}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {s.icon}{s.label}
            </div>
            <div className="stat-val">{s.val || 0}</div>
          </div>
        ))}
      </div>

      {/* Super Admins List */}
      <div className="tbl-wrap">
        <div className="tbl-head-row">
          <div className="tbl-title">Super Admins</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} />Add Super Admin
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {superAdmins.map(sa => (
            <SuperAdminCard 
              key={sa._id} 
              superAdmin={sa} 
              onUpdateSubscription={updateSubscription}
              onDeactivate={deactivateSuperAdmin}
              getDaysLeft={getDaysLeft}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <CreateSuperAdminModal 
          onClose={() => setShowModal(false)}
          onCreate={createSuperAdmin}
        />
      )}
    </>
  );
}

function SuperAdminCard({ superAdmin, onUpdateSubscription, onDeactivate, getDaysLeft }) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const daysLeft = getDaysLeft(superAdmin.validUntil);
  const isExpired = superAdmin.isExpired || daysLeft <= 0;

  return (
    <>
      <div style={{ 
        background: 'var(--surface)', 
        border: `2px solid ${isExpired ? 'var(--danger)' : 'var(--border)'}`, 
        borderRadius: 4, 
        padding: 16 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="emp-avt" style={{ width: 40, height: 40, fontSize: 14 }}>
            {superAdmin.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{superAdmin.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{superAdmin.email}</div>
          </div>
          <span className={`badge ${superAdmin.accountType === 'paid' ? 'b-in' : 'b-out'}`}>
            {superAdmin.accountType.toUpperCase()}
          </span>
        </div>

        <div style={{ fontSize: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Company:</span>
            <span style={{ fontWeight: 600 }}>{superAdmin.company || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Max Admins:</span>
            <span style={{ fontWeight: 600 }}>{superAdmin.maxAdmins}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Valid Until:</span>
            <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'var(--ink)' }}>
              {new Date(superAdmin.validUntil).toLocaleDateString()}
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
          <button 
            className="btn btn-sm" 
            onClick={() => setShowSubscriptionModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Edit2 size={12} />Subscription
          </button>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={() => onDeactivate(superAdmin._id, superAdmin.name)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={12} />Deactivate
          </button>
        </div>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal 
          superAdmin={superAdmin}
          onClose={() => setShowSubscriptionModal(false)}
          onUpdate={onUpdateSubscription}
        />
      )}
    </>
  );
}

function CreateSuperAdminModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', company: '',
    accountType: 'demo', validityDays: 30, maxAdmins: 10
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast('Please fill required fields');
      return;
    }
    onCreate(form);
  };

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">
          Create Super Admin
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Name *</label>
              <input className="form-inp" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input className="form-inp" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Password *</label>
              <input className="form-inp" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-inp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Company</label>
            <input className="form-inp" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Account Type</label>
              <select className="form-inp" value={form.accountType} onChange={e => setForm({...form, accountType: e.target.value})}>
                <option value="demo">Demo (7 days)</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {form.accountType === 'paid' && (
              <>
                <div className="form-group">
                  <label>Validity (Days)</label>
                  <input className="form-inp" type="number" value={form.validityDays} onChange={e => setForm({...form, validityDays: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Max Admins</label>
                  <input className="form-inp" type="number" value={form.maxAdmins} onChange={e => setForm({...form, maxAdmins: e.target.value})} />
                </div>
              </>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary btn-full">Create Super Admin</button>
        </form>
      </div>
    </div>
  );
}

function SubscriptionModal({ superAdmin, onClose, onUpdate }) {
  const [form, setForm] = useState({
    accountType: 'paid',
    validityDays: 30,
    maxAdmins: superAdmin.maxAdmins,
    paymentAmount: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(superAdmin._id, form);
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-title">
          Update Subscription - {superAdmin.name}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Validity (Days)</label>
              <input className="form-inp" type="number" value={form.validityDays} onChange={e => setForm({...form, validityDays: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Max Admins</label>
              <input className="form-inp" type="number" value={form.maxAdmins} onChange={e => setForm({...form, maxAdmins: e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Payment Amount</label>
              <input className="form-inp" type="number" value={form.paymentAmount} onChange={e => setForm({...form, paymentAmount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select className="form-inp" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary btn-full">Update Subscription</button>
        </form>
      </div>
    </div>
  );
}