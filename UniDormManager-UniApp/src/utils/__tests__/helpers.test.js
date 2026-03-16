import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  formatDate, 
  formatRelativeTime, 
  deepClone, 
  debounce, 
  throttle,
  isEmpty,
  generateId,
  maskPhone,
  maskIdCard
} from '../helpers.js'

describe('formatDate', () => {
  it('应该正确格式化日期', () => {
    const date = new Date('2024-03-16 14:30:00')
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-03-16')
    expect(formatDate(date, 'YYYY年MM月DD日')).toBe('2024年03月16日')
    expect(formatDate(date, 'HH:mm')).toBe('14:30')
  })

  it('应该返回 - 当输入为空', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
  })

  it('应该返回 - 当输入无效', () => {
    expect(formatDate('invalid')).toBe('-')
  })
})

describe('formatRelativeTime', () => {
  it('应该正确格式化相对时间', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toMatch(/\d{2}:\d{2}/)

    const yesterday = new Date(now - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(yesterday)).toBe('昨天')
  })
})

describe('deepClone', () => {
  it('应该正确深拷贝对象', () => {
    const obj = { a: 1, b: { c: 2 } }
    const cloned = deepClone(obj)
    
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
  })

  it('应该正确深拷贝数组', () => {
    const arr = [1, 2, { a: 3 }]
    const cloned = deepClone(arr)
    
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
  })

  it('应该正确处理日期', () => {
    const date = new Date('2024-03-16')
    const cloned = deepClone(date)
    
    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date)
  })
})

describe('debounce', () => {
  it('应该防抖执行', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 300)
    
    debouncedFn()
    debouncedFn()
    debouncedFn()
    
    expect(fn).not.toHaveBeenCalled()
    
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    
    vi.useRealTimers()
  })
})

describe('throttle', () => {
  it('应该节流执行', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttledFn = throttle(fn, 300)
    
    throttledFn()
    throttledFn()
    throttledFn()
    
    expect(fn).toHaveBeenCalledTimes(1)
    
    vi.advanceTimersByTime(300)
    throttledFn()
    expect(fn).toHaveBeenCalledTimes(2)
    
    vi.useRealTimers()
  })
})

describe('isEmpty', () => {
  it('应该正确判断空值', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty([])).toBe(true)
    expect(isEmpty({})).toBe(true)
  })

  it('应该正确判断非空值', () => {
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty([1, 2, 3])).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })
})

describe('generateId', () => {
  it('应该生成唯一ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(10)
  })
})

describe('maskPhone', () => {
  it('应该正确脱敏手机号', () => {
    expect(maskPhone('13812345678')).toBe('138****5678')
  })

  it('应该返回原值当格式不正确', () => {
    expect(maskPhone('123')).toBe('123')
    expect(maskPhone(null)).toBe(null)
  })
})

describe('maskIdCard', () => {
  it('应该正确脱敏身份证号', () => {
    expect(maskIdCard('110101199001011234')).toBe('1101**********1234')
  })

  it('应该返回原值当格式不正确', () => {
    expect(maskIdCard('123')).toBe('123')
    expect(maskIdCard(null)).toBe(null)
  })
})
