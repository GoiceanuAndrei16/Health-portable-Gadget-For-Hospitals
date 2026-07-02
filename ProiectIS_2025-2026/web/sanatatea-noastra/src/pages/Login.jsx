import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const BG_IMAGE = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80'

function Login() {
  const [email, setEmail] = useState('')
  const [parola, setParola] = useState('')
  const [confirmaParola, setConfirmaParola] = useState('')
  const [nume, setNume] = useState('')
  const [cnp, setCnp] = useState('')
  const [showParola, setShowParola] = useState(false)
  const [eroare, setEroare] = useState('')
  const [loading, setLoading] = useState(false)
  const [modRegistrare, setModRegistrare] = useState(false)
  const navigate = useNavigate()

  // ══ LOGIN ══════════════════════════════════════════════
  const handleLogin = async () => {
    if (!email || !parola) { setEroare('Completează email-ul și parola.'); return }
    if (!email.includes('@')) { setEroare('Email-ul nu este valid.'); return }

    setLoading(true); setEroare('')
    try {
      // ✅ Nu mai trimitem rol_cerut — serverul determina rolul automat
      const response = await api.post('/login', { email, parola })
      const user = response.data.utilizator

      sessionStorage.setItem('autentificat', 'true')
      sessionStorage.setItem('rol', user.rol)
      sessionStorage.setItem('uid', user._id)
      sessionStorage.setItem('nume', user.nume)

      // ✅ Redirectionare in functie de rol — fara pagina intermediara
      if (user.rol === 'medic') navigate('/medic')
      else if (user.rol === 'admin') navigate('/admin')
      else navigate('/pacient')

    } catch (err) {
      setEroare(err.response?.data?.mesaj || 'Email sau parolă greșite.')
    }
    setLoading(false)
  }

  // ══ REGISTER ═══════════════════════════════════════════
  const handleRegistrare = async () => {
    if (!nume.trim()) { setEroare('Completează numele complet.'); return }
    if (!email || !email.includes('@')) { setEroare('Email-ul nu este valid.'); return }
    if (parola.length < 6) { setEroare('Parola trebuie să aibă minim 6 caractere.'); return }
    if (parola !== confirmaParola) { setEroare('Parolele nu coincid.'); return }
    if (cnp.trim().length !== 13 || !/^\d+$/.test(cnp.trim())) {
      setEroare('CNP-ul trebuie să aibă exact 13 cifre.')
      return
    }

    setLoading(true); setEroare('')
    try {
      // ✅ Rol fix: pacient + CNP pentru legare automata de fisa
      await api.post('/register', {
        nume: nume.trim(),
        email: email.trim().toLowerCase(),
        parola,
        rol: 'pacient',
        cnp: cnp.trim(),
      })

      // ✅ Dupa register, mergem la login
      setModRegistrare(false)
      setEroare('')
      setNume(''); setCnp(''); setParola(''); setConfirmaParola('')
      setEroare('Cont creat cu succes! Loghează-te acum.')

    } catch (err) {
      setEroare(err.response?.data?.mesaj || 'Acest email este deja înregistrat.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(196,181,253,0.8)',
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  return (
    <div style={{ height: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* Fundal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.25) saturate(0.8)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(76,29,149,0.88) 0%, rgba(15,10,30,0.95) 60%, rgba(15,10,30,0.98) 100%)' }} />
      <div style={{ position: 'fixed', top: -100, right: -100, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -150, left: -150, width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 60, width: '85%', maxWidth: 1100, animation: 'fadeInUp 0.6s ease both' }}>

          {/* Coloana stanga — branding */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,92,246,0.5)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff', letterSpacing: '-0.3px' }}>Sănătatea Noastră</div>
                <div style={{ fontSize: 13, color: 'rgba(196,181,253,0.5)' }}>Sistem de monitorizare medicală</div>
              </div>
            </div>

            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: '#fff', lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-1px' }}>
                {modRegistrare ? 'Creare cont pacient' : 'Bine ai revenit'}
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
                {modRegistrare
                  ? 'Creează-ți contul cu CNP-ul primit de la medicul tău pentru a-ți accesa fișa medicală.'
                  : 'Accesează platforma de monitorizare a stării de sănătate în timp real.'}
              </p>
            </div>

            {/* Info box */}
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, color: 'rgba(196,181,253,0.7)', margin: 0, lineHeight: 1.6 }}>
                {modRegistrare
                  ? '⚕️ Conturile de medic sunt create de administrator. Înregistrarea este disponibilă doar pentru pacienți.'
                  : '🔒 Sistemul determină automat rolul tău după autentificare.'}
              </p>
            </div>
          </div>

          {/* Coloana dreapta — formular */}
          <div style={{ width: 420, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#fff', margin: '0 0 28px', letterSpacing: '-0.3px' }}>
              {modRegistrare ? 'Înregistrare' : 'Autentificare'}
            </h2>

            {/* Campuri register */}
            {modRegistrare && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nume complet</label>
                <input type="text" placeholder="ex: Ion Popescu" value={nume} onChange={e => setNume(e.target.value)} style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="exemplu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Parolă</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showParola ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={parola}
                  onChange={e => setParola(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (modRegistrare ? handleRegistrare() : handleLogin())}
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button onClick={() => setShowParola(!showParola)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
                  {showParola
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Confirma parola — doar la register */}
            {modRegistrare && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Confirmă parola</label>
                <input type="password" placeholder="••••••••" value={confirmaParola} onChange={e => setConfirmaParola(e.target.value)} style={inputStyle} />
              </div>
            )}

            {/* CNP — doar la register */}
            {modRegistrare && (
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>CNP</label>
                <input
                  type="text"
                  placeholder="13 cifre"
                  value={cnp}
                  onChange={e => setCnp(e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
                  style={inputStyle}
                  maxLength={13}
                />
                {cnp.length > 0 && (
                  <p style={{ fontSize: 12, color: cnp.length === 13 ? '#6ee7b7' : '#fca5a5', margin: '6px 0 0' }}>
                    {cnp.length}/13 cifre {cnp.length === 13 ? '✓' : ''}
                  </p>
                )}
                <p style={{ fontSize: 12, color: 'rgba(196,181,253,0.5)', margin: '6px 0 0', fontStyle: 'italic' }}>
                  CNP-ul leagă contul tău de fișa medicală creată de medic.
                </p>
              </div>
            )}

            {!modRegistrare && <div style={{ marginBottom: 22 }} />}

            {/* Eroare / succes */}
            {eroare && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: eroare.includes('succes') ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                border: `1px solid ${eroare.includes('succes') ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)'}`,
                borderRadius: 11
              }}>
                <p style={{ fontSize: 14, color: eroare.includes('succes') ? '#6ee7b7' : '#fca5a5', margin: 0 }}>{eroare}</p>
              </div>
            )}

            {/* Buton principal */}
            <button
              onClick={modRegistrare ? handleRegistrare : handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: '15px', fontSize: 16, background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, boxShadow: '0 4px 20px rgba(139,92,246,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 28px rgba(139,92,246,0.55)' }}}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(139,92,246,0.4)' }}
            >
              {loading ? 'Se procesează...' : modRegistrare ? 'Creează cont' : 'Intră în cont'}
            </button>

            {/* Toggle login/register */}
            <button
              onClick={() => { setModRegistrare(!modRegistrare); setEroare(''); setParola(''); setConfirmaParola(''); setCnp('') }}
              style={{ width: '100%', marginTop: 12, padding: '10px', background: 'none', border: 'none', fontSize: 14, color: 'rgba(196,181,253,0.6)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              {modRegistrare ? 'Ai deja cont? Intră în cont' : 'Nu ai cont? Înregistrează-te'}
            </button>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  )
}

export default Login
