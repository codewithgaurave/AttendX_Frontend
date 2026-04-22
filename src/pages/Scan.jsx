import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, User, CheckCircle, XCircle, Clock, Navigation, AlertTriangle, RefreshCw, Home, LogIn, LogOut } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../utils/api';
import { avt, fmtTime } from '../utils/api';
import { toast } from '../components/Toast';

const STEPS = { camera: 1, gps: 2, pick: 3, selfie: 4, confirm: 5, done: 5, blocked: 2 };
const LABELS = { camera: 'Scan QR Code', gps: 'Verifying Location', pick: 'Select Your Name', selfie: 'Take a Selfie', confirm: 'Confirm Attendance', done: 'Done!', blocked: 'Access Denied' };

export default function Scan() {
  const nav = useNavigate();
  const [step, setStep] = useState('camera');
  const [adminId, setAdminId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selEmp, setSelEmp] = useState(null);
  const [geoResult, setGeoResult] = useState(null);
  const [selfieData, setSelfieData] = useState(null);
  const [search, setSearch] = useState('');
  const [doneData, setDoneData] = useState(null);
  const [blockedInfo, setBlockedInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => { stopCamera(); stopSelfie(); }, []);

  useEffect(() => {
    if (step === 'camera') setTimeout(startCamera, 300);
    if (step === 'gps')    setTimeout(startGPS, 300);
    if (step === 'selfie') setTimeout(startSelfie, 300);
  }, [step]);

  const startCamera = () => {
    if (scannerRef.current) return;
    const el = document.getElementById('qr-reader');
    if (!el) return;
    const sc = new Html5Qrcode('qr-reader');
    scannerRef.current = sc;
    sc.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 180, height: 180 } },
      text => {
        try {
          const data = JSON.parse(text);
          if (data.adminId) { stopCamera(); setAdminId(data.adminId); setStep('gps'); }
          else toast('Invalid QR code');
        } catch { toast('Invalid QR code'); }
      }, () => {}
    ).catch(() => { scannerRef.current = null; });
  };

  const stopCamera = () => {
    if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
  };

  const startGPS = () => {
    if (!navigator.geolocation) { setStep('pick'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setGeoResult({ ok: true, lat: pos.coords.latitude, long: pos.coords.longitude }),
      () => setGeoResult({ ok: false, error: 'Location access denied' }),
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!geoResult) return;
    if (geoResult.ok) {
      setTimeout(() => {
        api.get(`/attendance/employees/${adminId}`).then(r => { setEmployees(r.data); setStep('pick'); });
      }, 1000);
    } else {
      setBlockedInfo({ error: geoResult.error });
      setStep('blocked');
    }
  }, [geoResult]);

  const startSelfie = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { /* denied */ }
  };

  const stopSelfie = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, -300, 300); ctx.restore();
    setSelfieData(canvas.toDataURL('image/jpeg', 0.6));
    stopSelfie();
    setTimeout(() => setStep('confirm'), 800);
  };

  const markAttendance = async (type) => {
    if (!selEmp || !geoResult) return;
    setLoading(true);
    try {
      const endpoint = type === 'in' ? '/attendance/checkin' : '/attendance/checkout';
      const { data } = await api.post(endpoint, { employeeId: selEmp._id, adminId, lat: geoResult.lat, long: geoResult.long, selfie: selfieData || '' });
      setDoneData({ type, data, emp: selEmp });
      setStep('done');
    } catch (e) {
      if (e.response?.status === 403) { setBlockedInfo(e.response.data); setStep('blocked'); }
      else toast(e.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const goBack = () => {
    const map = { camera: '/', gps: 'camera', blocked: 'camera', pick: 'gps', selfie: 'pick', confirm: 'selfie', done: '/' };
    const next = map[step];
    if (next === '/') { stopSelfie(); nav('/'); }
    else { if (step === 'selfie') stopSelfie(); setStep(next); }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 16, background: 'var(--ink)' }}>
      <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 440, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <button onClick={goBack} style={{ width: 32, height: 32, border: '1.5px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, flex: 1 }}>{LABELS[step]}</div>
          {step !== 'done' && step !== 'blocked' && (
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--ink2)', background: 'var(--border)', padding: '3px 8px', borderRadius: 2 }}>
              {STEPS[step]} / 5
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, padding: '14px 18px 0' }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: STEPS[step] > n ? 'var(--success)' : STEPS[step] === n ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {step === 'camera'  && <CameraStep />}
          {step === 'gps'     && <GPSStep geoResult={geoResult} />}
          {step === 'blocked' && <BlockedStep info={blockedInfo} onRetry={() => { setGeoResult(null); setStep('gps'); }} onHome={() => nav('/')} />}
          {step === 'pick'    && <PickStep employees={filtered} search={search} setSearch={setSearch} geoResult={geoResult} onPick={e => { setSelEmp(e); setStep('selfie'); }} />}
          {step === 'selfie'  && <SelfieStep videoRef={videoRef} selfieData={selfieData} onCapture={captureSelfie} onSkip={() => { stopSelfie(); setStep('confirm'); }} />}
          {step === 'confirm' && <ConfirmStep emp={selEmp} selfieData={selfieData} geoResult={geoResult} loading={loading} onMark={markAttendance} onBack={() => setStep('pick')} />}
          {step === 'done'    && <DoneStep doneData={doneData} onHome={() => nav('/')} />}
        </div>
      </div>
    </div>
  );
}

function CameraStep() {
  return (
    <>
      <div style={{ position: 'relative', background: 'var(--ink)', borderRadius: 4, overflow: 'hidden', marginBottom: 16, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="scan-corner sc-tl" /><div className="scan-corner sc-tr" />
        <div className="scan-corner sc-bl" /><div className="scan-corner sc-br" />
        <div className="scan-line" />
        <div id="qr-reader" style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink2)', textAlign: 'center', justifyContent: 'center' }}>
        <Camera size={14} />Point camera at the company QR code at the entrance
      </div>
    </>
  );
}

function GPSStep({ geoResult }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Navigation size={28} color="var(--accent2)" />
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Verifying Your Location</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 24, lineHeight: 1.6 }}>Please allow location access when prompted.</div>
      <div className="gps-radar">
        <div className="gps-radar-ring" style={{ width: '80%', height: '80%', top: '10%', left: '10%' }} />
        <div className="gps-radar-ring" style={{ width: '50%', height: '50%', top: '25%', left: '25%' }} />
        <div className="gps-radar-dot" style={{ background: geoResult ? (geoResult.ok ? 'var(--success)' : 'var(--danger)') : 'var(--accent2)' }} />
      </div>
      {!geoResult && <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>Detecting location…</div>}
      {geoResult?.ok && <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CheckCircle size={16} />Location verified!</div>}
    </div>
  );
}

