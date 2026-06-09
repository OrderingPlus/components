import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'school_selected_students'
let map = null
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())

const readMap = () => {
  if (map) return map
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    map = (parsed && typeof parsed === 'object') ? parsed : {}
  } catch (err) {
    map = {}
  }
  return map
}

const writeMap = (next) => {
  map = next
  try {
    if (Object.keys(next).length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
  }
}

export const useSelectedStudent = (businessKey) => {
  const [, setTick] = useState(0)
  const key = (businessKey === 0 || businessKey) ? String(businessKey) : null

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const setStudentId = useCallback((studentId) => {
    if (!key) return
    const next = { ...readMap() }
    if (studentId) next[key] = String(studentId)
    else delete next[key]
    writeMap(next)
    emit()
  }, [key])

  const studentId = key ? (readMap()[key] || null) : null
  return { studentId, setStudentId }
}
