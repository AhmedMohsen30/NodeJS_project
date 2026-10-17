export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let result = {}
  try {
    result = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('تعذر قراءة رد السيرفر. اتأكد إن الباك إند شغال.')
  }
  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'حصلت مشكلة في الطلب')
  }
  return result
}
