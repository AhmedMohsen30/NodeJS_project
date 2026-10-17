import { useState } from 'react'
import { api } from './api.js'

function Account({ user, onLogin, onLogout }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    try {
      if (mode === 'register') {
        const result = await api('/api/auth/register', { method: 'POST', body: { name, email, password, phone } })
        setMessage(result.message)
        setMode('verify')
      } else if (mode === 'verify') {
        const result = await api('/api/auth/verify-email', { method: 'POST', body: { email, otp } })
        setMessage(result.message + ' — سجل الدخول الآن.')
        setMode('login')
      } else {
        const result = await api('/api/auth/login', { method: 'POST', body: { email, password } })
        onLogin(result.token, result.patient)
        setPassword('')
        setMessage('تم تسجيل الدخول بنجاح.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api('/api/auth/resend-otp', { method: 'POST', body: { email } })
      setMessage(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="container page-section narrow">
    <span className="eyebrow">حسابك</span><h1>{user ? `أهلًا، ${user.name}` : mode === 'register' ? 'حساب جديد' : mode === 'verify' ? 'تفعيل البريد' : 'تسجيل الدخول'}</h1>
    {user ? <div className="panel"><p>مسجل بالبريد: {user.email}</p><button className="secondary-button" onClick={onLogout}>تسجيل الخروج</button></div> : <div className="panel">
      <div className="tab-row">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage('') }}>دخول</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setMessage('') }}>حساب جديد</button>
        <button className={mode === 'verify' ? 'active' : ''} onClick={() => { setMode('verify'); setError(''); setMessage('') }}>تفعيل البريد</button>
      </div>
      <form className="stack-form" onSubmit={submit}>
        {mode === 'register' && <label>الاسم<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}
        <label>البريد الإلكتروني<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        {mode === 'register' && <label>رقم الموبايل<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" /></label>}
        {mode === 'verify'
          ? <label>كود التفعيل من البريد<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
          : <label>كلمة المرور<input type="password" minLength={mode === 'register' ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
        <button disabled={busy}>{busy ? 'لحظة...' : mode === 'register' ? 'إنشاء الحساب' : mode === 'verify' ? 'تفعيل الحساب' : 'دخول'}</button>
      </form>
      {mode === 'verify' && <button className="text-button" disabled={busy || !email} onClick={resend}>إعادة إرسال الكود</button>}
      {message && <p className="inline-message">{message}</p>}
      {error && <p className="inline-message error" role="alert">{error}</p>}
    </div>}
  </section>
}

export default Account
