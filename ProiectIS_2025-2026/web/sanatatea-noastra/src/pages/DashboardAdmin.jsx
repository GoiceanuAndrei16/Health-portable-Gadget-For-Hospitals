import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const BG_IMAGE = 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1400&q=70'
const gs = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

function DashboardAdmin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [pacienti, setPacienti] = useState([])
  const [error, setError] = useState('')

  const incarcaDate = async () => {
    setLoading(true); setError('')
    try {
      const [ovRes, usersRes, pacientiRes] = await Promise.all([api.get('/admin/overview'), api.get('/admin/users'), api.get('/admin/pacienti')])
      setOverview(ovRes.data); setUsers(usersRes.data); setPacienti(pacientiRes.data)
    } catch (err) { setError('Nu am putut încărca datele administrative. Verifică serverul backend.'); console.error(err) }
    setLoading(false)
  }

  useEffect(() => { incarcaDate() }, [])

  const handleRoleChange = async (userId, role) => {
    setSavingUserId(userId)
    try { await api.put(`/admin/users/${userId}/role`, { rol: role }); setUsers(c => c.map(u => u._id === userId ? {...u, rol: role} : u)) }
    catch (err) { alert('Rolul nu a putut fi actualizat.'); console.error(err) }
    setSavingUserId('')
  }

  const roleBadge = (role) => {
    if (role === 'admin') return { bg: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: 'rgba(139,92,246,0.4)' }
    if (role === 'medic') return { bg: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: 'rgba(59,130,246,0.35)' }
    return { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: 'rgba(16,185,129,0.35)' }
  }

  const thStyle = { textAlign: 'left', padding: '10px 16px', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }
  const tdStyle = { padding: '12px 16px', fontSize: 18, color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.15) saturate(0.5)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(76,29,149,0.9) 0%, rgba(15,10,30,0.95) 55%, rgba(15,10,30,0.98) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ ...gs, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '18px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(139,92,246,0.5)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>Portal Administrator</div>
              <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.45)' }}>Control acces și monitorizare sistem</div>
            </div>
          </div>
          <button onClick={() => { sessionStorage.clear(); navigate('/') }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 18, color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Deconectare
          </button>
        </div>

        <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {error && <div style={{ ...gs, borderRadius: 11, padding: '12px 16px', fontSize: 18, color: '#fca5a5', background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' }}>{error}</div>}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Utilizatori', value: overview?.totalUtilizatori ?? '—', color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)', delay: '0s' },
              { label: 'Medici', value: overview?.totalMedici ?? '—', color: '#93c5fd', bg: 'rgba(59,130,246,0.15)', delay: '0.06s' },
              { label: 'Fișe pacient', value: overview?.totalPacientiCuFisa ?? '—', color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', delay: '0.12s' },
              { label: 'Măsurători IoT', value: overview?.totalMasuratori ?? '—', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', delay: '0.18s' },
            ].map(card => (
              <div key={card.label} style={{ ...gs, borderRadius: 15, padding: '20px 22px', background: card.bg, animation: `fadeInUp 0.4s ease ${card.delay} both`, transition: 'transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{card.label}</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Users + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <div style={{ ...gs, borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.2s both' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff' }}>Gestionare utilizatori și roluri</span>
                <span style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '3px 10px' }}>Permission ranking activ</span>
              </div>
              {loading ? <p style={{ padding: '20px', fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>Se încarcă...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Nume','Email','Rol curent','Schimbă rol'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u => {
                      const badge = roleBadge(u.rol)
                      return (
                        <tr key={u._id} onMouseEnter={e => e.currentTarget.style.background='rgba(139,92,246,0.07)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{...tdStyle, fontWeight:500, color:'#fff'}}>{u.nume}</td>
                          <td style={tdStyle}>{u.email}</td>
                          <td style={tdStyle}><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}` }}>{u.rol}</span></td>
                          <td style={tdStyle}>
                            <select value={u.rol} onChange={e => handleRoleChange(u._id, e.target.value)} disabled={savingUserId===u._id}
                              style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'5px 8px', fontSize:12, color:'#fff', outline:'none', fontFamily:"'DM Sans', sans-serif", cursor:'pointer' }}>
                              <option value="admin" style={{background:'#1a0a2e'}}>admin</option>
                              <option value="medic" style={{background:'#1a0a2e'}}>medic</option>
                              <option value="pacient" style={{background:'#1a0a2e'}}>pacient</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: 'fadeInUp 0.4s ease 0.26s both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 16 }}>Status clinic</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Alarme', value: overview?.statusPacienti?.alarme ?? 0, color: '#fca5a5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
                  { label: 'Avertizări', value: overview?.statusPacienti?.avertizari ?? 0, color: '#fcd34d', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
                  { label: 'Normale', value: overview?.statusPacienti?.normale ?? 0, color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:item.bg, borderRadius:11, border:`1px solid ${item.border}` }}>
                    <span style={{ fontSize:13, color:item.color }}>{item.label}</span>
                    <strong style={{ fontSize:18, color:item.color, fontFamily:"'DM Serif Display', serif" }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fise medicale */}
          <div style={{ ...gs, borderRadius: 16, overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.3s both' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff' }}>Fișe medicale din baza de date</span>
            </div>
            {loading ? <p style={{ padding:'20px', fontSize:13, color:'rgba(255,255,255,0.35)' }}>Se încarcă...</p>
              : pacienti.length === 0 ? <p style={{ padding:'20px', fontSize:13, color:'rgba(255,255,255,0.35)' }}>Nu există fișe medicale înregistrate.</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Pacient','Medic responsabil','Puls','Temperatură','Status','Acțiuni'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pacienti.map(p => {
                      const st = p.status==='alarm' ? {bg:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'rgba(239,68,68,0.3)'} : p.status==='warn' ? {bg:'rgba(251,191,36,0.15)',color:'#fcd34d',border:'rgba(251,191,36,0.3)'} : {bg:'rgba(139,92,246,0.15)',color:'#c4b5fd',border:'rgba(139,92,246,0.3)'}
                      return (
                        <tr key={p._id} onMouseEnter={e => e.currentTarget.style.background='rgba(139,92,246,0.07)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{...tdStyle, fontWeight:500, color:'#fff'}}>{p.prenume} {p.nume}</td>
                          <td style={tdStyle}>{p.medicNume}</td>
                          <td style={tdStyle}>{p.puls} bpm</td>
                          <td style={tdStyle}>{p.temperatura}°C</td>
                          <td style={tdStyle}><span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>{p.status==='alarm'?'Alarmă':p.status==='warn'?'Avertizare':'Normal'}</span></td>
                          <td style={tdStyle}>
                            <button onClick={() => navigate(`/fisa/${p._id}`)}
                              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', fontSize:12, color:'#c4b5fd', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", fontWeight:500 }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Vezi fișa
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
export default DashboardAdmin