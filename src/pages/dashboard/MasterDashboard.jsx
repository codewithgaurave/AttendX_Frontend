import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from '../../components/Toast';
import Swal from 'sweetalert2';
import { 
  Users, Crown, Calendar, DollarSign, AlertTriangle, 
  Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, ArrowLeft, Eye 
} from 'lucide-react';

export default function MasterDashboard() {
  const { auth } = useAuth();
  const [stats, setStats] = useState({});
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSuperAdmin, setSelectedSuperAdmin] = useState(null);
  const [superAdminDetails, setSuperAdminDetails] = useState(null);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'superadmin-details', 'renewals'
  const [accountFilter, setAccountFilter] = useState('all'); // 'all', 'demo', 'paid'

  useEffect(() => {
    loadDashboard();
    loadRenewalRequests();
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

  const loadRenewalRequests = async () => {
    try {
      const { data } = await api.get('/master/renewal-requests');
      setRenewalRequests(data);
    } catch (err) {
      console.error('Error loading renewal requests:', err);
    }
  };

  const loadSuperAdminDetails = async (superAdminId) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/master/superadmin/${superAdminId}/admins`);
      setSuperAdminDetails(data);
      setView('superadmin-details');
    } catch (err) {
      toast('Error loading super admin details');
    } finally {
      setLoading(false);
    }
  };

  const approveRenewal = async (adminId, validityDays = 30, additionalData = {}) => {
    try {
      const requestData = {
        validityDays,
        ...additionalData
      };
      await api.post(`/master/approve-renewal/${adminId}`, requestData);
      toast('Renewal approved successfully');
      loadRenewalRequests();
      if (superAdminDetails) {
        loadSuperAdminDetails(superAdminDetails.superAdmin._id);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error approving renewal');
    }
  };

  const rejectRenewal = async (adminId, reason) => {
    try {
      await api.post(`/master/reject-renewal/${adminId}`, { reason });
      toast('Renewal request rejected');
      loadRenewalRequests();
      if (superAdminDetails) {
        loadSuperAdminDetails(superAdminDetails.superAdmin._id);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error rejecting renewal');
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

  if (view === 'superadmin-details' && superAdminDetails) {
    return (
      <SuperAdminDetailsView 
        superAdminDetails={superAdminDetails}
        onBack={() => setView('dashboard')}
        onApproveRenewal={approveRenewal}
        onRejectRenewal={rejectRenewal}
      />
    );
  }

  if (view === 'renewals') {
    return (
      <RenewalRequestsView 
        renewalRequests={renewalRequests}
        onBack={() => setView('dashboard')}
        onApproveRenewal={approveRenewal}
        onRejectRenewal={rejectRenewal}
      />
    );
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
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Super Admins', val: stats.totalSuperAdmins, cls: 's-total', icon: <Crown size={16} /> },
          { label: 'Active', val: stats.activeSuperAdmins, cls: 's-present', icon: <CheckCircle size={16} /> },
          { label: 'Expired', val: stats.expiredSuperAdmins, cls: 's-absent', icon: <XCircle size={16} /> },
          { label: 'Demo Accounts', val: stats.demoAccounts, cls: 's-out', icon: <Clock size={16} /> },
          { label: 'Paid Accounts', val: stats.paidAccounts, cls: 's-present', icon: <DollarSign size={16} /> },
          { label: 'Total Admins', val: stats.totalAdmins, cls: 's-total', icon: <Users size={16} /> },
          { label: 'Demo Admins', val: stats.demoAdmins, cls: 's-out', icon: <Clock size={16} /> },
          { label: 'Paid Admins', val: stats.paidAdmins, cls: 's-present', icon: <DollarSign size={16} /> },
        ].map(s => (
          <div key={s.label} className={`stat-box ${s.cls}`}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {s.icon}{s.label}
            </div>
            <div className="stat-val">{s.val || 0}</div>
          </div>
        ))}
      </div>

      {/* Renewal Requests Alert */}
      {renewalRequests.length > 0 && (
        <div style={{ 
          background: 'var(--warning-bg)', 
          border: '1px solid var(--warning)', 
          borderRadius: 4, 
          padding: 12, 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {renewalRequests.length} renewal request{renewalRequests.length > 1 ? 's' : ''} pending approval
            </span>
          </div>
          <button 
            className="btn btn-warning btn-sm"
            onClick={() => setView('renewals')}
            style={{ fontSize: 11 }}
          >
            View Requests
          </button>
        </div>
      )}

      {/* Super Admins List */}
      <div className="tbl-wrap">
        <div className="tbl-head-row">
          <div className="tbl-title">Super Admins</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} />Add Super Admin
          </button>
        </div>
        
        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <button 
            className={`btn btn-sm ${accountFilter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setAccountFilter('all')}
            style={{ fontSize: 11 }}
          >
            All ({superAdmins.length})
          </button>
          <button 
            className={`btn btn-sm ${accountFilter === 'demo' ? 'btn-primary' : ''}`}
            onClick={() => setAccountFilter('demo')}
            style={{ fontSize: 11 }}
          >
            Demo ({superAdmins.filter(sa => sa.accountType === 'demo').length})
          </button>
          <button 
            className={`btn btn-sm ${accountFilter === 'paid' ? 'btn-primary' : ''}`}
            onClick={() => setAccountFilter('paid')}
            style={{ fontSize: 11 }}
          >
            Paid ({superAdmins.filter(sa => sa.accountType === 'paid').length})
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {superAdmins
            .filter(sa => accountFilter === 'all' || sa.accountType === accountFilter)
            .map(sa => (
            <SuperAdminCard 
              key={sa._id} 
              superAdmin={sa} 
              onUpdateSubscription={updateSubscription}
              onDeactivate={deactivateSuperAdmin}
              onViewDetails={loadSuperAdminDetails}
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

function SuperAdminCard({ superAdmin, onUpdateSubscription, onDeactivate, onViewDetails, getDaysLeft }) {
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
            onClick={() => onViewDetails(superAdmin._id)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Eye size={12} />View Admins
          </button>
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
    name: '', email: '', password: '', phone: '', company: ''
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

function SuperAdminDetailsView({ superAdminDetails, onBack, onApproveRenewal, onRejectRenewal }) {
  const { superAdmin, admins } = superAdminDetails;
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminFilter, setAdminFilter] = useState('all'); // 'all', 'demo', 'paid'

  const handleApproveRenewal = (admin) => {
    setSelectedAdmin(admin);
    setShowApprovalModal(true);
  };

  const handleRejectRenewal = async (adminId, adminName) => {
    const result = await Swal.fire({
      title: `Reject renewal for ${adminName}?`,
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      confirmButtonText: 'Reject Request'
    });

    if (result.isConfirmed) {
      onRejectRenewal(adminId, result.value);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <button 
          className="btn btn-sm" 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <ArrowLeft size={14} />Back to Dashboard
        </button>
        
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {superAdmin.name} - Admins
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
          {superAdmin.company} • {superAdmin.email}
        </div>
      </div>

      {/* SuperAdmin Info Card */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '2px solid var(--border)', 
        borderRadius: 4, 
        padding: 16,
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 2 }}>Account Type</div>
            <span className={`badge ${superAdmin.accountType === 'paid' ? 'b-in' : 'b-out'}`}>
              {superAdmin.accountType.toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 2 }}>Valid Until</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {new Date(superAdmin.validUntil).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 2 }}>Max Admins</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{superAdmin.maxAdmins}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 2 }}>Created Admins</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{admins.length}</div>
          </div>
        </div>
      </div>

      {/* Admins List */}
      <div className="tbl-wrap">
        <div className="tbl-head-row">
          <div className="tbl-title">Admins ({admins.filter(admin => adminFilter === 'all' || (admin.accountType || 'demo') === adminFilter).length})</div>
        </div>
        
        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          <button 
            className={`btn btn-sm ${adminFilter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setAdminFilter('all')}
            style={{ fontSize: 11 }}
          >
            All ({admins.length})
          </button>
          <button 
            className={`btn btn-sm ${adminFilter === 'demo' ? 'btn-primary' : ''}`}
            onClick={() => setAdminFilter('demo')}
            style={{ fontSize: 11 }}
          >
            Demo ({admins.filter(admin => (admin.accountType || 'demo') === 'demo').length})
          </button>
          <button 
            className={`btn btn-sm ${adminFilter === 'paid' ? 'btn-primary' : ''}`}
            onClick={() => setAdminFilter('paid')}
            style={{ fontSize: 11 }}
          >
            Paid ({admins.filter(admin => admin.accountType === 'paid').length})
          </button>
        </div>
        
        {admins.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <div>No admins created yet</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {admins
              .filter(admin => adminFilter === 'all' || (admin.accountType || 'demo') === adminFilter)
              .map(admin => (
              <AdminCard 
                key={admin._id}
                admin={admin}
                onApproveRenewal={handleApproveRenewal}
                onRejectRenewal={handleRejectRenewal}
              />
            ))}
          </div>
        )}
      </div>

      {showApprovalModal && selectedAdmin && (
        <RenewalApprovalModal 
          admin={selectedAdmin}
          onClose={() => setShowApprovalModal(false)}
          onApprove={onApproveRenewal}
        />
      )}
    </>
  );
}

function AdminCard({ admin, onApproveRenewal, onRejectRenewal }) {
  const isExpired = admin.isExpired || new Date(admin.validUntil) < new Date();
  const daysLeft = Math.ceil((new Date(admin.validUntil) - new Date()) / (1000 * 60 * 60 * 24));
  const hasRenewalRequest = admin.renewalRequested && !admin.renewalApproved;
  const wasRejected = admin.renewalRejected;

  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: `2px solid ${hasRenewalRequest ? 'var(--warning)' : isExpired ? 'var(--danger)' : 'var(--border)'}`, 
      borderRadius: 4, 
      padding: 16 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="emp-avt" style={{ width: 36, height: 36, fontSize: 12 }}>
          {admin.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{admin.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{admin.email}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className={`badge ${admin.accountType === 'paid' ? 'b-in' : 'b-out'}`} style={{ fontSize: 9 }}>
            {admin.accountType?.toUpperCase() || 'DEMO'}
          </span>
          {hasRenewalRequest && (
            <span className="badge b-warning" style={{ fontSize: 9 }}>RENEWAL REQ</span>
          )}
          {wasRejected && !hasRenewalRequest && (
            <span className="badge b-danger" style={{ fontSize: 9 }}>REJECTED</span>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Company:</span>
          <span style={{ fontWeight: 600 }}>{admin.company || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Valid Until:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'var(--ink)' }}>
            {new Date(admin.validUntil).toLocaleDateString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Days Left:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}>
            {Math.max(0, daysLeft)} days
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status:</span>
          <span style={{ fontWeight: 600, color: admin.canScanAttendance ? 'var(--success)' : 'var(--danger)' }}>
            {admin.canScanAttendance ? 'Active' : 'Inactive'}
          </span>
        </div>
        {admin.accountType === 'demo' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span>Demo Used:</span>
            <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
              {admin.totalDemoUsed || 0} days
            </span>
          </div>
        )}
      </div>

      {/* Previous Rejection Info */}
      {wasRejected && !hasRenewalRequest && (
        <div style={{ 
          background: 'var(--danger-bg)', 
          border: '1px solid var(--danger)', 
          borderRadius: 3, 
          padding: 8, 
          marginBottom: 12,
          fontSize: 11
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--danger)' }}>Previously Rejected:</div>
          <div style={{ marginBottom: 2 }}>
            <strong>Reason:</strong> {admin.renewalRejectionReason || 'No reason provided'}
          </div>
          <div style={{ color: 'var(--ink2)' }}>
            <strong>Rejected:</strong> {new Date(admin.renewalRejectedDate).toLocaleDateString()}
          </div>
        </div>
      )}

      {hasRenewalRequest && (
        <>
          <div style={{ 
            background: 'var(--warning-bg)', 
            border: '1px solid var(--warning)', 
            borderRadius: 3, 
            padding: 8, 
            marginBottom: 12,
            fontSize: 11
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Renewal Request:</div>
            <div>{admin.renewalMessage || 'No message provided'}</div>
            <div style={{ color: 'var(--ink2)', marginTop: 4 }}>
              Requested: {new Date(admin.renewalRequestDate).toLocaleDateString()}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-success btn-sm" 
              onClick={() => onApproveRenewal(admin)}
              style={{ flex: 1, fontSize: 11 }}
            >
              <CheckCircle size={12} />Approve
            </button>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => onRejectRenewal(admin._id, admin.name)}
              style={{ flex: 1, fontSize: 11 }}
            >
              <XCircle size={12} />Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RenewalRequestsView({ renewalRequests, onBack, onApproveRenewal, onRejectRenewal }) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const handleApproveRenewal = (admin) => {
    setSelectedAdmin(admin);
    setShowApprovalModal(true);
  };

  const handleRejectRenewal = async (adminId, adminName) => {
    const result = await Swal.fire({
      title: `Reject renewal for ${adminName}?`,
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      showCancelButton: true,
      confirmButtonColor: '#c84b2f',
      confirmButtonText: 'Reject Request'
    });

    if (result.isConfirmed) {
      onRejectRenewal(adminId, result.value);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <button 
          className="btn btn-sm" 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <ArrowLeft size={14} />Back to Dashboard
        </button>
        
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Renewal Requests
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
          {renewalRequests.length} pending request{renewalRequests.length > 1 ? 's' : ''}
        </div>
      </div>

      {renewalRequests.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={32} />
          <div>No pending renewal requests</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {renewalRequests.map(admin => (
            <RenewalRequestCard 
              key={admin._id}
              admin={admin}
              onApproveRenewal={handleApproveRenewal}
              onRejectRenewal={handleRejectRenewal}
            />
          ))}
        </div>
      )}

      {showApprovalModal && selectedAdmin && (
        <RenewalApprovalModal 
          admin={selectedAdmin}
          onClose={() => setShowApprovalModal(false)}
          onApprove={onApproveRenewal}
        />
      )}
    </>
  );
}

function RenewalRequestCard({ admin, onApproveRenewal, onRejectRenewal }) {
  const isExpired = admin.isExpired || new Date(admin.validUntil) < new Date();
  const daysLeft = Math.ceil((new Date(admin.validUntil) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ 
      background: 'var(--surface)', 
      border: '2px solid var(--warning)', 
      borderRadius: 4, 
      padding: 16 
    }}>
      {/* Admin Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="emp-avt" style={{ width: 36, height: 36, fontSize: 12 }}>
          {admin.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{admin.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{admin.companyName}</div>
        </div>
        <span className="badge b-warning" style={{ fontSize: 9 }}>PAID REQUEST</span>
      </div>

      {/* Request Info */}
      <div style={{ 
        background: 'var(--warning-bg)', 
        border: '1px solid var(--warning)', 
        borderRadius: 3, 
        padding: 12, 
        marginBottom: 12,
        fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Request Details:</div>
        <div style={{ marginBottom: 4 }}>
          <strong>Requested by:</strong> {admin.renewalRequestedBy?.name || admin.createdBy?.name}
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>Super Admin:</strong> {admin.createdBy?.name} ({admin.createdBy?.email})
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>Company:</strong> {admin.createdBy?.company || 'N/A'}
        </div>
        <div style={{ color: 'var(--ink2)' }}>
          <strong>Requested:</strong> {new Date(admin.renewalRequestDate).toLocaleDateString()}
        </div>
      </div>

      {/* Current Status */}
      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Current Type:</span>
          <span style={{ fontWeight: 600 }}>{admin.accountType?.toUpperCase() || 'DEMO'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Valid Until:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'var(--ink)' }}>
            {new Date(admin.validUntil).toLocaleDateString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Days Left:</span>
          <span style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}>
            {Math.max(0, daysLeft)} days
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Max Employees:</span>
          <span style={{ fontWeight: 600 }}>{admin.maxEmployees}</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          className="btn btn-success btn-sm" 
          onClick={() => onApproveRenewal(admin)}
          style={{ flex: 1, fontSize: 11 }}
        >
          <CheckCircle size={12} />Approve & Upgrade
        </button>
        <button 
          className="btn btn-danger btn-sm" 
          onClick={() => onRejectRenewal(admin._id, admin.name)}
          style={{ flex: 1, fontSize: 11 }}
        >
          <XCircle size={12} />Reject
        </button>
      </div>
    </div>
  );
}
function RenewalApprovalModal({ admin, onClose, onApprove }) {
  const [form, setForm] = useState({
    validityDays: 30,
    maxEmployees: Math.max(admin.maxEmployees, 50),
    maxOffices: Math.max(admin.maxOffices, 5),
    paymentAmount: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call approve with extended parameters
    onApprove(admin._id, form.validityDays, form);
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">
          Approve Paid Account - {admin.name}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        {/* Request Info */}
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--surface2)', borderRadius: 3 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Request Details:</strong>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 4 }}>
            <strong>Requested by:</strong> {admin.renewalRequestedBy?.name || admin.createdBy?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 4 }}>
            <strong>Company:</strong> {admin.companyName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink2)' }}>
            <strong>Message:</strong> {admin.renewalMessage || 'No message provided'}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Validity Period (Days)</label>
              <input 
                className="form-inp" 
                type="number" 
                value={form.validityDays} 
                onChange={e => setForm({...form, validityDays: e.target.value})}
                min="1"
                max="365"
              />
            </div>
            <div className="form-group">
              <label>Max Employees</label>
              <input 
                className="form-inp" 
                type="number" 
                value={form.maxEmployees} 
                onChange={e => setForm({...form, maxEmployees: e.target.value})}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Max Offices</label>
              <input 
                className="form-inp" 
                type="number" 
                value={form.maxOffices} 
                onChange={e => setForm({...form, maxOffices: e.target.value})}
                min="1"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Payment Amount</label>
              <input 
                className="form-inp" 
                type="number" 
                value={form.paymentAmount} 
                onChange={e => setForm({...form, paymentAmount: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Payment Method</label>
            <select 
              className="form-inp" 
              value={form.paymentMethod} 
              onChange={e => setForm({...form, paymentMethod: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm" style={{ flex: 1 }}>
              Approve & Upgrade to Paid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}