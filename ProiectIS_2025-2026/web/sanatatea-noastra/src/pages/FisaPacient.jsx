import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const BG_IMAGE = 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1400&q=70'
const gs = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }

function FisaPacient() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pacient, setPacient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [recomandari, setRecomandari] = useState([])
  const [showFormRec, setShowFormRec] = useState(false)
  const [newRec, setNewRec] = useState({ tip: '', durata: '', indicatii: '' })
  const [datePuls, setDatePuls] = useState([])
  const [dateTemperatura, setDateTemperatura] = useState([])
  const [dateECG, setDateECG] = useState([])

  useEffect(() => {
    const incarcaDate = async () => {
      try {
        let datePacient = null
        const docSnap = await api.get(`/pacient-detalii/${id}`)
        if (docSnap.data) datePacient = docSnap.data
        const snapM = await api.get(`/masuratori/${id}`)
        if (snapM.data && snapM.data.length > 0) {
          const masuratori = snapM.data
          if (datePacient) {
            const ultima = masuratori[masuratori.length - 1]
            datePacient = { ...datePacient, puls: ultima.puls || ultima.puls_mediu || datePacient.puls, temperatura: ultima.temperatura || ultima.temperatura_medie || datePacient.temperatura }
          }
          setDatePuls(masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.puls || m.puls_mediu })))
          setDateTemperatura(masuratori.map(m => ({ ora: m.ora || new Date(m.timestamp).getHours() + ':00', valoare: m.temperatura || m.temperatura_medie })))
          // ECG din ultima masuratore
          const ultimaMasuratoare = masuratori[masuratori.length - 1]
          if (ultimaMasuratoare?.ecg && typeof ultimaMasuratoare.ecg === 'string' && ultimaMasuratoare.ecg.startsWith('[')) {
            try {
              const ecgArray = JSON.parse(ultimaMasuratoare.ecg)
              if (ecgArray.length > 0) setDateECG(ecgArray.map((valoare, index) => ({ index, valoare })))
            } catch (e) {}
          }
        }
        if (datePacient) setPacient(datePacient)
        const snapR = await api.get(`/recomandari/${id}`)
        if (snapR.data) setRecomandari(snapR.data)
      } catch (err) { console.error('Eroare la incarcarea fisei:', err) }
      setLoading(false)
    }
    incarcaDate()
    const interval = setInterval(incarcaDate, 5000)
    return () => clearInterval(interval)
  }, [id])

  const handleEdit = () => {
    setFormData({ nume: pacient.nume||'', prenume: pacient.prenume||'', varsta: pacient.varsta||'', cnp: pacient.cnp||'', telefon: pacient.telefon||'', email: pacient.email||'', strada: pacient.strada||'', oras: pacient.oras||'', judet: pacient.judet||'', profesie: pacient.profesie||'', istoricMedical: pacient.istoricMedical||'', alergii: pacient.alergii||'', consultatiiCardiologice: pacient.consultatiiCardiologice||'', pulsMin: pacient.pulsMin||60, pulsMax: pacient.pulsMax||100, tempMin: pacient.tempMin||36, tempMax: pacient.tempMax||37.5 })
    setEditMode(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.put(`/pacienti/${id}`, formData); setPacient({ ...pacient, ...formData }); setEditMode(false) }
    catch (err) { console.error('Eroare la salvare:', err); alert('Nu s-a putut salva.') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Ești sigur că vrei să ștergi pacientul ${pacient.prenume} ${pacient.nume}?`)) return
    try { await api.delete(`/pacienti/${id}`); navigate('/medic') }
    catch (err) { console.error('Eroare la stergere:', err) }
  }

  const handleAddRecomandare = async () => {
    if (!newRec.tip || !newRec.durata) return
    try {
      const response = await api.post('/recomandari', { ...newRec, pacientId: id, medicUid: sessionStorage.getItem('uid') })
      setRecomandari([...recomandari, response.data.recomandare])
      setNewRec({ tip: '', durata: '', indicatii: '' }); setShowFormRec(false)
    } catch (err) { console.error('Eroare la adaugarea recomandarii:', err) }
  }

  const getStatusTemperatura = (temp) => {
    if (temp >= 38.5) return { label: 'Avertizare', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' }
    if (temp >= 37.5) return { label: 'Monitorizare', color: '#fcd34d', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' }
    return null
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '9px 12px', fontSize: 18, color: '#fff', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }
  const labelStyle = { display: 'block', fontSize: 17, fontWeight: 600, color: 'rgba(196,181,253,0.6)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(196,181,253,0.6)', fontFamily: "'DM Sans', sans-serif" }}>Se încarcă...</p>
    </div>
  )

  if (!pacient) return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(196,181,253,0.6)', fontFamily: "'DM Sans', sans-serif" }}>Pacientul nu a fost găsit.</p>
    </div>
  )

  const statusTemp = getStatusTemperatura(pacient.temperatura)

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.18) saturate(0.6)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(160deg, rgba(76,29,149,0.9) 0%, rgba(15,10,30,0.95) 55%, rgba(15,10,30,0.98) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Topbar */}
        <div style={{ ...gs, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/medic')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 18, color: 'rgba(196,181,253,0.8)', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Înapoi
            </button>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(109,40,217,0.4))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' }}>
                {`${(pacient.prenume||'?')[0]}${(pacient.nume||'?')[0]}`.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff', margin: 0 }}>{pacient.prenume} {pacient.nume}</h1>
                <p style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)', margin: 0 }}>{pacient.varsta} ani · CNP: {pacient.cnp}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} style={{ padding: '8px 14px', fontSize: 18, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Anulează</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', fontSize: 18, color: '#fff', background: '#16a34a', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{saving ? 'Se salvează...' : 'Salvează'}</button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} style={{ padding: '8px 18px', fontSize: 18, color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>Editează</button>
                <button onClick={handleDelete} style={{ padding: '8px 18px', fontSize: 18, color: '#fff', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Șterge</button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

          {/* Stanga */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Contact */}
            <div style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: 'fadeInUp 0.4s ease both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 16 }}>Date de Contact</div>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{l:'Prenume',k:'prenume'},{l:'Nume',k:'nume'},{l:'Vârstă',k:'varsta',t:'number'},{l:'Telefon',k:'telefon'},{l:'Email',k:'email'},{l:'Stradă',k:'strada'},{l:'Oraș',k:'oras'},{l:'Județ',k:'judet'},{l:'Profesie',k:'profesie'}].map(({l,k,t='text'}) => (
                    <div key={k}><label style={labelStyle}>{l}</label><input type={t} value={formData[k]||''} onChange={e => setFormData({...formData,[k]:e.target.value})} style={inputStyle}/></div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/></svg>, value: pacient.telefon },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.5)" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>, value: pacient.email },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, value: `${pacient.strada}, ${pacient.oras}, ${pacient.judet}` },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ marginTop: 1, flexShrink: 0 }}>{row.icon}</div>
                      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medicale */}
            <div style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: 'fadeInUp 0.4s ease 0.06s both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 16 }}>Date Medicale</div>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{l:'Istoric Medical',k:'istoricMedical'},{l:'Alergii',k:'alergii'},{l:'Consultații Cardiologice',k:'consultatiiCardiologice'}].map(({l,k}) => (
                    <div key={k}><label style={labelStyle}>{l}</label><textarea value={formData[k]||''} onChange={e => setFormData({...formData,[k]:e.target.value})} rows={3} style={{...inputStyle, resize:'none'}}/></div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[{l:'Istoric Medical',v:pacient.istoricMedical},{l:'Consultații',v:pacient.consultatiiCardiologice}].map(item => (
                    <div key={item.l}><p style={labelStyle}>{item.l}</p><p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{item.v||'—'}</p></div>
                  ))}
                  <div>
                    <p style={labelStyle}>Alergii</p>
                    {pacient.alergii
                      ? <span style={{ display: 'inline-block', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', fontSize: 17, padding: '3px 10px', borderRadius: 20 }}>{pacient.alergii}</span>
                      : <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>Nicio alergie înregistrată</span>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Valori normale - editabil */}
            {editMode && (
              <div style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: 'fadeInUp 0.4s ease 0.1s both', border: '1px solid rgba(139,92,246,0.3)' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 6 }}>Valori Normale</div>
                <p style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)', marginBottom: 14 }}>Limitele personalizate pentru alarme automate.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    {l:'Puls minim (bpm)', k:'pulsMin', t:'number'},
                    {l:'Puls maxim (bpm)', k:'pulsMax', t:'number'},
                    {l:'Temp minimă (°C)', k:'tempMin', t:'number'},
                    {l:'Temp maximă (°C)', k:'tempMax', t:'number'},
                  ].map(({l,k,t}) => (
                    <div key={k}>
                      <label style={labelStyle}>{l}</label>
                      <input type={t} value={formData[k]||''} onChange={e => setFormData({...formData,[k]:e.target.value})} style={inputStyle}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valori curente */}
            <div style={{ ...gs, borderRadius: 16, padding: '20px 22px', animation: 'fadeInUp 0.4s ease 0.12s both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 16 }}>Valori Curente</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Puls', value: `${pacient.puls} bpm`, color: '#fca5a5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                  { label: 'ECG', value: pacient.ecg, color: '#c4b5fd', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: item.bg, borderRadius: 10, border: `1px solid ${item.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>{item.icon}{item.label}</div>
                    <span style={{ fontWeight: 600, color: item.color, fontSize: 18 }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: statusTemp ? statusTemp.bg : 'rgba(251,146,60,0.12)', borderRadius: 10, border: `1px solid ${statusTemp ? statusTemp.border : 'rgba(251,146,60,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                    Temperatură
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#fdba74', fontSize: 18 }}>{pacient.temperatura}°C</span>
                    {statusTemp && <span style={{ fontSize: 17, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: statusTemp.bg, color: statusTemp.color, border: `1px solid ${statusTemp.border}` }}>{statusTemp.label}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dreapta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Grafice Puls si Temperatura - IDENTIC CU ORIGINALUL */}
            {[
              { title: 'Evoluție Puls', data: datePuls, color: '#a78bfa', domain: [60,110], name: 'Puls (bpm)', delay: '0s' },
              { title: 'Evoluție Temperatură', data: dateTemperatura, color: '#fb923c', domain: [35,39], name: 'Temperatură (°C)', delay: '0.08s' },
            ].map(chart => (
              <div key={chart.title} style={{ ...gs, borderRadius: 16, padding: '20px 24px', animation: `fadeInUp 0.4s ease ${chart.delay} both` }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 18 }}>{chart.title} (astăzi)</div>
                <ResponsiveContainer width="100%" height={190}>
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

            {/* GRAFIC ECG NOU */}
            <div style={{ ...gs, borderRadius: 16, padding: '20px 24px', animation: 'fadeInUp 0.4s ease 0.12s both' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff', marginBottom: 18 }}>Fragment ECG (ultima înregistrare)</div>
              {dateECG.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={dateECG}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="index" tick={false} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 17, fill: 'rgba(196,181,253,0.45)' }} axisLine={false} tickLine={false} domain={[0, 4095]} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div style={{ background: 'rgba(15,10,30,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                        <p style={{ color: 'rgba(196,181,253,0.6)', fontSize: 17, margin: '0 0 4px' }}>ECG</p>
                        <p style={{ color: '#fff', fontSize: 19, fontWeight: 600, margin: 0 }}>{payload[0].value}</p>
                      </div>
                    ) : null} />
                    <Line type="monotone" dataKey="valoare" stroke="#6ee7b7" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} name="ECG" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Nu există date ECG.<br/><span style={{ fontSize: 15 }}>Vor apărea după prima transmisie ESP32.</span></p>
                </div>
              )}
            </div>

            {/* Recomandări - IDENTIC CU ORIGINALUL */}
            <div style={{ ...gs, borderRadius: 16, padding: '20px 24px', animation: 'fadeInUp 0.4s ease 0.16s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#fff' }}>Recomandări Medic</span>
                <button onClick={() => setShowFormRec(!showFormRec)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 17, color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 3px 10px rgba(139,92,246,0.35)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Adaugă
                </button>
              </div>
              {showFormRec && (
                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{l:'Tip activitate',k:'tip',p:'ex: Bicicletă, Alergat'},{l:'Durată zilnică',k:'durata',p:'ex: 30 min/zi'},{l:'Indicații',k:'indicatii',p:'ex: Ritm moderat'}].map(f => (
                    <div key={f.k}>
                      <label style={{...labelStyle, color: 'rgba(196,181,253,0.7)'}}>{f.l}</label>
                      <input type="text" placeholder={f.p} value={newRec[f.k]} onChange={e => setNewRec({...newRec,[f.k]:e.target.value})} style={inputStyle} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={handleAddRecomandare} style={{ flex: 1, padding: '9px', fontSize: 18, color: '#fff', background: '#16a34a', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Salvează</button>
                    <button onClick={() => setShowFormRec(false)} style={{ flex: 1, padding: '9px', fontSize: 18, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Anulează</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recomandari.length > 0 ? recomandari.map(rec => (
                  <div key={rec._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 11 }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 2 }}>{rec.tip}</p>
                      <p style={{ fontSize: 17, color: 'rgba(196,181,253,0.5)' }}>{rec.indicatii}</p>
                    </div>
                    <span style={{ fontSize: 17, color: '#c4b5fd', fontWeight: 500, marginLeft: 12, whiteSpace: 'nowrap' }}>{rec.durata}</span>
                  </div>
                )) : (
                  <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '10px 0' }}>Nicio recomandare adăugată încă.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </div>
  )
}

export default FisaPacient
