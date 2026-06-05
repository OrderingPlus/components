/**
 * Upsert a logistic assign-request into the list, keyed by its `id`.
 *
 * - If an entry with the same `id` already exists, the incoming data is merged
 *   over it (same behaviour as before for `request_update`).
 * - If it does NOT exist yet, the incoming assign-request is appended instead of
 *   being silently dropped.
 *
 * Why: during advanced-logistics driver reassignment (the "jump to next driver
 * every N seconds" config) the assign-request id churns constantly. A
 * `request_update` for a late-added grouped order (3rd onward) can arrive before
 * its `request_register`, or target an id the app no longer holds. The previous
 * update handler returned the list unchanged in that case, so the order stayed
 * in "Accepted by business" (status 7) until a manual refresh. Upserting by id
 * guarantees the order is never lost, and de-duplicating by id (instead of by
 * full JSON) prevents duplicate cards when both events arrive for the same id.
 *
 * @param {Array<object>} orders current assign-request list
 * @param {object} order incoming assign-request payload
 * @returns {Array<object>} new list (never mutates the input)
 */
export const mergeAssignRequestOrders = (orders, order) => {
  const list = Array.isArray(orders) ? orders : []
  if (!order || order.id === undefined || order.id === null) return list
  const exists = list.some(_order => _order?.id === order?.id)
  if (!exists) return [...list, order]
  return list.map(_order => (_order?.id === order?.id ? { ..._order, ...order } : _order))
}
