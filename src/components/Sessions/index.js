import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'
import { useSession } from '../../contexts/SessionContext'
import { useWebsocket } from '../../contexts/WebsocketContext'

export const Sessions = (props) => {
  const {
    UIComponent,
    sortByDate
  } = props

  const [ordering] = useApi()
  const socket = useWebsocket()
  const [{ user, token }, { login, logout }] = useSession()

  const [sessionsList, setSessionsList] = useState({ sessions: [], loading: true, error: null })
  const [actionState, setActionState] = useState({ loading: false, error: null })

  /**
   * Method to get the sessions from API
   */
  const handleGetSessions = async () => {
    try {
      setSessionsList({
        ...sessionsList,
        loading: true
      })
      const response = await fetch(`${ordering.root}/users/${user.id}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const { result, error } = await response.json()
      if (!error && sortByDate) {
        const sortOrder = sortByDate === 'desc' ? -1 : 1
        result.sort((a, b) => sortOrder * (new Date(a.created_at) - new Date(b.created_at)))
      }
      if (!error) {
        setSessionsList({
          loading: false,
          error: null,
          sessions: result
        })
      } else {
        setSessionsList({
          ...sessionsList,
          loading: false,
          error: result
        })
      }
    } catch (err) {
      setSessionsList({
        ...sessionsList,
        loading: false,
        error: [err.message]
      })
    }
  }

  /**
   * Method to delete the session from API
   * @param {number} sessionId session id
   */
  const handleDeleteSession = async (session) => {
    try {
      setActionState({ ...actionState, loading: true })
      const response = await fetch(`${ordering.root}/users/${user.id}/sessions/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        }
      })
      const { result, error } = await response.json()
      if (!error) {
        const sessions = sessionsList.sessions.filter(_session => _session.id !== session.id)
        setSessionsList({
          ...sessionsList,
          sessions
        })
        setActionState({
          loading: false,
          error: null
        })
        if (session.current) {
          logout()
        }
      } else {
        setActionState({
          loading: false,
          error: result
        })
      }
    } catch (error) {
      setActionState({
        loading: false,
        error: [error.message]
      })
    }
  }

  /**
   * Method to delete all sessions
   */
  const handleDeleteAllSessions = async (deleteCurrent = false) => {
    try {
      setActionState({ ...actionState, loading: true })
      const response = await fetch(`${ordering.root}/users/${user.id}/sessions/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-X': ordering.appId,
          'X-INTERNAL-PRODUCT-X': ordering.appInternalName,
          'X-Socket-Id-X': socket?.getId()
        },
        body: JSON.stringify({ delete_current: deleteCurrent })
      })
      const { result, error } = await response.json()
      if (!error) {
        setActionState({
          loading: false,
          error: null
        })
        if (deleteCurrent) {
          setSessionsList({
            ...sessionsList,
            sessions: []
          })
          logout()
        } else {
          setSessionsList({
            ...sessionsList,
            sessions: sessionsList.sessions.filter(session => session.current)
          })
          if (user?.session_strategy === 'jwt') {
            login({
              token,
              user: { ...user, session_strategy: 'jwt_session' }
            })
          }
        }
      } else {
        setActionState({
          loading: false,
          error: result
        })
      }
    } catch (error) {
      setActionState({
        loading: false,
        error: [error.message]
      })
    }
  }

  useEffect(() => {
    if (user?.session_strategy === 'jwt_session') {
      handleGetSessions()
    } else {
      setSessionsList({
        ...sessionsList,
        loading: false,
        sessions: []
      })
    }
  }, [user?.session_strategy])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          sessionsList={sessionsList}
          actionState={actionState}
          handleDeleteSession={handleDeleteSession}
          handleDeleteAllSessions={handleDeleteAllSessions}
        />
      )}
    </>
  )
}

Sessions.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}
