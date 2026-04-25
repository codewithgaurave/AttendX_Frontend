import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from '../components/Toast';

export default function MasterLogin() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    if (!form.email || !form.password) return toast('Fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/master/login', form);
      login(data.token, 'masteradmin', data.user);
      toast(`Welcome, ${data.user.name} ✓`);
      nav('/dashboard');
    } catch (e) {
      toast(e.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 4, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '6px 6px 0 var(--ink)' }}>

        <div style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2a2520 100%)', padding: '28px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Crown size={24} color="var(--accent)" />
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 3 }}>Master Portal</div>
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--bg)' }}>
            Attend<span style={{ color: 'var(--accent)' }}>X</span> Master
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>System Administrator Access</div>
        </div>

        <div style={{ padding: 28 }}>
          <div className="form-group">
            <label>Master Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink2)' }} />
              <input className="form-inp" type="email" placeholder="master@attendancex.com" style={{ paddingLeft: 36 }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Master Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink2)' }} />
              <input className="form-inp" type="password" placeholder="••••••••" style={{ paddingLeft: 36 }}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && doLogin()} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={doLogin} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', fontSize: 14, background: 'linear-gradient(135deg, var(--accent) 0%, #d4621a 100%)' }}>
            {loading ? 'Signing in…' : <><Crown size={16} /><span>Master Access</span><ChevronRight size={16} /></>}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="btn" style={{ border: 'none', color: 'var(--ink2)', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => nav('/login')}>
              <ArrowLeft size={14} /> Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}