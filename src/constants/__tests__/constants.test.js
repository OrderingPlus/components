import { describe, it, expect } from 'vitest'
import { SCHOOL_VERTICAL, SCHOOL_ALLERGENS, SCHOOL_DIETARY_TAGS, SCHOOL_GRADE_CODES } from '../school'
import { PROJECTS_WITH_LOGISTIC_DEFAULT_ETA } from '../logistic'
import { CODES } from '../code-numbers'

describe('constants', () => {
  it('exports school catalog values', () => {
    expect(SCHOOL_VERTICAL).toBe('school')
    expect(SCHOOL_ALLERGENS.length).toBeGreaterThan(0)
    expect(SCHOOL_DIETARY_TAGS.length).toBeGreaterThan(0)
    expect(SCHOOL_GRADE_CODES.some((g) => g.value === 'g12')).toBe(true)
  })

  it('exports logistic defaults', () => {
    expect(PROJECTS_WITH_LOGISTIC_DEFAULT_ETA).toContain('quickiedelivery')
  })

  it('exports phone country codes', () => {
    expect(CODES.find((c) => c.countryCode === 'US')?.phoneCode).toBe('1')
  })
})
