import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const BG_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80'

function ConfigurareContPacient() {
  const [cnp, setCnp] = useState('')
  const [eroare, setEroare] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCautare = async () => {
    if (!cnp || cnp.length !== 13) { setEroare('CNP-ul trebuie să aibă 13 cifre.'); return }
    setLoading(true); setEroare('')
    try {
      const uid = sessionStorage.getItem('uid')
      await api.post('/link-pacient', { cnp, uid })
      sessionStorage.setItem('fisaConfigurata', 'true')
      navigate('/pacient')
    } catch (err) {
      setEroare(err.response?.data?.mesaj || 'Nu ne-am putut conecta la server.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.2) saturate(0.7)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(76,29,149,0.9) 0%, rgba(15,10,30,0.96) 100%)' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '44px 40px', width: '100%', maxWidth: 420, animation: 'fadeInUp 0.5s ease both' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 16, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,92,246,0.5)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff', marginBottom: 8 }}>Configurare Cont</div>
          <p style={{ fontSize: 18, color: 'rgba(196,181,253,0.6)', lineHeight: 1.6 }}>Introdu CNP-ul tău pentru a-ți găsi<br/>fișa medicală în sistem.</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.7)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CNP</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 11, padding: '0 14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.4)" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 10, flexShrink: 0 }}>
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <input type="text" placeholder="ex: 1570312034521" value={cnp} maxLength={13} onChange={e => setCnp(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCautare()}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 19, color: '#fff', padding: '13px 0', fontFamily: "'DM Sans', sans-serif", background: 'transparent', letterSpacing: '0.5px' }}
            />
            <span style={{ fontSize: 17, color: cnp.length === 13 ? '#a78bfa' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{cnp.length}/13</span>
          </div>
        </div>

        {eroare && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
            <p style={{ fontSize: 18, color: '#fca5a5', margin: 0 }}>{eroare}</p>
          </div>
        )}

        <button onClick={handleCautare} disabled={loading}
          style={{ width: '100%', padding: '13px', background: loading ? 'rgba(139,92,246,0.35)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 19, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.4)', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!loading) { e.target.style.transform='translateY(-1px)'; e.target.style.boxShadow='0 6px 20px rgba(139,92,246,0.55)' }}}
          onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 16px rgba(139,92,246,0.4)' }}
        >
          {loading ? 'Se caută...' : 'Găsește fișa mea'}
        </button>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 11 }}>
          <p style={{ fontSize: 17, color: 'rgba(196,181,253,0.6)', margin: 0, lineHeight: 1.6 }}>CNP-ul tău trebuie să fie înregistrat de medicul tău înainte de a putea continua.</p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 17, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>© 2026 Clinica Sănătatea Noastră</p>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </div>
  )
}
export default ConfigurareContPacient