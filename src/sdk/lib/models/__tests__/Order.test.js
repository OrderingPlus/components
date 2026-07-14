import { describe, it, expect } from 'vitest'
import { Order } from '../Order'

const baseProduct = {
  price: 10,
  quantity: 2,
  options: [{
    allow_suboption_quantity: true,
    suboptions: [{ price: 2, quantity: 2, position: 'whole' }]
  }]
}

describe('Order model', () => {
  it('returns id via getId', () => {
    const order = new Order({ id: 42 })
    expect(order.getId()).toBe(42)
  })

  it('computes subtotal from products and suboptions', () => {
    const order = new Order({ products: [baseProduct] })
    // (10 + 2*2) * 2 = 28
    expect(order.subtotal).toBe(28)
  })

  it('returns zero subtotal when products are missing', () => {
    const order = new Order({})
    expect(order.subtotal).toBe(0)
  })

  it('computes delivery fee only for delivery type 1', () => {
    const delivery = new Order({ delivery_type: 1, delivery_zone_price: 5 })
    const pickup = new Order({ delivery_type: 2, delivery_zone_price: 5 })
    expect(delivery.deliveryFee).toBe(5)
    expect(pickup.deliveryFee).toBe(0)
  })

  it('computes service fee, tax, tip, and total', () => {
    const order = new Order({
      products: [baseProduct],
      delivery_type: 2,
      discount: 2,
      service_fee: 10,
      tax: 10,
      tax_type: 2,
      driver_tip: 10
    })
    expect(order.serviceFee).toBeCloseTo((order.subtotal - order.discount) * 0.1)
    expect(order.totalTax).toBeCloseTo((order.subtotal * order.tax) / (order.tax + 100))
    expect(order.totalDriverTip).toBeCloseTo((order.subtotal - order.totalTax) * 0.1)
    expect(order.total).toBeCloseTo(
      order.subtotal + order.serviceFee + order.deliveryFee + order.totalDriverTip + order.totalTax - order.discount
    )
  })
})
