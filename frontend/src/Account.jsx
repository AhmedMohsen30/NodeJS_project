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
  const [formErrors, setFormErrors] = useState({})

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
    setFormErrors({})
  }

  function validate(checkMode) {
    const errors = {}
    if (checkMode === 'register' && !name.trim()) errors.name = 'اكتب اسمك.'
    if (!email.trim()) {
      errors.email = 'اكتب البريد الإلكتروني.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'اكتب بريدًا إلكترونيًا صحيحًا.'
    }
    if (checkMode === 'verify') {
      if (!otp.trim()) errors.otp = 'اكتب كود التفعيل.'
      else if (!/^[0-9]{6}$/.test(otp.trim())) errors.otp = 'كود التفعيل لازم يكون ٦ أرقام.'
    } else if (checkMode !== 'resend') {
      if (!password) errors.password = 'اكتب كلمة المرور.'
      else if (checkMode === 'register' && password.length < 8) errors.password = 'كلمة المرور لازم تكون ٨ أحرف على الأقل.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!validate(mode)) return
    setBusy(true)
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
    setMessage('')
    setError('')
    if (!validate('resend')) return
    setBusy(true)
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
        <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>دخول</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>حساب جديد</button>
        <button className={mode === 'verify' ? 'active' : ''} onClick={() => switchMode('verify')}>تفعيل البريد</button>
      </div>
      <form className="stack-form" onSubmit={submit} noValidate>
        {mode === 'register' && <label>الاسم<input value={name} aria-invalid={Boolean(formErrors.name)} onChange={(event) => { setName(event.target.value); setFormErrors((current) => ({ ...current, name: '' })) }} />
          {formErrors.name && <small className="field-error">{formErrors.name}</small>}</label>}
        <label>البريد الإلكتروني<input type="email" value={email} aria-invalid={Boolean(formErrors.email)} onChange={(event) => { setEmail(event.target.value); setFormErrors((current) => ({ ...current, email: '' })) }} />
          {formErrors.email && <small className="field-error">{formErrors.email}</small>}</label>
        {mode === 'register' && <label>رقم الموبايل (اختياري)<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" /></label>}
        {mode === 'verify'
          ? <label>كود التفعيل من البريد<input inputMode="numeric" maxLength="6" value={otp} aria-invalid={Boolean(formErrors.otp)} onChange={(event) => { setOtp(event.target.value); setFormErrors((current) => ({ ...current, otp: '' })) }} />
              {formErrors.otp && <small className="field-error">{formErrors.otp}</small>}</label>
          : <label>كلمة المرور<input type="password" value={password} aria-invalid={Boolean(formErrors.password)} onChange={(event) => { setPassword(event.target.value); setFormErrors((current) => ({ ...current, password: '' })) }} />
              {formErrors.password && <small className="field-error">{formErrors.password}</small>}</label>}
        <button disabled={busy}>{busy ? 'لحظة...' : mode === 'register' ? 'إنشاء الحساب' : mode === 'verify' ? 'تفعيل الحساب' : 'دخول'}</button>
      </form>
      {mode === 'verify' && <button className="text-button" disabled={busy} onClick={resend}>إعادة إرسال الكود</button>}
      {message && <p className="inline-message">{message}</p>}
      {error && <p className="inline-message error" role="alert">{error}</p>}
    </div>}
  </section>
}

export default Account
