import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useSession } from '../contexts/SessionContext'

const request = async (url, options) => {
  try {
    const response = await fetch(url, options)
    const body = await response.json()
    return { error: body.error, result: body.result, pagination: body.pagination }
  } catch (err) {
    return { error: true, result: [err.message] }
  }
}

const SCHOOL_PARAMS = '*,classrooms,grades'

const stores = new Map()
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())
const getEntry = (key) => {
  if (!stores.has(key)) {
    stores.set(key, { loading: false, schools: [], error: null, loadedToken: null, inFlight: null })
  }
  return stores.get(key)
}

export const useSchools = (schoolId, enabled = true) => {
  const [ordering] = useApi()
  const [{ token }] = useSession()
  const [, setTick] = useState(0)
  const key = schoolId ? `school:${schoolId}` : 'all'

  const headers = () => {
    const base = { 'Content-Type': 'application/json' }
    if (token) base.Authorization = `Bearer ${token}`
    return base
  }

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const doLoad = useCallback(async (force = false) => {
    if (!enabled) return
    const entry = getEntry(key)
    if (!force && entry.loadedToken === token && !entry.inFlight) return
    if (entry.inFlight) return entry.inFlight
    entry.loading = true
    emit()
    const where = schoolId
      ? `&where=${encodeURIComponent(JSON.stringify({ conditions: [{ attribute: 'id', value: schoolId }], conector: 'AND' }))}`
      : ''
    entry.inFlight = request(
      `${ordering.root}/schools?params=${SCHOOL_PARAMS}${where}&page=1&page_size=10`,
      { method: 'GET', headers: headers() }
    ).then(({ error, result }) => {
      entry.loading = false
      entry.schools = error ? [] : (result || [])
      entry.error = error ? result : null
      entry.loadedToken = token
      entry.inFlight = null
      emit()
    })
    return entry.inFlight
  }, [ordering, token, key, enabled])

  useEffect(() => { doLoad() }, [doLoad])

  const entry = getEntry(key)
  return { loading: entry.loading, schools: entry.schools, error: entry.error, refresh: () => doLoad(true) }
}
