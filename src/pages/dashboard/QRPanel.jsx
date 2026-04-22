import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { QrCode, MapPin, User, Camera, CheckSquare, Printer } from 'lucide-react';

export default function QRPanel() {
  const { auth } = useAuth();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    api.get(`/superadmin/admins/${auth.user.id}/qr`).then(r => setAdmin(r.data)).catch(() => {});
  }, []);

  const qrValue = JSON.stringify({ adminId: auth.user.id, companyName: admin?.companyName || '' });

  const steps = [
    { icon: <QrCode size={14} />,      text: <>Open app → tap <strong>Scan QR</strong></> },
    { icon: <QrCode size={14} />,      text: <>Scan this QR code</> },
    { icon: <MapPin size={14} />,      text: <><strong>GPS check</strong> — must be within office radius</> },
    { icon: <User size={14} />,        text: <>Tap your <strong>name</strong> from the list</> },
    { icon: <Camera size={14} />,      text: <><strong>Take a selfie</strong></> },
    { icon: <CheckSquare size={14} />, text: <>Press <strong>Check In</strong> or <strong>Check Out</strong></> },
  ];

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-print-area, #qr-print-area * { visibility: visible !important; }
          #qr-print-area {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #f5f0e8 !important;
          }
        }
      `}</style>

      {/* ── Hidden print area ── */}
      <div id="qr-print-area" style={{ display: 'none' }}>
        <div style={{
          background: '#1a1612',
          borderRadius: 8,
          padding: '40px 48px',
          textAlign: 'center',
          boxShadow: '8px 8px 0 rgba(0,0,0,0.3)',
          minWidth: 320,
        }}>
          {/* AttendX Logo */}
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: '#f5f0e8', letterSpacing: -1, marginBottom: 4 }}>
            Attend<span style={{ color: '#c84b2f' }}>X</span>
          </div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 28 }}>
            QR Attendance System
          </div>

          {/* QR Code */}
          <div style={{ background: '#ffffff', padding: 16, borderRadius: 6, display: 'inline-block', marginBottom: 20 }}>
            <QRCodeSVG value={qrValue} size={200} fgColor="#1a1612" bgColor="#ffffff" level="H" />
          </div>

          {/* Company name */}
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>
            {admin?.companyName || 'COMPANY QR'}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', marginTop: 6 }}>
            Scan to mark attendance
          </div>
        </div>
      </div>

      {/* ── Screen UI ── */}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Company QR Code</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 24 }}>Print and display at entrance — employees scan this to begin attendance</div>

      <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 4, padding: 28, display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 28, boxShadow: '4px 4px 0 var(--ink)', flexWrap: 'wrap' }}>

        {/* QR preview on screen */}
        <div>
          <div style={{ background: '#1a1612', borderRadius: 6, padding: '20px 24px', textAlign: 'center', boxShadow: '4px 4px 0 rgba(0,0,0,0.2)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f5f0e8', letterSpacing: -0.5, marginBottom: 2 }}>
              Attend<span style={{ color: '#c84b2f' }}>X</span>
            </div>
            <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 16 }}>
              QR Attendance System
            </div>
            <div style={{ background: '#fff', padding: 10, borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>
              <QRCodeSVG value={qrValue} size={140} fgColor="#1a1612" bgColor="#ffffff" level="H" />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
              {admin?.companyName || 'COMPANY QR'}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => {
              document.getElementById('qr-print-area').style.display = 'flex';
              window.print();
              setTimeout(() => { document.getElementById('qr-print-area').style.display = 'none'; }, 500);
            }}
          >
            <Printer size={14} />Print QR Code
          </button>
        </div>

        {/* Steps */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Employee Steps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink2)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon}{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
