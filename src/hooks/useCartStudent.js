import { useApi } from '../contexts/ApiContext'
import { useSession } from '../contexts/SessionContext'

export const useCartStudent = () => {
  const [ordering] = useApi()
  const [{ token }] = useSession()

  const assignStudent = async (cartUuid, studentId) => {
    try {
      const response = await fetch(`${ordering.root}/carts/${cartUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId ?? null })
      })
      const body = await response.json()
      return { error: body.error, result: body.result }
    } catch (err) {
      return { error: true, result: [err.message] }
    }
  }

  return { assignStudent }
}
