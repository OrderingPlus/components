import io from 'socket.io-client'

const LEAVE_DEBOUNCE_MS = 500

export class Socket {
  constructor ({ url, project, accessToken }) {
    this.url = url
    this.project = project
    this.accessToken = accessToken
    this.queue = []
    this.pendingLeaves = {}
  }

  roomTarget (room) {
    return typeof room === 'string' ? `${this.project}_${room}` : room
  }

  roomKey (room) {
    return typeof room === 'string' ? `${this.project}_${room}` : JSON.stringify(room)
  }

  connect () {
    const options = {
      query: `project=${this.project}`,
      transports: ['websocket']
    }

    if (this.accessToken) {
      options.extraHeaders = {
        Authorization: `Bearer ${this.accessToken}`
      }
      options.query = `${options.query}&token=${this.accessToken}`
    }

    this.socket = io(this.url, options)
    this.socket.on('connect', () => {
      let item
      while ((item = this.queue.shift()) !== undefined) {
        if (item.action === 'on') {
          this.on(item.event, item.func)
        } else if (item.action === 'join') {
          this.join(item.room)
        } else if (item.action === 'leave') {
          this.leave(item.room)
        } else if (item.action === 'off') {
          this.off(item.event, item.func)
        }
      }
    })
  }

  getId () {
    return this.socket?.id
  }

  close () {
    if (this.socket?.connected) {
      this.socket.close()
    }
  }

  join (room) {
    const key = this.roomKey(room)
    if (this.pendingLeaves[key]) {
      clearTimeout(this.pendingLeaves[key])
      delete this.pendingLeaves[key]
    }
    if (this.socket?.connected) {
      this.socket.emit('join', this.roomTarget(room))
    } else {
      this.queue.push({ action: 'join', room })
    }
    return this
  }

  leave (room) {
    const key = this.roomKey(room)
    if (this.pendingLeaves[key]) return this
    this.pendingLeaves[key] = setTimeout(() => {
      delete this.pendingLeaves[key]
      if (this.socket?.connected) {
        this.socket.emit('leave', this.roomTarget(room))
      } else {
        this.queue.push({ action: 'leave', room })
      }
    }, LEAVE_DEBOUNCE_MS)
    return this
  }

  on (event, func = () => {}) {
    if (this.socket?.connected) {
      this.socket.on(event, func)
    } else {
      this.queue.push({ action: 'on', event, func })
    }
    return this
  }

  off (event, func = () => {}) {
    if (this.socket?.connected) {
      this.socket.off(event, func)
    } else {
      this.queue.push({ action: 'off', event, func })
    }
    return this
  }
}
