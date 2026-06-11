import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../contexts/ApiContext'
import { useSession } from '../contexts/SessionContext'

const request = async (url, options) => {
  try {
    const response = await fetch(url, options)
    const body = await response.json()
    return { error: body.error, result: body.result }
  } catch (err) {
    return { error: true, result: [err.message] }
  }
}

let store = { loading: false, students: [], error: null }
let loadedToken = null
let inFlight = null
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())

export const useSchoolStudents = () => {
  const [ordering] = useApi()
  const [{ token, auth }] = useSession()
  const [, setTick] = useState(0)

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` })

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const doLoad = useCallback(async (force = false) => {
    if (!auth) return
    if (!force && loadedToken === token && !inFlight) return
    if (inFlight) return inFlight
    store = { ...store, loading: true }
    emit()
    inFlight = request(`${ordering.root}/schools/students`, { method: 'GET', headers: headers() })
      .then(({ error, result }) => {
        store = { loading: false, students: error ? [] : (result || []), error: error ? result : null }
        loadedToken = token
        inFlight = null
        emit()
      })
    return inFlight
  }, [ordering, token, auth])

  const createStudent = (payload) =>
    request(`${ordering.root}/schools/students`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) })

  const updateStudent = (studentId, payload) =>
    request(`${ordering.root}/schools/students/${studentId}`, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) })

  useEffect(() => { doLoad() }, [doLoad])

  return { ...store, refresh: () => doLoad(true), createStudent, updateStudent }
}
