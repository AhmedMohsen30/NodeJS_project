import { useEffect, useRef, useState } from 'react'
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

function addDays(date, days) {
  const next = new Date(date + 'T00:00:00Z')
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
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
  const [formErrors, setFormErrors] = useState({})
  const [booking, setBooking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsVersion, setSlotsVersion] = useState(0)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const findNextDate = useRef(false)
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
    const lookForNextDate = findNextDate.current
    findNextDate.current = false

    async function loadSlots() {
      try {
        for (let day = 0; day < (lookForNextDate ? 14 : 1); day++) {
          const requestedDate = addDays(date, day)
          const result = await api(`/api/doctors/${selectedDoctor._id}/slots?date=${requestedDate}`)
          if (!active) return
          const available = requestedDate === cairoToday()
            ? result.data.filter((item) => item.time > cairoTime())
            : result.data
          if (available.length || !lookForNextDate) {
            setSlots(available)
            setError('')
            if (day > 0) {
              setDate(requestedDate)
              setAvailabilityMessage('مفيش مواعيد متبقية النهارده؛ عرضنا أقرب يوم متاح.')
            }
            return
          }
        }
        setSlots([])
        setError('')
        setAvailabilityMessage('مفيش مواعيد متاحة خلال الـ١٤ يوم الجايين.')
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setSlotsLoading(false)
      }
    }
    loadSlots()
    return () => { active = false }
  }, [selectedDoctor, date, slotsVersion])

  function chooseDoctor(doctor) {
    findNextDate.current = true
    setSelectedDoctor(doctor)
    setDate(cairoToday())
    setSlot(null)
    setSlots([])
    setSlotsLoading(true)
    setSlotsVersion((current) => current + 1)
    setBooking(null)
    setMessage('')
    setAvailabilityMessage('')
    setError('')
    setFormErrors({})
  }

  function closeDoctor() {
    findNextDate.current = false
    setSelectedDoctor(null)
    setSlot(null)
    setBooking(null)
    setError('')
    setFormErrors({})
  }

  async function createBooking(event) {
    event.preventDefault()
    const errors = {}
    if (!patientName.trim()) errors.patientName = 'اكتب اسم المريض.'
    if (!phone.trim()) {
      errors.phone = 'اكتب رقم الموبايل.'
    } else if (!/^01[0125][0-9]{8}$/.test(phone.trim())) {
      errors.phone = 'رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.'
    }
    const dobDate = new Date(dob + 'T00:00:00Z')
    if (!dob) {
      errors.dob = 'اختار تاريخ الميلاد.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob) {
      errors.dob = 'تاريخ الميلاد غير صحيح.'
    } else if (dob > cairoToday()) {
      errors.dob = 'تاريخ الميلاد لا يمكن يكون في المستقبل.'
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (!token) return onGoAccount()
    setBusy(true)
    setError('')
    try {
      const result = await api('/api/appointments', {
        method: 'POST', token,
        body: { slotId: slot._id, patientName: patientName.trim(), phone: phone.trim(), dob },
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
    {selectedDoctor && <div className="dialog-backdrop" onClick={closeDoctor}>
    <div className="panel booking-panel booking-dialog" role="dialog" aria-modal="true" aria-label={`مواعيد ${selectedDoctor.name}`} onClick={(event) => event.stopPropagation()}>
      <button className="close-button" type="button" aria-label="إغلاق المواعيد" onClick={closeDoctor}>×</button>
      <h2>مواعيد {selectedDoctor.name}</h2>
      <p>المواعيد من ٩ صباحًا إلى ٥ مساءً، وآخر حجز يبدأ ٤ مساءً.</p>
      <label className="date-label">اليوم<input type="date" min={cairoToday()} max={addDays(cairoToday(), 13)} value={date} onChange={(event) => { findNextDate.current = false; setDate(event.target.value); setSlot(null); setSlots([]); setSlotsLoading(true); setBooking(null); setAvailabilityMessage('') }} /></label>
      {availabilityMessage && <p className="inline-message">{availabilityMessage}</p>}
      {slotsLoading && <p>جاري تحميل المواعيد...</p>}
      {!slotsLoading && !error && slots.length === 0 && <p>مفيش مواعيد متاحة لليوم ده. جرّب يوم تاني.</p>}
      <div className="slot-list">{slots.map((item) => <button key={item._id} className={slot?._id === item._id ? 'selected' : ''} onClick={() => { setSlot(item); setBooking(null); setMessage('') }}>{item.time}</button>)}</div>
      {slot && <form className="stack-form" onSubmit={createBooking} noValidate>
        <h3>حجز {date} الساعة {slot.time}</h3>
        {!token && <p>سجّل الدخول أولًا علشان تكمل الحجز.</p>}
        <label>اسم المريض<input value={patientName} aria-invalid={Boolean(formErrors.patientName)} aria-describedby={formErrors.patientName ? 'patient-name-error' : undefined} onChange={(event) => { setPatientName(event.target.value); setFormErrors((current) => ({ ...current, patientName: '' })) }} />
          {formErrors.patientName && <small className="field-error" id="patient-name-error">{formErrors.patientName}</small>}</label>
        <label>رقم الموبايل<input type="tel" inputMode="numeric" placeholder="01xxxxxxxxx" value={phone} aria-invalid={Boolean(formErrors.phone)} aria-describedby={formErrors.phone ? 'patient-phone-error' : undefined} onChange={(event) => { setPhone(event.target.value); setFormErrors((current) => ({ ...current, phone: '' })) }} />
          {formErrors.phone && <small className="field-error" id="patient-phone-error">{formErrors.phone}</small>}</label>
        <label>تاريخ الميلاد<input type="date" max={cairoToday()} value={dob} aria-invalid={Boolean(formErrors.dob)} aria-describedby={formErrors.dob ? 'patient-dob-error' : undefined} onChange={(event) => { setDob(event.target.value); setFormErrors((current) => ({ ...current, dob: '' })) }} />
          {formErrors.dob && <small className="field-error" id="patient-dob-error">{formErrors.dob}</small>}</label>
        <button disabled={busy}>{busy ? 'جاري الحجز...' : 'احجز الميعاد'}</button>
      </form>}
      {message && <p className="inline-message">{message}</p>}
      {booking && <div className="booking-result">
        <p>رقم الحجز: <strong>{booking.code}</strong></p>
        <p>العربون: {booking.depositAmount} جنيه</p>
        {booking.status === 'pending_payment' && <><p>زر الدفع هنا للتجربة فقط، ولا يخصم فلوس حقيقية.</p><button disabled={busy} onClick={pay}>تأكيد الدفع التجريبي</button></>}
        {booking.status === 'confirmed' && <button className="secondary-button" onClick={onGoAppointments}>اعرض حجوزاتي</button>}
      </div>}
    </div>
    </div>}
  </section>
}

export default Doctors
