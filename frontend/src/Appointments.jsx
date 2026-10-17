import { useEffect, useState } from 'react'
import { api } from './api.js'

const statusLabels = {
  pending_payment: 'بانتظار الدفع', confirmed: 'مؤكد', cancelled: 'ملغي', expired: 'انتهت المهلة',
  unpaid: 'لم يُدفع', paid: 'مدفوع', refunded: 'مسترد', forfeited: 'غير مسترد',
}

function Appointments({ token, onGoAccount, onShowCancelledSlot }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(Boolean(token))
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cancelledSlot, setCancelledSlot] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!token) return
    let active = true
    api('/api/appointments/my', { token })
      .then((result) => { if (active) { setAppointments(result.appointments); setError('') } })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, version])

  async function act(item, action) {
    setBusyId(item._id)
    setError('')
    setMessage('')
    setCancelledSlot(null)
    try {
      const result = await api(`/api/appointments/${item._id}/${action}`, { method: 'POST', token })
      setMessage(action === 'pay'
        ? result.emailSent ? 'تم تأكيد الحجز وإرسال البريد.' : 'تم تأكيد الحجز، لكن البريد لم يُرسل.'
        : 'تم إلغاء الحجز وإتاحة الميعاد مرة أخرى.')
      if (action === 'cancel' && item.doctor?._id && item.slot?.date) {
        setCancelledSlot({ doctorId: item.doctor._id, date: item.slot.date, time: item.slot.time })
      }
      setLoading(true)
      setVersion((current) => current + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return <section className="container page-section">
    <span className="eyebrow">حجوزاتك</span><h1>مواعيدي</h1>
    {!token && <div className="panel"><p>سجل الدخول علشان تشوف حجوزاتك.</p><button onClick={onGoAccount}>تسجيل الدخول</button></div>}
    {token && <>
      <button className="secondary-button" onClick={() => { setLoading(true); setVersion((current) => current + 1) }}>تحديث القائمة</button>
      {loading && <p className="notice">جاري تحميل الحجوزات...</p>}
      {error && <p className="inline-message error" role="alert">{error}</p>}
      {message && <p className="inline-message">{message}</p>}
      {cancelledSlot && <button className="secondary-button" onClick={() => onShowCancelledSlot(cancelledSlot.doctorId, cancelledSlot.date)}>افتح مواعيد {cancelledSlot.time}</button>}
      {!loading && !error && appointments.length === 0 && <p className="notice">لسه معندكش حجوزات.</p>}
      <div className="appointment-list">{appointments.map((item) => <article className="panel" key={item._id}>
        <h2>{item.doctor?.name || 'الطبيب'}</h2>
        <p>{item.clinic?.name} · {item.slot?.date} الساعة {item.slot?.time}</p>
        <p>رقم الحجز: {item.code} · المريض: {item.patientName}</p>
        <p>الحالة: {statusLabels[item.status] || item.status} · العربون: {item.depositAmount} جنيه · الدفع: {statusLabels[item.paymentStatus] || item.paymentStatus}</p>
        {item.status === 'pending_payment' && <><p>تأكيد الدفع هنا للتجربة فقط.</p><button disabled={busyId === item._id} onClick={() => act(item, 'pay')}>تأكيد الدفع التجريبي</button></>}
        {item.status === 'confirmed' && <button className="secondary-button" disabled={busyId === item._id} onClick={() => act(item, 'cancel')}>إلغاء الحجز</button>}
      </article>)}</div>
    </>}
  </section>
}

export default Appointments
