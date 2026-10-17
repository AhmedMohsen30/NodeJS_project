import { useEffect, useState } from 'react'
import { api } from './api.js'

function Clinics() {
  const [specialties, setSpecialties] = useState([])
  const [clinics, setClinics] = useState([])
  const [total, setTotal] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    api('/api/specialties').then((result) => setSpecialties(result.data)).catch(() => setSpecialties([]))
  }, [])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams()
    params.set('limit', '50')
    if (search) params.set('q', search)
    if (specialty) params.set('specialty', specialty)
    api('/api/clinics?' + params)
      .then((result) => {
        if (!active) return
        setClinics(result.data)
        setTotal(result.total)
        setError('')
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, specialty])

  async function showDetails(id) {
    setSelectedClinic(null)
    setDetailsLoading(true)
    try {
      const result = await api('/api/clinics/' + id)
      setSelectedClinic(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  return <>
    <section className="hero">
      <div className="container hero-content">
        <div>
          <span className="eyebrow">رعايتك تبدأ من هنا</span>
          <h1>اختار العيادة المناسبة <span>بسهولة</span></h1>
          <p>ابحث عن العيادات والتخصصات المتاحة. البيانات المعروضة هنا جاية مباشرة من المشروع.</p>
          <a className="hero-link" href="#clinics">استكشف العيادات ←</a>
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
      <form className="filters" onSubmit={(event) => {
        event.preventDefault()
        const nextSearch = searchText.trim()
        if (nextSearch !== search) {
          setLoading(true)
          setSearch(nextSearch)
        }
      }}>
        <label><span>اسم العيادة</span><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="ابحث عن عيادة..." /></label>
        <label><span>التخصص</span><select value={specialty} onChange={(event) => { setLoading(true); setSpecialty(event.target.value) }}>
          <option value="">كل التخصصات</option>
          {specialties.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select></label>
        <button type="submit">بحث</button>
      </form>
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading && <p className="notice">جاري تحميل العيادات...</p>}
      {!loading && !error && clinics.length === 0 && <p className="notice">مفيش عيادات مطابقة للبحث.</p>}
      {!loading && !error && <div className="clinic-grid">
        {clinics.map((clinic) => <article className="clinic-card" key={clinic._id}>
          <div className="clinic-image">
            {clinic.photos?.length ? <img src={clinic.photos[0]} alt={clinic.name} /> : <span aria-hidden="true">✚</span>}
            {clinic.isFeatured && <span className="featured">مميزة</span>}
          </div>
          <div className="clinic-body">
            <h3>{clinic.name}</h3><p className="clinic-location">{clinic.city} · {clinic.address}</p>
            <div className="tags">{clinic.specialties?.map((item) => <span key={item._id}>{item.name}</span>)}</div>
            <div className="clinic-footer"><span>من {clinic.minPrice} جنيه</span><button type="button" onClick={() => showDetails(clinic._id)}>التفاصيل</button></div>
          </div>
        </article>)}
      </div>}
    </section>
    {(detailsLoading || selectedClinic) && <div className="dialog-backdrop" onClick={() => { setDetailsLoading(false); setSelectedClinic(null) }}>
      <div className="details-dialog" role="dialog" aria-modal="true" aria-label="تفاصيل العيادة" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="إغلاق" onClick={() => { setDetailsLoading(false); setSelectedClinic(null) }}>×</button>
        {detailsLoading && <p>جاري تحميل التفاصيل...</p>}
        {selectedClinic && <>
          <span className="eyebrow">تفاصيل العيادة</span><h2>{selectedClinic.name}</h2>
          <p>{selectedClinic.about || 'لا يوجد وصف متاح للعيادة بعد.'}</p>
          <dl>
            <div><dt>العنوان</dt><dd>{selectedClinic.address}، {selectedClinic.city}</dd></div>
            <div><dt>مواعيد العمل</dt><dd>{selectedClinic.workingHours}</dd></div>
            <div><dt>سعر الكشف</dt><dd>{selectedClinic.minPrice} - {selectedClinic.maxPrice} جنيه</dd></div>
            <div><dt>الأطباء</dt><dd>{selectedClinic.doctors?.length || 0}</dd></div>
          </dl>
        </>}
      </div>
    </div>}
  </>
}

export default Clinics
