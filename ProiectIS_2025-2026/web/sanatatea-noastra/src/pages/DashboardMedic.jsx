import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const BG_IMAGE = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=70'
const gs = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

const campGol = {
  nume: '', prenume: '', varsta: '', cnp: '', telefon: '', email: '',
  strada: '', oras: '', judet: '', profesie: '', locMunca: '',
  istoricMedical: '', alergii: '', consultatiiCardiologice: '',
  pulsMin: '60', pulsMax: '100', tempMin: '36', tempMax: '37.5',
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.7)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '9px 12px', fontSize: 18, color: '#fff', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
      />
    </div>
  )
}

function TextArea({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.7)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={3}
        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '9px 12px', fontSize: 18, color: '#fff', fontFamily: "'DM Sans', sans-serif", resize: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function calculeazaStatus(pacient) {
  const puls = pacient.puls
  const temp = pacient.temperatura
  const pulsMin = pacient.pulsMin || 60
  const pulsMax = pacient.pulsMax || 100
  const tempMin = pacient.tempMin || 36
  const tempMax = pacient.tempMax || 37.5

  if (puls > pulsMax * 1.2 || puls < pulsMin * 0.8 || temp > tempMax + 1 || temp < tempMin - 0.5) return 'alarm'
  if (puls > pulsMax || puls < pulsMin || temp > tempMax || temp < tempMin) return 'warn'
  return 'ok'
}

function statusStyle(status) {
  if (status === 'ok') return { background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }
  if (status === 'warn') return { background: 'rgba(251,191,36,0.15)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.3)' }
  if (status === 'alarm') return { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }
  return {}
}

function statusText(status) {
  if (status === 'ok') return 'Normal'
  if (status === 'warn') return 'Avertizare'
  if (status === 'alarm') return 'Alarmă'
  return '—'
}

const AVATAR_BG = ['rgba(139,92,246,0.3)', 'rgba(59,130,246,0.3)', 'rgba(16,185,129,0.3)', 'rgba(236,72,153,0.3)', 'rgba(251,146,60,0.3)']
const AVATAR_COLOR = ['#c4b5fd', '#93c5fd', '#6ee7b7', '#f9a8d4', '#fdba74']
function getAv(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  const i = Math.abs(h) % AVATAR_BG.length
  return { bg: AVATAR_BG[i], color: AVATAR_COLOR[i] }
}

function DashboardMedic() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [paginaActiva, setPaginaActiva] = useState('pacienti')
  const [pacienti, setPacienti] = useState([])
  const [cautare, setCautare] = useState('')
  const [modalDeschis, setModalDeschis] = useState(false)
  const [formData, setFormData] = useState(campGol)
  const [tabForm, setTabForm] = useState('demografice')
  const [pacientMonitorizat, setPacientMonitorizat] = useState(null)
  const [dateMonitorizare, setDateMonitorizare] = useState({ puls: [], temperatura: [] })
  // ✅ NOU: state pentru ID-ul ESP32 dupa creare fisa
  const [idEsp32Nou, setIdEsp32Nou] = useState(null)
  const [copiat, setCopiat] = useState(false)
  const navigate = useNavigate()
  const alarmeTrimisteRef = React.useRef(new Set())

  const salveazaAlarma = async (pacient, tip, statusCalculat) => {
    const key = `${pacient._id}-${tip}`
    if (alarmeTrimisteRef.current.has(key)) return
    alarmeTrimisteRef.current.add(key)

    try {
      const mesaj = tip === 'alarm'
        ? `Valori critice: Puls ${pacient.puls} bpm, Temperatura ${pacient.temperatura}°C`
        : `Valori in afara limitelor: Puls ${pacient.puls} bpm, Temperatura ${pacient.temperatura}°C`

      await api.post('/alarme', {
        pacientId: pacient._id,
        tip,
        mesaj,
        puls: pacient.puls,
        temperatura: pacient.temperatura,
      })
    } catch (err) {
      alarmeTrimisteRef.current.delete(key)
      console.error('Eroare la salvarea alarmei:', err)
    }
  }

  const incarcaPacienti = async () => {
    try {
      const uid = sessionStorage.getItem('uid')
      const response = await api.get(`/pacienti/${uid}`)
      const dateNoi = response.data
      setPacienti(dateNoi)

      dateNoi.forEach(p => {
        const status = calculeazaStatus(p)
        if (status === 'alarm') salveazaAlarma(p, 'alarm', status)
        else if (status === 'warn') salveazaAlarma(p, 'warn', status)
        else {
          alarmeTrimisteRef.current.delete(`${p._id}-alarm`)
          alarmeTrimisteRef.current.delete(`${p._id}-warn`)
        }
      })
    } catch (err) {
      console.error('Eroare la încărcare pacienți:', err)
    }
  }

  useEffect(() => {
    incarcaPacienti()
    const interval = setInterval(incarcaPacienti, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!pacientMonitorizat) return
    const incarcaMonitorizare = async () => {
      try {
        const response = await api.get(`/masuratori/${pacientMonitorizat._id}`)
        if (response.data && response.data.length > 0) {
          const masuratori = response.data
          setDateMonitorizare({
            puls: masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.puls || m.puls_mediu })),
            temperatura: masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.temperatura || m.temperatura_medie })),
          })
        }
      } catch (err) {
        console.error('Eroare la încărcare monitorizare:', err)
      }
    }
    incarcaMonitorizare()
    const interval = setInterval(incarcaMonitorizare, 5000)
    return () => clearInterval(interval)
  }, [pacientMonitorizat])

  // ✅ MODIFICAT: handleSalveaza afiseaza ID-ul ESP32 dupa creare
  const handleSalveaza = async () => {
    try {
      const uid = sessionStorage.getItem('uid')
      const datePacientNou = {
        nume: formData.nume,
        prenume: formData.prenume,
        varsta: parseInt(formData.varsta) || 0,
        cnp: formData.cnp,
        telefon: formData.telefon,
        email: formData.email,
        strada: formData.strada,
        oras: formData.oras,
        judet: formData.judet,
        profesie: formData.profesie,
        locMunca: formData.locMunca,
        istoricMedical: formData.istoricMedical,
        alergii: formData.alergii,
        consultatiiCardiologice: formData.consultatiiCardiologice,
        pulsMin: parseInt(formData.pulsMin),
        pulsMax: parseInt(formData.pulsMax),
        tempMin: parseFloat(formData.tempMin),
        tempMax: parseFloat(formData.tempMax),
        puls: 0,
        temperatura: 0,
        ecg: 'Normal',
        status: 'ok',
        medicUid: uid,
      }
      const response = await api.post('/pacienti', datePacientNou)
      const pacientAdaugat = response.data.pacient

      await incarcaPacienti()
      // ✅ In loc sa inchidem modalul, afisam ID-ul ESP32
      setIdEsp32Nou(pacientAdaugat._id)
      setTabForm('success')
    } catch (err) {
      console.error('Eroare la salvare:', err)
      alert('Eroare la salvare. Verifica consola.')
    }
  }

  // ✅ Functie copiere ID in clipboard
  const copiazaId = () => {
    navigator.clipboard.writeText(idEsp32Nou)
    setCopiat(true)
    setTimeout(() => setCopiat(false), 2000)
  }

  // ✅ Inchide modalul si reseteaza tot
  const inchideModal = () => {
    setModalDeschis(false)
    setFormData(campGol)
    setTabForm('demografice')
    setIdEsp32Nou(null)
    setCopiat(false)
  }

  const navItems = [
    { id: 'pacienti', label: 'Pacienții mei', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'alarme', label: 'Alarme & Avertizări', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { id: 'monitorizare', label: 'Monitorizare Live', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ]

  const pacientiCuStatus = pacienti.map(p => ({ ...p, statusCalculat: calculeazaStatus(p) }))
  const alarmeActive = pacientiCuStatus.filter(p => p.statusCalculat === 'alarm')
  const avertizari = pacientiCuStatus.filter(p => p.statusCalculat === 'warn')
  const pacientiFiltrati = pacientiCuStatus.filter(p =>
    `${p.prenume} ${p.nume}`.toLowerCase().includes(cautare.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* Fundal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.18) saturate(0.6)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(76,29,149,0.9) 0%, rgba(15,10,30,0.95) 50%, rgba(15,10,30,0.98) 100%)' }} />
      <div style={{ position: 'fixed', top: -200, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 0, overflow: 'hidden', position: 'relative', zIndex: 10, transition: 'width 0.3s ease', flexShrink: 0, ...gs, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 240, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.5)', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#fff', whiteSpace: 'nowrap' }}>Sănătatea Noastră</div>
                <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>Portal Medic</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '14px 10px' }}>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPaginaActiva(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  fontSize: 18, fontWeight: 400, marginBottom: 3,
                  fontFamily: "'DM Sans', sans-serif", textAlign: 'left', whiteSpace: 'nowrap',
                  transition: 'all 0.18s',
                  background: paginaActiva === item.id ? 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.2))' : 'transparent',
                  color: paginaActiva === item.id ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
                  borderLeft: paginaActiva === item.id ? '2px solid #8b5cf6' : '2px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
                {item.id === 'alarme' && alarmeActive.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 17, fontWeight: 700, borderRadius: 20, padding: '2px 7px' }}>
                    {alarmeActive.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: '#c4b5fd', flexShrink: 0, border: '1px solid rgba(139,92,246,0.3)' }}>
                {(sessionStorage.getItem('nume') || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap' }}>{sessionStorage.getItem('nume') || 'Medic'}</div>
                <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>Medic</div>
              </div>
            </div>
            <button onClick={() => { sessionStorage.clear(); navigate('/') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 17, color: 'rgba(252,165,165,0.8)', background: 'transparent', fontFamily: "'DM Sans', sans-serif", textAlign: 'left' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Deconectare
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 2 }}>

        {/* Topbar */}
        <div style={{ ...gs, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '7px', display: 'flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
              {paginaActiva === 'pacienti' && 'Pacienții mei'}
              {paginaActiva === 'alarme' && 'Alarme & Avertizări'}
              {paginaActiva === 'monitorizare' && 'Monitorizare Live'}
            </h1>
          </div>
          <button onClick={() => { setModalDeschis(true); setTabForm('demografice'); setIdEsp32Nou(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 18, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', boxShadow: '0 4px 15px rgba(139,92,246,0.4)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(139,92,246,0.4)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Pacient nou
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>

          {/* ===== PAGINA PACIENTI ===== */}
          {paginaActiva === 'pacienti' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
                {[
                  { label: 'Total Pacienți', value: pacienti.length, sub: `${pacienti.length} înregistrați`, subColor: '#a78bfa', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))', iconBg: 'rgba(139,92,246,0.2)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                  { label: 'Alarme Active', value: alarmeActive.length, sub: alarmeActive.length > 0 ? 'Necesită atenție imediată' : 'Nicio alarmă', subColor: alarmeActive.length > 0 ? '#fca5a5' : '#6ee7b7', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(185,28,28,0.06))', iconBg: 'rgba(239,68,68,0.2)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
                  { label: 'Avertizări', value: avertizari.length, sub: avertizari.length > 0 ? 'De monitorizat' : 'Totul în regulă', subColor: avertizari.length > 0 ? '#fcd34d' : '#6ee7b7', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(180,83,9,0.06))', iconBg: 'rgba(251,191,36,0.2)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                ].map((card, i) => (
                  <div key={card.label} style={{ ...gs, borderRadius: 16, padding: '20px 22px', background: card.gradient, animation: `fadeInUp 0.45s ease ${0.06 * i}s both`, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                      <div style={{ width: 36, height: 36, background: card.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>{card.icon}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>{card.value}</div>
                    <div style={{ fontSize: 17, color: card.subColor, marginTop: 6 }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...gs, borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.45s ease 0.2s both' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, fontSize: 19, color: '#fff' }}>Lista pacienților</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 12px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Caută pacient..." value={cautare} onChange={e => setCautare(e.target.value)}
                      style={{ border: 'none', outline: 'none', fontSize: 17, color: '#fff', background: 'transparent', fontFamily: "'DM Sans', sans-serif", width: 150 }}
                    />
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Pacient', 'Vârstă', 'Puls', 'Temperatură', 'ECG', 'Status', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 22px', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.6)', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pacientiFiltrati.map((p, idx) => {
                      const initiale = `${(p.prenume || '?')[0]}${(p.nume || '?')[0]}`.toUpperCase()
                      const av = getAv(p._id || String(idx))
                      const st = statusStyle(p.statusCalculat)
                      const pulsInAfara = p.puls > (p.pulsMax || 100) || p.puls < (p.pulsMin || 60)
                      const tempInAfara = p.temperatura > (p.tempMax || 37.5) || p.temperatura < (p.tempMin || 36)
                      return (
                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', animation: `fadeInUp 0.4s ease ${0.04 * idx}s both` }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>{initiale}</div>
                              <span style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{p.prenume} {p.nume}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 22px', fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>{p.varsta} ani</td>
                          <td style={{ padding: '14px 22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, color: pulsInAfara ? '#fca5a5' : 'rgba(255,255,255,0.8)', fontWeight: pulsInAfara ? 600 : 400 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              {p.puls} bpm {pulsInAfara && '⚠'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, color: tempInAfara ? '#fcd34d' : 'rgba(255,255,255,0.8)', fontWeight: tempInAfara ? 600 : 400 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                              {p.temperatura}°C {tempInAfara && '⚠'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 22px', fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>{p.ecg}</td>
                          <td style={{ padding: '14px 22px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 17, fontWeight: 600, ...st }}>{statusText(p.statusCalculat)}</span>
                          </td>
                          <td style={{ padding: '14px 22px' }}>
                            <button onClick={() => navigate(`/fisa/${p._id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 17, color: '#c4b5fd', fontWeight: 500, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.3)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                            >
                              Fișă <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {pacientiFiltrati.length === 0 && (
                      <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>
                        {cautare ? 'Niciun pacient găsit.' : 'Nu ai pacienți înregistrați încă.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PAGINA ALARME ===== */}
          {paginaActiva === 'alarme' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
                {[
                  { label: 'Alarme Active', value: alarmeActive.length, color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
                  { label: 'Avertizări', value: avertizari.length, color: '#fcd34d', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
                  { label: 'Pacienți Normali', value: pacientiCuStatus.filter(p => p.statusCalculat === 'ok').length, color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' },
                ].map(card => (
                  <div key={card.label} style={{ ...gs, borderRadius: 14, padding: '18px 20px', background: card.bg, border: `1px solid ${card.border}` }}>
                    <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{card.label}</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: card.color, letterSpacing: '-1px' }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {alarmeActive.length > 0 && (
                <div style={{ ...gs, borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span style={{ fontSize: 19, fontWeight: 500, color: '#fca5a5' }}>Alarme critice — necesită atenție imediată</span>
                  </div>
                  {alarmeActive.map((p, idx) => (
                    <div key={p._id} style={{ padding: '16px 22px', borderBottom: idx < alarmeActive.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeInUp 0.35s ease ${0.05 * idx}s both` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 8px rgba(239,68,68,0.8)', animation: 'pulse-ring 1.5s ease infinite' }} />
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{p.prenume} {p.nume}</div>
                          <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)' }}>{p.varsta} ani</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
                          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 17 }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Puls: </span>
                            <span style={{ color: '#fca5a5', fontWeight: 600 }}>{p.puls} bpm</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 17 }}> ({p.pulsMin}-{p.pulsMax})</span>
                          </div>
                          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 17 }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Temp: </span>
                            <span style={{ color: '#fca5a5', fontWeight: 600 }}>{p.temperatura}°C</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 17 }}> ({p.tempMin}-{p.tempMax})</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/fisa/${p._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 17, color: '#fca5a5', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
                      >
                        Fișă <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {avertizari.length > 0 && (
                <div style={{ ...gs, borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(251,191,36,0.25)' }}>
                  <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span style={{ fontSize: 19, fontWeight: 500, color: '#fcd34d' }}>Avertizări — de monitorizat</span>
                  </div>
                  {avertizari.map((p, idx) => (
                    <div key={p._id} style={{ padding: '16px 22px', borderBottom: idx < avertizari.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{p.prenume} {p.nume}</div>
                          <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)' }}>{p.varsta} ani</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
                          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 17 }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Puls: </span>
                            <span style={{ color: '#fcd34d', fontWeight: 600 }}>{p.puls} bpm</span>
                          </div>
                          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 17 }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Temp: </span>
                            <span style={{ color: '#fcd34d', fontWeight: 600 }}>{p.temperatura}°C</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/fisa/${p._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 17, color: '#fcd34d', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
                      >
                        Fișă <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {alarmeActive.length === 0 && avertizari.length === 0 && (
                <div style={{ ...gs, borderRadius: 16, padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff', marginBottom: 8 }}>Totul în regulă</div>
                  <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.35)' }}>Niciun pacient nu are valori în afara limitelor normale.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== PAGINA MONITORIZARE LIVE ===== */}
          {paginaActiva === 'monitorizare' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ ...gs, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.6)', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selectează pacientul de monitorizat:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {pacienti.map(p => (
                    <button key={p._id} onClick={() => setPacientMonitorizat(p)}
                      style={{
                        padding: '8px 18px', borderRadius: 20, fontSize: 18, fontWeight: 500,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                        background: pacientMonitorizat?._id === p._id ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(255,255,255,0.08)',
                        color: pacientMonitorizat?._id === p._id ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: pacientMonitorizat?._id === p._id ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: pacientMonitorizat?._id === p._id ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
                      }}
                    >
                      {p.prenume} {p.nume}
                    </button>
                  ))}
                  {pacienti.length === 0 && <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>Nu ai pacienți înregistrați.</p>}
                </div>
              </div>

              {pacientMonitorizat ? (
                <>
                  <div style={{ ...gs, borderRadius: 16, padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)' }}>
                        {`${(pacientMonitorizat.prenume || '?')[0]}${(pacientMonitorizat.nume || '?')[0]}`.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>{pacientMonitorizat.prenume} {pacientMonitorizat.nume}</div>
                        <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>
                          {pacientMonitorizat.varsta} ani · Limite puls: {pacientMonitorizat.pulsMin}-{pacientMonitorizat.pulsMax} bpm · Temp: {pacientMonitorizat.tempMin}-{pacientMonitorizat.tempMax}°C
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6ee7b7', display: 'inline-block', animation: 'pulse-ring 2s ease infinite' }} />
                      <span style={{ fontSize: 17, color: '#6ee7b7', fontWeight: 500 }}>Live · actualizare 5s</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                      { label: 'Puls curent', value: `${pacientMonitorizat.puls}`, unit: 'bpm', bg: 'rgba(239,68,68,0.12)', ok: pacientMonitorizat.puls >= (pacientMonitorizat.pulsMin || 60) && pacientMonitorizat.puls <= (pacientMonitorizat.pulsMax || 100) },
                      { label: 'Temperatură', value: `${pacientMonitorizat.temperatura}`, unit: '°C', bg: 'rgba(251,146,60,0.12)', ok: pacientMonitorizat.temperatura >= (pacientMonitorizat.tempMin || 36) && pacientMonitorizat.temperatura <= (pacientMonitorizat.tempMax || 37.5) },
                      { label: 'ECG', value: pacientMonitorizat.ecg, unit: '', bg: 'rgba(139,92,246,0.12)', ok: true },
                    ].map(item => (
                      <div key={item.label} style={{ ...gs, borderRadius: 14, padding: '18px 20px', background: item.bg }}>
                        <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{item.label}</div>
                        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: item.ok ? '#fff' : '#fca5a5', letterSpacing: '-0.5px', lineHeight: 1 }}>
                          {item.value} <span style={{ fontSize: 19, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{item.unit}</span>
                        </div>
                        <div style={{ fontSize: 17, marginTop: 8, color: item.ok ? '#6ee7b7' : '#fca5a5' }}>
                          {item.ok ? '✓ În limite normale' : '⚠ În afara limitelor'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {[
                    { title: 'Evoluție Puls (astăzi)', data: dateMonitorizare.puls, color: '#a78bfa', domain: [50, 130], name: 'Puls (bpm)', refMin: pacientMonitorizat.pulsMin, refMax: pacientMonitorizat.pulsMax },
                    { title: 'Evoluție Temperatură (astăzi)', data: dateMonitorizare.temperatura, color: '#fb923c', domain: [35, 40], name: 'Temp (°C)', refMin: pacientMonitorizat.tempMin, refMax: pacientMonitorizat.tempMax },
                  ].map(chart => (
                    <div key={chart.title} style={{ ...gs, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff' }}>{chart.title}</span>
                        <div style={{ display: 'flex', gap: 16, fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>
                          <span>Min normal: <strong style={{ color: '#fcd34d' }}>{chart.refMin}</strong></span>
                          <span>Max normal: <strong style={{ color: '#fca5a5' }}>{chart.refMax}</strong></span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="ora" tick={{ fontSize: 17, fill: 'rgba(196,181,253,0.45)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 17, fill: 'rgba(196,181,253,0.45)' }} axisLine={false} tickLine={false} domain={chart.domain} />
                          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div style={{ background: 'rgba(15,10,30,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                              <p style={{ color: 'rgba(196,181,253,0.6)', fontSize: 17, margin: '0 0 4px' }}>{label}</p>
                              <p style={{ color: '#fff', fontSize: 19, fontWeight: 600, margin: 0 }}>{payload[0].value}</p>
                            </div>
                          ) : null} />
                          <Line type="monotone" dataKey="valoare" stroke={chart.color} strokeWidth={2.5} dot={{ r: 4, fill: chart.color, strokeWidth: 0 }} activeDot={{ r: 6 }} name={chart.name} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ ...gs, borderRadius: 16, padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff', marginBottom: 8 }}>Selectează un pacient</div>
                  <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.35)' }}>Alege un pacient din lista de mai sus pentru a-i vedea datele în timp real.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ===== MODAL PACIENT NOU ===== */}
      {modalDeschis && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: '#1a0a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.3s ease' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: tabForm === 'success' ? '#16a34a' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tabForm === 'success'
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  }
                </div>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>
                  {tabForm === 'success' ? 'Fișă creată cu succes!' : 'Pacient Nou'}
                </span>
              </div>
              <button onClick={inchideModal} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '6px', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tab-uri (ascunse pe success) */}
            {tabForm !== 'success' && (
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
                {[{ id: 'demografice', label: 'Date Demografice' }, { id: 'medicale', label: 'Date Medicale' }, { id: 'valori', label: 'Valori Normale' }].map(tab => (
                  <button key={tab.id} onClick={() => setTabForm(tab.id)}
                    style={{ padding: '11px 14px', fontSize: 18, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderBottom: tabForm === tab.id ? '2px solid #8b5cf6' : '2px solid transparent', color: tabForm === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)', marginBottom: -1 }}
                  >{tab.label}</button>
                ))}
              </div>
            )}

            {/* Continut */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

              {/* ✅ ECRAN SUCCESS CU ID ESP32 */}
              {tabForm === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 10 }}>
                  <div style={{ width: 64, height: 64, background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                      Fișa pacientului a fost creată. Copiază ID-ul de mai jos și pune-l în codul ESP32 la <strong style={{ color: '#c4b5fd' }}>PACIENT_ID</strong>.
                    </p>
                  </div>

                  {/* ID-ul ESP32 */}
                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, color: 'rgba(196,181,253,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 600 }}>
                      ID Dispozitiv IoT (ESP32)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <code style={{ flex: 1, fontSize: 15, color: '#e9d5ff', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                        {idEsp32Nou}
                      </code>
                      <button onClick={copiazaId}
                        style={{ flexShrink: 0, padding: '8px 16px', background: copiat ? 'rgba(22,163,74,0.3)' : 'rgba(139,92,246,0.3)', border: `1px solid ${copiat ? 'rgba(22,163,74,0.5)' : 'rgba(139,92,246,0.5)'}`, borderRadius: 8, cursor: 'pointer', color: copiat ? '#6ee7b7' : '#c4b5fd', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                      >
                        {copiat ? '✓ Copiat!' : 'Copiază'}
                      </button>
                    </div>
                  </div>

                  <div style={{ width: '100%', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 14, color: '#fcd34d', margin: 0, lineHeight: 1.6 }}>
                      ⚠ Pune acest ID în fișierul <strong>esp32_sanatate.ino</strong> la linia:<br/>
                      <code style={{ fontSize: 13, color: '#fef3c7' }}>const char* PACIENT_ID = "{idEsp32Nou}";</code>
                    </p>
                  </div>
                </div>
              )}

              {tabForm === 'demografice' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Nume" placeholder="ex: Popescu" value={formData.nume} onChange={e => setFormData({ ...formData, nume: e.target.value })} />
                  <Field label="Prenume" placeholder="ex: Ion" value={formData.prenume} onChange={e => setFormData({ ...formData, prenume: e.target.value })} />
                  <Field label="Vârstă" placeholder="ex: 65" type="number" value={formData.varsta} onChange={e => setFormData({ ...formData, varsta: e.target.value })} />
                  <Field label="CNP" placeholder="ex: 1570312034521" value={formData.cnp} onChange={e => setFormData({ ...formData, cnp: e.target.value })} />
                  <Field label="Telefon" placeholder="ex: 0722-123-456" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} />
                  <Field label="Email" placeholder="ex: ion@email.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  <Field label="Stradă și număr" placeholder="ex: Str. Florilor nr. 12" value={formData.strada} onChange={e => setFormData({ ...formData, strada: e.target.value })} />
                  <Field label="Oraș" placeholder="ex: Timișoara" value={formData.oras} onChange={e => setFormData({ ...formData, oras: e.target.value })} />
                  <Field label="Județ" placeholder="ex: Timiș" value={formData.judet} onChange={e => setFormData({ ...formData, judet: e.target.value })} />
                  <Field label="Profesie" placeholder="ex: Pensionar" value={formData.profesie} onChange={e => setFormData({ ...formData, profesie: e.target.value })} />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Loc de muncă" placeholder="ex: Pensionat" value={formData.locMunca} onChange={e => setFormData({ ...formData, locMunca: e.target.value })} />
                  </div>
                </div>
              )}
              {tabForm === 'medicale' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <TextArea label="Istoric Medical" placeholder="ex: Hipertensiune arterială diagnosticată în 2015..." value={formData.istoricMedical} onChange={e => setFormData({ ...formData, istoricMedical: e.target.value })} />
                  <TextArea label="Alergii" placeholder="ex: Penicilină, Aspirină..." value={formData.alergii} onChange={e => setFormData({ ...formData, alergii: e.target.value })} />
                  <TextArea label="Consultații Cardiologice" placeholder="ex: Ultima consultație: 10.01.2026..." value={formData.consultatiiCardiologice} onChange={e => setFormData({ ...formData, consultatiiCardiologice: e.target.value })} />
                </div>
              )}
              {tabForm === 'valori' && (
                <div>
                  <p style={{ fontSize: 18, color: 'rgba(196,181,253,0.5)', marginBottom: 16 }}>Definește valorile normale personalizate pentru acest pacient. Sistemul va genera alarme automat dacă valorile depășesc aceste limite.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Puls minim (bpm)" placeholder="ex: 60" type="number" value={formData.pulsMin} onChange={e => setFormData({ ...formData, pulsMin: e.target.value })} />
                    <Field label="Puls maxim (bpm)" placeholder="ex: 100" type="number" value={formData.pulsMax} onChange={e => setFormData({ ...formData, pulsMax: e.target.value })} />
                    <Field label="Temperatură minimă (°C)" placeholder="ex: 36.0" type="number" value={formData.tempMin} onChange={e => setFormData({ ...formData, tempMin: e.target.value })} />
                    <Field label="Temperatură maximă (°C)" placeholder="ex: 37.5" type="number" value={formData.tempMax} onChange={e => setFormData({ ...formData, tempMax: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {tabForm === 'success' ? (
                <button onClick={inchideModal}
                  style={{ width: '100%', padding: '10px', fontSize: 18, color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  Închide
                </button>
              ) : (
                <>
                  <button onClick={inchideModal} style={{ padding: '8px 14px', fontSize: 18, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Anulează</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tabForm !== 'demografice' && (
                      <button onClick={() => setTabForm(tabForm === 'valori' ? 'medicale' : 'demografice')}
                        style={{ padding: '8px 16px', fontSize: 18, color: '#c4b5fd', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>← Înapoi</button>
                    )}
                    {tabForm !== 'valori' ? (
                      <button onClick={() => setTabForm(tabForm === 'demografice' ? 'medicale' : 'valori')}
                        style={{ padding: '8px 16px', fontSize: 18, color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>Continuă →</button>
                    ) : (
                      <button onClick={handleSalveaza}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', fontSize: 18, color: '#fff', background: '#16a34a', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Salvează Pacient
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse-ring { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(0.65); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </div>
  )
}

export default DashboardMedic
