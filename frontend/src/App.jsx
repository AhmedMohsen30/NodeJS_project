import { useEffect, useState } from 'react'
import './App.css'

async function getData(path) {
  const response = await fetch(path)
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'حصلت مشكلة أثناء تحميل البيانات')
  }
  return result
}

function App() {
  const [specialties, setSpecialties] = useState([])
  const [clinics, setClinics] = useState([])
  const [total, setTotal] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [openDetails, setOpenDetails] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    getData('/api/specialties')
      .then((result) => setSpecialties(result.data))
      .catch(() => setSpecialties([]))
  }, [])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (specialty) params.set('specialty', specialty)

    getData('/api/clinics?' + params.toString())
      .then((result) => {
        if (!active) return
        setClinics(result.data)
        setTotal(result.total)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.message)
        setClinics([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [search, specialty])

  function submitSearch(event) {
    event.preventDefault()
    const nextSearch = searchText.trim()
    if (nextSearch !== search) {
      setLoading(true)
      setSearch(nextSearch)
    }
  }

  async function showDetails(id) {
    setOpenDetails(true)
    setSelectedClinic(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const result = await getData('/api/clinics/' + id)
      setSelectedClinic(result.data)
    } catch (err) {
      setDetailsError(err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  function closeDetails() {
    setOpenDetails(false)
    setSelectedClinic(null)
    setDetailsError('')
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <a className="brand" href="#home" dir="ltr"><span className="brand-mark">+</span>Care<span>Clinic</span></a>
          <nav aria-label="القائمة الرئيسية"><a href="#clinics">العيادات</a><a href="#about">عن المشروع</a></nav>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="container hero-content">
            <div>
              <span className="eyebrow">رعايتك تبدأ من هنا</span>
              <h1>اختار العيادة المناسبة <span>بسهولة</span></h1>
              <p>ابحث عن العيادات والتخصصات المتاحة. البيانات المعروضة هنا جاية مباشرة من مشروعنا.</p>
              <a className="hero-link" href="#clinics">استكشف العيادات <span aria-hidden="true">←</span></a>
            </div>
            <div className="hero-graphic" aria-hidden="true">
              <div className="circle circle-one" /><div className="circle circle-two" />
              <div className="hero-card"><span>✚</span><strong>صحتك تهمنا</strong><small>اختيار أسهل، رعاية أفضل</small></div>
            </div>
          </div>
        </section>

        <section className="container clinics-section" id="clinics">
          <div className="section-heading">
            <div><span className="eyebrow">اكتشف الأقرب ليك</span><h2>العيادات المتاحة</h2><p>ابحث باسم العيادة أو اختار تخصصًا.</p></div>
            <span className="result-count">{loading ? 'جاري التحميل...' : total + ' عيادة'}</span>
          </div>

          <form className="filters" onSubmit={submitSearch}>
            <label><span>اسم العيادة</span><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="ابحث عن عيادة..." /></label>
            <label><span>التخصص</span><select value={specialty} onChange={(event) => { setLoading(true); setSpecialty(event.target.value) }}>
              <option value="">كل التخصصات</option>
              {specialties.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select></label>
            <button type="submit">بحث</button>
          </form>

          {error && <div className="notice error" role="alert">تعذر الاتصال بالباك إند: {error}. اتأكد إن السيرفر شغال على port 5000.</div>}
          {loading && <div className="notice">جاري تحميل العيادات...</div>}
          {!loading && !error && clinics.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">✚</span>
              <h3>مفيش عيادات ظاهرة حاليًا</h3>
              <p>الاتصال بالـAPI شغال، لكن مفيش عيادات مطابقة للبحث أو لسه ما اتضافتش بيانات.</p>
              {(search || specialty) && <button className="text-button" type="button" onClick={() => { setLoading(true); setSearchText(''); setSearch(''); setSpecialty('') }}>اعرض كل العيادات</button>}
            </div>
          )}

          {!loading && !error && clinics.length > 0 && <div className="clinic-grid">
            {clinics.map((clinic) => <article className="clinic-card" key={clinic._id}>
              <div className="clinic-image">
                {clinic.photos && clinic.photos.length > 0 ? <img src={clinic.photos[0]} alt={clinic.name} /> : <span aria-hidden="true">✚</span>}
                {clinic.isFeatured && <span className="featured">مميزة</span>}
              </div>
              <div className="clinic-body">
                <h3>{clinic.name}</h3><p className="clinic-location">{clinic.city} · {clinic.address}</p>
                <div className="tags">{clinic.specialties && clinic.specialties.map((item) => <span key={item._id}>{item.name}</span>)}</div>
                <div className="clinic-footer"><span>من {clinic.minPrice} جنيه</span><button type="button" onClick={() => showDetails(clinic._id)}>التفاصيل</button></div>
              </div>
            </article>)}
          </div>}
        </section>

        <section className="about-section" id="about"><div className="container">
          <h2>كل العيادات في مكان واحد</h2>
          <p>الواجهة مرتبطة بباك إند Node.js وبيانات MongoDB. هنضيف رحلة الحجز لما تكتمل مسارات الحسابات والمواعيد.</p>
        </div></section>
      </main>
      <footer><div className="container">CareClinic · مشروع إدارة العيادات</div></footer>

      {openDetails && <div className="dialog-backdrop" onClick={closeDetails}>
        <div className="details-dialog" role="dialog" aria-modal="true" aria-label="تفاصيل العيادة" onClick={(event) => event.stopPropagation()}>
          <button className="close-button" type="button" aria-label="إغلاق" onClick={closeDetails}>×</button>
          {detailsLoading && <p>جاري تحميل التفاصيل...</p>}
          {detailsError && <p role="alert">{detailsError}</p>}
          {selectedClinic && <>
            <span className="eyebrow">تفاصيل العيادة</span><h2>{selectedClinic.name}</h2>
            <p>{selectedClinic.about || 'لا يوجد وصف متاح للعيادة بعد.'}</p>
            <dl>
              <div><dt>العنوان</dt><dd>{selectedClinic.address}، {selectedClinic.city}</dd></div>
              <div><dt>مواعيد العمل</dt><dd>{selectedClinic.workingHours}</dd></div>
              <div><dt>سعر الكشف</dt><dd>{selectedClinic.minPrice} - {selectedClinic.maxPrice} جنيه</dd></div>
              <div><dt>الأطباء</dt><dd>{selectedClinic.doctors.length}</dd></div>
            </dl>
          </>}
        </div>
      </div>}
    </>
  )
}

export default App