function BlockedStep({ info, onRetry, onHome }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fdeee8', border: '2px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <XCircle size={28} color="var(--danger)" />
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--danger)' }}>Attendance Blocked</div>
      {info?.distance && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 500, color: 'var(--danger)', marginBottom: 6 }}>{info.distance}m</div>}
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 20, lineHeight: 1.6 }}>
        {info?.violation || info?.error || 'Could not verify your location.'}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} />Retry</button>
        <button className="btn" onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Home size={14} />Home</button>
      </div>
    </div>
  );
}

function PickStep({ employees, search, setSearch, geoResult, onPick }) {
  return (
    <>
      {geoResult?.ok && (
        <div style={{ fontSize: 12, color: 'var(--success)', background: '#e8f5ee', border: '1px solid #b8dcc8', borderRadius: 4, padding: '8px 12px', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={13} />Location verified — tap your name
        </div>
      )}
      <div style={{ fontSize: 13, color: 'var(--success)', background: '#e8f5ee', border: '1px solid #b8dcc8', borderRadius: 4, padding: '8px 12px', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={13} />QR verified — tap your name
      </div>
      <input className="form-inp" placeholder="Search your name..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {employees.length === 0 && <div className="empty-state"><User size={32} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--ink2)' }} /><div>No employees found</div></div>}
        {employees.map(e => (
          <div key={e._id} onClick={() => onPick(e)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 4, cursor: 'pointer', background: 'var(--surface)', transition: 'all 0.15s' }}
            onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--ink)'; ev.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'var(--border)'; ev.currentTarget.style.background = 'var(--surface)'; }}>
            <div className="emp-avt">{avt(e.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 2 }}>{e.designation} · {e.employeeCode}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SelfieStep({ videoRef, selfieData, onCapture, onSkip }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Quick Selfie</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 20, lineHeight: 1.6 }}>Look at the camera and press capture.</div>
      <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${selfieData ? 'var(--success)' : 'var(--ink)'}`, background: 'var(--ink)' }}>
        {selfieData
          ? <img src={selfieData} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          : <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />}
        {selfieData && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'var(--success)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={16} color="#fff" />
          </div>
        )}
      </div>
      {!selfieData && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onCapture} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={15} />Capture Photo
          </button>
          <button className="btn" style={{ borderStyle: 'dashed', fontSize: 12 }} onClick={onSkip}>Skip</button>
        </div>
      )}
    </div>
  );
}

function ConfirmStep({ emp, selfieData, geoResult, loading, onMark, onBack }) {
  if (!emp) return null;
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {geoResult?.ok && (
          <span style={{ background: '#e8f5ee', border: '1px solid #b8dcc8', padding: '4px 10px', borderRadius: 2, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} />GPS verified
          </span>
        )}
        {selfieData
          ? <span style={{ background: '#e8f5ee', border: '1px solid #b8dcc8', padding: '4px 10px', borderRadius: 2, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={11} />Photo taken</span>
          : <span style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '4px 10px', borderRadius: 2, fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#856404', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} />No photo</span>}
      </div>
      {selfieData
        ? <img src={selfieData} alt="selfie" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--success)', margin: '0 auto 12px', display: 'block' }} />
        : <div className="emp-avt" style={{ width: 72, height: 72, fontSize: 24, fontWeight: 800, margin: '0 auto 16px', borderRadius: 8 }}>{avt(emp.name)}</div>}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{emp.name}</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 20 }}>{emp.designation} · {emp.employeeCode}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <ActionBtn color="var(--success)" icon={<LogIn size={22} />} label="CHECK IN" sub="Mark arrival" onClick={() => onMark('in')} disabled={loading} />
        <ActionBtn color="var(--danger)"  icon={<LogOut size={22} />} label="CHECK OUT" sub="Mark departure" onClick={() => onMark('out')} disabled={loading} />
      </div>
      <button className="btn btn-full" style={{ marginTop: 12, borderStyle: 'dashed', fontWeight: 400, fontSize: 12 }} onClick={onBack}>← Change Name</button>
    </div>
  );
}

function ActionBtn({ color, icon, label, sub, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ flex: 1, padding: '14px 10px', border: `2px solid ${color}`, borderRadius: 4, background: hov ? color : 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: hov ? '#fff' : color, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s', opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon}<span>{label}</span>
      <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', fontWeight: 400, opacity: 0.8 }}>{sub}</span>
    </button>
  );
}

function DoneStep({ doneData, onHome }) {
  if (!doneData) return null;
  const { type, data, emp } = doneData;
  const att = data.attendance;
  const isIn = type === 'in';
  return (
    <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
      <div className="pop-in" style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: isIn ? '#e8f5ee' : '#fdeee8', border: `2px solid ${isIn ? 'var(--success)' : 'var(--danger)'}` }}>
        {isIn ? <CheckCircle size={36} color="var(--success)" /> : <LogOut size={36} color="var(--danger)" />}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{isIn ? 'Welcome In!' : 'See You!'}</div>
      <div style={{ fontSize: 15, color: 'var(--ink2)', marginBottom: 20 }}>{emp.name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
        {att?.checkIn?.time && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><Clock size={11} />In</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 500 }}>{fmtTime(att.checkIn.time)}</div>
          </div>
        )}
        {att?.checkOut?.time && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><Clock size={11} />Out</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 500 }}>{fmtTime(att.checkOut.time)}</div>
          </div>
        )}
      </div>
      {data.analysis?.hoursWorked && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'DM Mono, monospace', fontSize: 13, marginBottom: 16 }}>
          <Clock size={13} />Total: {data.analysis.hoursWorked}
        </div>
      )}
      {data.withinRadius && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ background: '#e8f5ee', border: '1px solid #b8dcc8', padding: '5px 12px', borderRadius: 2, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} />{data.distance}m · GPS verified
          </span>
        </div>
      )}
      <button className="btn btn-primary" onClick={onHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        Done <Home size={14} />
      </button>
    </div>
  );
}
