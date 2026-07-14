import { describe, it, expect } from 'vitest'
import { Cart } from '../Cart'
import { Business } from '../Business'
import { Category } from '../Category'
import { Address } from '../Address'
import { Config } from '../Config'
import { Product } from '../Product'
import { Page } from '../Page'
import { Menu } from '../Menu'
import { Language } from '../Language'
import { Translation } from '../Translation'
import { OrderOption } from '../OrderOption'
import { OrderMessage } from '../OrderMessage'
import { City } from '../City'
import { Country } from '../Country'
import { Controls } from '../Controls'
import { DriversGroups } from '../DriversGroups'
import { DriverLocations } from '../DriverLocations'
import { PaymentCards } from '../PaymentCards'
import { ValidationField } from '../ValidationField'

describe('SDK models smoke', () => {
  it.each([
    [Cart, { id: 10 }],
    [Business, { id: 11, name: 'Store' }],
    [Category, { id: 12 }],
    [Address, { id: 13 }],
    [Config, { id: 14 }],
    [Product, { id: 15 }],
    [Page, { id: 16 }],
    [Menu, { id: 17 }],
    [Language, { id: 18 }],
    [Translation, { id: 19 }],
    [OrderOption, { id: 20 }],
    [OrderMessage, { id: 21 }],
    [City, { id: 22 }],
    [Country, { id: 23 }],
    [ValidationField, { id: 28 }]
  ])('instantiates model with getId', (ModelClass, payload) => {
    const instance = new ModelClass(payload)
    expect(instance.getId()).toBe(payload.id)
  })

  it.each([
    [Controls, { id: 24 }],
    [DriversGroups, { id: 25 }],
    [DriverLocations, { id: 26 }],
    [PaymentCards, { id: 27 }]
  ])('instantiates model with id property', (ModelClass, payload) => {
    const instance = new ModelClass(payload)
    expect(instance.id).toBe(payload.id)
  })
})
