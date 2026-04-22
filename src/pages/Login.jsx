import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from '../components/Toast';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', role: 'admin' });
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    if (!form.email || !form.password) return toast('Fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.role, data.user);
      toast(`Welcome, ${data.user.name} ✓`);
      nav('/dashboard');
    } catch (e) {
      toast(e.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 4, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '6px 6px 0 var(--ink)' }}>

        <div style={{ background: 'var(--ink)', padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4 }}>Employer Portal</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--bg)' }}>
            Attend<span style={{ color: 'var(--accent)' }}>X</span> Dashboard
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface2)', padding: 4, borderRadius: 4, border: '1px solid var(--border)' }}>
            {[{ val: 'admin', label: 'Admin', icon: <User size={13} /> }, { val: 'superadmin', label: 'Super Admin', icon: <Shield size={13} /> }].map(r => (
              <button key={r.val} onClick={() => setForm(f => ({ ...f, role: r.val }))}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 3, border: 'none', background: form.role === r.val ? 'var(--ink)' : 'transparent', color: form.role === r.val ? 'var(--bg)' : 'var(--ink2)', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                {r.icon}{r.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink2)' }} />
              <input className="form-inp" type="email" placeholder="admin@company.com" style={{ paddingLeft: 36 }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink2)' }} />
              <input className="form-inp" type="password" placeholder="••••••••" style={{ paddingLeft: 36 }}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && doLogin()} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={doLogin} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', fontSize: 14 }}>
            {loading ? 'Signing in…' : <><span>Sign In</span><ChevronRight size={16} /></>}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button className="btn" style={{ border: 'none', color: 'var(--ink2)', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => nav('/')}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
