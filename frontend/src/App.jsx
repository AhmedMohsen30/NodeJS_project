import { useState } from 'react'
import Clinics from './Clinics.jsx'
import Account from './Account.jsx'
import Doctors from './Doctors.jsx'
import Appointments from './Appointments.jsx'
import './App.css'

function savedUser() {
  try {
    return JSON.parse(sessionStorage.getItem('careclinic_user') || 'null')
  } catch {
    return null
  }
}

function App() {
  const [page, setPage] = useState('clinics')
  const [token, setToken] = useState(() => sessionStorage.getItem('careclinic_token') || '')
  const [user, setUser] = useState(savedUser)

  function login(nextToken, nextUser) {
    sessionStorage.setItem('careclinic_token', nextToken)
    sessionStorage.setItem('careclinic_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  function logout() {
    sessionStorage.removeItem('careclinic_token')
    sessionStorage.removeItem('careclinic_user')
    setToken('')
    setUser(null)
  }

  function navigate(nextPage) {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <>
    <header className="site-header"><div className="container header-content">
      <button className="brand brand-button" onClick={() => navigate('clinics')} dir="ltr"><span className="brand-mark">+</span>Care<span>Clinic</span></button>
      <nav aria-label="القائمة الرئيسية">
        <button className={page === 'clinics' ? 'active' : ''} onClick={() => navigate('clinics')}>العيادات</button>
        <button className={page === 'doctors' ? 'active' : ''} onClick={() => navigate('doctors')}>الأطباء والحجز</button>
        <button className={page === 'appointments' ? 'active' : ''} onClick={() => navigate('appointments')}>مواعيدي</button>
        <button className={page === 'account' ? 'active' : ''} onClick={() => navigate('account')}>{user ? user.name : 'دخول'}</button>
      </nav>
    </div></header>
    <main>
      {page === 'clinics' && <Clinics />}
      {page === 'doctors' && <Doctors token={token} onGoAccount={() => navigate('account')} onGoAppointments={() => navigate('appointments')} />}
      {page === 'appointments' && <Appointments token={token} onGoAccount={() => navigate('account')} />}
      {page === 'account' && <Account user={user} onLogin={login} onLogout={logout} />}
    </main>
    <footer><div className="container">CareClinic · مشروع إدارة العيادات</div></footer>
  </>
}

export default App
