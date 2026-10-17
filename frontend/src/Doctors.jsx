import { useEffect, useState } from 'react'
import { api } from './api.js'

function cairoToday() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const value = (name) => parts.find((part) => part.type === name).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function cairoTime() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (name) => parts.find((part) => part.type === name).value
  return `${value('hour')}:${value('minute')}`
}

function Doctors({ token, onGoAccount, onGoAppointments }) {
  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [specialty, setSpecialty] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [date, setDate] = useState(cairoToday)
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [booking, setBooking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsVersion, setSlotsVersion] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api('/api/specialties').then((result) => setSpecialties(result.data)).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    const query = specialty ? '?limit=50&specialty=' + specialty : '?limit=50'
    api('/api/doctors' + query)
      .then((result) => { if (active) { setDoctors(result.data); setError('') } })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [specialty])

  useEffect(() => {
    if (!selectedDoctor) return
    let active = true
    api(`/api/doctors/${selectedDoctor._id}/slots?date=${date}`)
      .then((result) => {
        if (!active) return
        const available = date === cairoToday()
          ? result.data.filter((item) => item.time > cairoTime())
          : result.data
        setSlots(available)
        setError('')
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setSlotsLoading(false) })
    return () => { active = false }
  }, [selectedDoctor, date, slotsVersion])

  function chooseDoctor(doctor) {
    setSelectedDoctor(doctor)
    setDate(cairoToday())
    setSlot(null)
    setSlots([])
    setSlotsLoading(true)
    setSlotsVersion((current) => current + 1)
    setBooking(null)
    setMessage('')
    setError('')
  }

  async function createBooking(event) {
    event.preventDefault()
    if (!token) return onGoAccount()
    setBusy(true)
    setError('')
    try {
      const result = await api('/api/appointments', {
        method: 'POST', token,
        body: { slotId: slot._id, patientName, phone, dob },
      })
      setBooking(result.appointment)
      setMessage('تم حجز الميعاد مؤقتًا. أكمل تأكيد الدفع خلال ١٥ دقيقة.')
      setSlots((current) => current.filter((item) => item._id !== slot._id))
      setSlot(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function pay() {
    setBusy(true)
    setError('')
    try {
      const result = await api(`/api/appointments/${booking._id}/pay`, { method: 'POST', token })
      setBooking(result.appointment)
      setMessage(result.emailSent ? 'الحجز اتأكد واترسلت رسالة للبريد.' : 'الحجز اتأكد، لكن رسالة البريد لم تُرسل.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="container page-section">
    <span className="eyebrow">احجز ميعادك</span><h1>الأطباء والمواعيد</h1>
    <div className="filters one-filter"><label>التخصص<select value={specialty} onChange={(event) => { setLoading(true); setSelectedDoctor(null); setSpecialty(event.target.value) }}>
      <option value="">كل التخصصات</option>{specialties.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
    </select></label></div>
    {loading && <p className="notice">جاري تحميل الأطباء...</p>}
    {error && <p className="inline-message error" role="alert">{error}</p>}
    {!loading && !error && doctors.length === 0 && <p className="notice">مفيش أطباء في التخصص ده.</p>}
    {!loading && <div className="doctor-grid">{doctors.map((doctor) => <article className="panel doctor-card" key={doctor._id}>
      <h2>{doctor.name}</h2>
      <p>{doctor.specialty?.name} · {doctor.clinic?.name}</p>
      <p>سعر الكشف: {doctor.fee} جنيه</p>
      <button onClick={() => chooseDoctor(doctor)}>المواعيد المتاحة</button>
    </article>)}</div>}
    {selectedDoctor && <div className="panel booking-panel">
      <h2>مواعيد {selectedDoctor.name}</h2>
      <label className="date-label">اليوم<input type="date" min={cairoToday()} value={date} onChange={(event) => { setDate(event.target.value); setSlot(null); setSlots([]); setSlotsLoading(true); setBooking(null) }} /></label>
      {slotsLoading && <p>جاري تحميل المواعيد...</p>}
      {!slotsLoading && !error && slots.length === 0 && <p>مفيش مواعيد متاحة لليوم ده. جرّب يوم تاني.</p>}
      <div className="slot-list">{slots.map((item) => <button key={item._id} className={slot?._id === item._id ? 'selected' : ''} onClick={() => { setSlot(item); setBooking(null); setMessage('') }}>{item.time}</button>)}</div>
      {slot && <form className="stack-form" onSubmit={createBooking}>
        <h3>حجز {date} الساعة {slot.time}</h3>
        {!token && <p>سجّل الدخول أولًا علشان تكمل الحجز.</p>}
        <label>اسم المريض<input required value={patientName} onChange={(event) => setPatientName(event.target.value)} /></label>
        <label>رقم الموبايل<input type="tel" required pattern="01[0125][0-9]{8}" placeholder="01xxxxxxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label>تاريخ الميلاد<input type="date" max={cairoToday()} required value={dob} onChange={(event) => setDob(event.target.value)} /></label>
        <button disabled={busy}>{busy ? 'جاري الحجز...' : 'احجز الميعاد'}</button>
      </form>}
      {message && <p className="inline-message">{message}</p>}
      {booking && <div className="booking-result">
        <p>رقم الحجز: <strong>{booking.code}</strong></p>
        <p>العربون: {booking.depositAmount} جنيه</p>
        {booking.status === 'pending_payment' && <><p>زر الدفع هنا للتجربة فقط، ولا يخصم فلوس حقيقية.</p><button disabled={busy} onClick={pay}>تأكيد الدفع التجريبي</button></>}
        {booking.status === 'confirmed' && <button className="secondary-button" onClick={onGoAppointments}>اعرض حجوزاتي</button>}
      </div>}
    </div>}
  </section>
}

export default Doctors
