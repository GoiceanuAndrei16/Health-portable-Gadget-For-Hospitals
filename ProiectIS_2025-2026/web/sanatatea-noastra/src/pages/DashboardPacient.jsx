import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const BG_IMAGE = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1400&q=70'

const gs = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

function DashboardPacient() {
  const [paginaActiva, setPaginaActiva] = useState('acasa')
  const [pacient, setPacient] = useState(null)
  const [recomandari, setRecomandari] = useState([])
  const [datePuls, setDatePuls] = useState([])
  const [dateTemperatura, setDateTemperatura] = useState([])
  const [loading, setLoading] = useState(true)
  const [alarme, setAlarme] = useState([])
  const navigate = useNavigate()

  const nume = sessionStorage.getItem('nume') || 'Pacient'
  const uid = sessionStorage.getItem('uid')

  useEffect(() => {
    const incarcaDate = async () => {
      try {
        const responseFisa = await api.get(`/pacient-fisa/${uid}`)
        if (responseFisa.data) {
          let datePacient = responseFisa.data
          const responseMasuratori = await api.get(`/masuratori/${datePacient._id}`)
          if (responseMasuratori.data && responseMasuratori.data.length > 0) {
            const masuratori = responseMasuratori.data
            const ultima = masuratori[masuratori.length - 1]
            datePacient = { ...datePacient, puls: ultima.puls || ultima.puls_mediu || datePacient.puls, temperatura: ultima.temperatura || ultima.temperatura_medie || datePacient.temperatura }
            setDatePuls(masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.puls || m.puls_mediu })))
            setDateTemperatura(masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.temperatura || m.temperatura_medie })))
          }
          setPacient(datePacient)
          const responseRecomandari = await api.get(`/recomandari/${datePacient._id}`)
          setRecomandari(responseRecomandari.data || [])

          const responseAlarme = await api.get(`/alarme/${datePacient._id}`)
          setAlarme(responseAlarme.data || [])
        }
      } catch (err) {
        if (err.response && err.response.status !== 404) console.error('Eroare la incarcare date:', err)
      }
      setLoading(false)
    }
    incarcaDate()
    const interval = setInterval(incarcaDate, 5000)
    return () => clearInterval(interval)
  }, [uid])

  const prenumeScurt = nume.split(' ')[0]
  const tabs = [{ id: 'acasa', label: 'Acasă' }, { id: 'valori', label: 'Valorile mele' }, { id: 'recomandari', label: 'Recomandări' }, { id: 'alarme', label: 'Alarme' }]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(15,10,30,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 14px' }}>
          <p style={{ color: 'rgba(196,181,253,0.7)', fontSize: 17, margin: '0 0 4px' }}>{label}</p>
          <p style={{ color: '#fff', fontSize: 19, fontWeight: 600, margin: 0 }}>{payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.2) saturate(0.7)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(76,29,149,0.88) 0%, rgba(15,10,30,0.94) 60%, rgba(15,10,30,0.98) 100%)' }} />
      <div style={{ position: 'fixed', top: -150, right: -150, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 65%)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ ...gs, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.5)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff' }}>Sănătatea Noastră</div>
              <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>Portal Pacient</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)' }}>
                {prenumeScurt[0]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>{nume}</div>
                <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>Pacient</div>
              </div>
            </div>
            <button onClick={() => { sessionStorage.clear(); navigate('/') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 17, color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Ieșire
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...gs, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', display: 'flex', gap: 2, background: 'rgba(0,0,0,0.2)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setPaginaActiva(tab.id)}
              style={{ padding: '12px 18px', fontSize: 18, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderBottom: paginaActiva === tab.id ? '2px solid #8b5cf6' : '2px solid transparent', color: paginaActiva === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)', marginBottom: -1, transition: 'color 0.15s' }}
            >{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 32 }}>

          {/* ACASA */}
          {paginaActiva === 'acasa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Banner */}
              <div style={{ ...gs, borderRadius: 18, padding: '32px 36px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(109,40,217,0.4) 0%, rgba(15,10,30,0.6) 100%)', animation: 'fadeInUp 0.4s ease' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.15 }}>
                  <svg viewBox="0 0 600 55" preserveAspectRatio="none" width="100%" height="55">
                    <polyline points="0,28 80,28 100,28 112,5 124,52 136,10 148,28 230,28 310,28 330,28 342,5 354,52 366,10 378,28 460,28 540,28 560,28 572,5 584,52 596,10 600,28" fill="none" stroke="#a78bfa" strokeWidth="2.5"/>
                  </svg>
                </div>
                <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Bună ziua, {prenumeScurt}! 👋</p>
                <p style={{ fontSize: 19, color: 'rgba(196,181,253,0.6)', marginBottom: pacient ? 24 : 0 }}>
                  {loading ? 'Se încarcă datele...' : pacient ? 'Iată valorile tale de astăzi.' : 'Nu ai fost înregistrat de un medic încă.'}
                </p>
                {pacient && (
                  <div style={{ display: 'flex', gap: 14 }}>
                    {[{ val: `${pacient.puls}`, unit: 'bpm', label: 'Puls' }, { val: `${pacient.temperatura}°`, unit: 'temp', label: 'Temperatură' }, { val: pacient.ecg, unit: '', label: 'ECG' }].map(item => (
                      <div key={item.label} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 22px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{item.val}</div>
                        <div style={{ fontSize: 17, color: 'rgba(196,181,253,0.6)', marginTop: 3 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pacient ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                  {[
                    { label: 'Puls', value: `${pacient.puls}`, unit: 'bpm', delay: '0.06s', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                    { label: 'Temperatură', value: `${pacient.temperatura}`, unit: '°C', delay: '0.12s', color: '#fdba74', bg: 'rgba(251,146,60,0.15)',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> },
                    { label: 'ECG', value: pacient.ecg, unit: '', delay: '0.18s', color: '#c4b5fd', bg: 'rgba(139,92,246,0.15)',
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                  ].map(card => (
                    <div key={card.label} style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: `fadeInUp 0.4s ease ${card.delay} both`, transition: 'transform 0.2s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
                        <div style={{ width: 34, height: 34, background: card.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>{card.icon}</div>
                      </div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {card.value} <span style={{ fontSize: 19, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{card.unit}</span>
                      </div>
                      <div style={{ fontSize: 17, color: card.color, marginTop: 8 }}>✓ Normal</div>
                    </div>
                  ))}
                </div>
              ) : !loading && (
                <div style={{ ...gs, borderRadius: 14, padding: '24px', textAlign: 'center', background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.25)' }}>
                  <p style={{ color: '#fcd34d', fontWeight: 500, marginBottom: 4 }}>Nu ai fost înregistrat de un medic încă.</p>
                  <p style={{ color: 'rgba(253,211,77,0.6)', fontSize: 18 }}>Contactează medicul tău pentru a fi adăugat în sistem.</p>
                </div>
              )}
            </div>
          )}

          {/* VALORI */}
          {paginaActiva === 'valori' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {datePuls.length > 0 ? (
                <>
                  {[
                    { title: 'Evoluție Puls (astăzi)', data: datePuls, color: '#a78bfa', domain: [60, 110], name: 'Puls (bpm)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                    { title: 'Evoluție Temperatură (astăzi)', data: dateTemperatura, color: '#fb923c', domain: [35, 39], name: 'Temperatură (°C)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> },
                  ].map(chart => (
                    <div key={chart.title} style={{ ...gs, borderRadius: 16, padding: '22px 26px', animation: 'fadeInUp 0.4s ease both' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{chart.icon}</div>
                        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>{chart.title}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="ora" tick={{ fontSize: 17, fill: 'rgba(196,181,253,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 17, fill: 'rgba(196,181,253,0.5)' }} axisLine={false} tickLine={false} domain={chart.domain} />
                          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                            <div style={{ background: 'rgba(15,10,30,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                              <p style={{ color: 'rgba(196,181,253,0.6)', fontSize: 17, margin: '0 0 4px' }}>{label}</p>
                              <p style={{ color: '#fff', fontSize: 19, fontWeight: 600, margin: 0 }}>{payload[0].value}</p>
                            </div>
                          ) : null} />
                          <Line type="monotone" dataKey="valoare" stroke={chart.color} strokeWidth={2.5} dot={{ r: 4, fill: chart.color, strokeWidth: 0 }} activeDot={{ r: 6, fill: chart.color }} name={chart.name} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ ...gs, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 19 }}>Nu există măsurători disponibile încă.</p>
                </div>
              )}
            </div>
          )}

          {/* RECOMANDARI */}
          {paginaActiva === 'recomandari' && (
            <div style={{ ...gs, borderRadius: 16, padding: '22px 26px', animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff', marginBottom: 20 }}>Recomandările medicului</div>
              {pacient && recomandari.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recomandari.map((rec, i) => (
                    <div key={rec._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, animation: `fadeInUp 0.35s ease ${0.05 * i}s both` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, background: 'rgba(139,92,246,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(139,92,246,0.3)' }}>🏥</div>
                        <div>
                          <p style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{rec.tip} — {rec.durata}</p>
                          <p style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>{rec.indicatii}</p>
                        </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: 19, padding: '20px 0' }}>Nu există recomandări disponibile.</p>
              )}
            </div>
          )}

          {/* ALARME */}
          {paginaActiva === 'alarme' && (
            <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ ...gs, borderRadius: 16, padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.6)" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>Istoric Alarme & Avertizări</span>
                </div>
                {alarme.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alarme.map((a, i) => {
                      const isAlarm = a.tip === 'alarm'
                      const color = isAlarm ? '#fca5a5' : '#fcd34d'
                      const bg = isAlarm ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)'
                      const border = isAlarm ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'
                      const data = new Date(a.timestamp).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={a._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{isAlarm ? '🚨 Alarmă critică' : '⚠️ Avertizare'}</p>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{a.mesaj}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{data}</p>
                            {a.rezolvata && <span style={{ fontSize: 11, color: '#6ee7b7' }}>✓ Rezolvată</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: 15, padding: '20px 0' }}>Nu există alarme înregistrate.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}

export default DashboardPacient