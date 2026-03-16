import { describe, it, expect } from 'vitest'
import {
  VALIDATION_RULES,
  validateField,
  validateForm,
  escapeHtml,
  sanitizeHtml,
  sanitizeInput,
  validators
} from '../security.js'

describe('VALIDATION_RULES', () => {
  describe('required', () => {
    it('应该正确验证必填', () => {
      expect(VALIDATION_RULES.required('hello')).toBe(true)
      expect(VALIDATION_RULES.required('  hello  ')).toBe(true)
      expect(VALIDATION_RULES.required([1, 2])).toBe(true)
      expect(VALIDATION_RULES.required({ a: 1 })).toBe(true)
      expect(VALIDATION_RULES.required('')).toBe(false)
      expect(VALIDATION_RULES.required('   ')).toBe(false)
      expect(VALIDATION_RULES.required(null)).toBe(false)
      expect(VALIDATION_RULES.required(undefined)).toBe(false)
      expect(VALIDATION_RULES.required([])).toBe(false)
      expect(VALIDATION_RULES.required({})).toBe(false)
    })
  })

  describe('phone', () => {
    it('应该正确验证手机号', () => {
      expect(VALIDATION_RULES.phone('13812345678')).toBe(true)
      expect(VALIDATION_RULES.phone('15012345678')).toBe(true)
      expect(VALIDATION_RULES.phone('18812345678')).toBe(true)
      expect(VALIDATION_RULES.phone('1381234567')).toBe(false)
      expect(VALIDATION_RULES.phone('138123456789')).toBe(false)
      expect(VALIDATION_RULES.phone('12812345678')).toBe(false)
      expect(VALIDATION_RULES.phone('')).toBe(true)
    })
  })

  describe('email', () => {
    it('应该正确验证邮箱', () => {
      expect(VALIDATION_RULES.email('test@example.com')).toBe(true)
      expect(VALIDATION_RULES.email('user.name@domain.co.uk')).toBe(true)
      expect(VALIDATION_RULES.email('invalid')).toBe(false)
      expect(VALIDATION_RULES.email('invalid@')).toBe(false)
      expect(VALIDATION_RULES.email('@example.com')).toBe(false)
      expect(VALIDATION_RULES.email('')).toBe(true)
    })
  })

  describe('idCard', () => {
    it('应该正确验证身份证号', () => {
      expect(VALIDATION_RULES.idCard('110101199001011234')).toBe(true)
      expect(VALIDATION_RULES.idCard('11010119900101123X')).toBe(true)
      expect(VALIDATION_RULES.idCard('110101900101123')).toBe(true)
      expect(VALIDATION_RULES.idCard('11010119900101123')).toBe(false)
      expect(VALIDATION_RULES.idCard('')).toBe(true)
    })
  })

  describe('minLength/maxLength', () => {
    it('应该正确验证长度', () => {
      expect(VALIDATION_RULES.minLength('hello', 3)).toBe(true)
      expect(VALIDATION_RULES.minLength('hello', 10)).toBe(false)
      expect(VALIDATION_RULES.maxLength('hello', 10)).toBe(true)
      expect(VALIDATION_RULES.maxLength('hello', 3)).toBe(false)
    })
  })

  describe('min/max', () => {
    it('应该正确验证数值', () => {
      expect(VALIDATION_RULES.min(10, 5)).toBe(true)
      expect(VALIDATION_RULES.min(3, 5)).toBe(false)
      expect(VALIDATION_RULES.max(10, 15)).toBe(true)
      expect(VALIDATION_RULES.max(20, 15)).toBe(false)
    })
  })

  describe('noSpecialChars', () => {
    it('应该正确验证特殊字符', () => {
      expect(VALIDATION_RULES.noSpecialChars('hello world')).toBe(true)
      expect(VALIDATION_RULES.noSpecialChars('hello<script>')).toBe(false)
      expect(VALIDATION_RULES.noSpecialChars('test&value')).toBe(false)
    })
  })

  describe('strongPassword', () => {
    it('应该正确验证强密码', () => {
      expect(VALIDATION_RULES.strongPassword('Password123')).toBe(true)
      expect(VALIDATION_RULES.strongPassword('password123')).toBe(false)
      expect(VALIDATION_RULES.strongPassword('Password')).toBe(false)
      expect(VALIDATION_RULES.strongPassword('12345678')).toBe(false)
      expect(VALIDATION_RULES.strongPassword('short1A')).toBe(false)
    })
  })
})

describe('validateField', () => {
  it('应该通过验证', () => {
    const rules = [{ type: 'required' }, { type: 'phone' }]
    const result = validateField('13812345678', rules, '手机号')
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('应该返回必填错误', () => {
    const rules = [{ type: 'required' }]
    const result = validateField('', rules, '姓名')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('姓名不能为空')
  })

  it('应该返回自定义错误消息', () => {
    const rules = [{ type: 'required', message: '请填写内容' }]
    const result = validateField('', rules, '描述')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('请填写内容')
  })

  it('应该支持多个规则验证', () => {
    const rules = [
      { type: 'required' },
      { type: 'minLength', length: 5 }
    ]
    const result = validateField('abc', rules, '密码')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('密码长度不能少于5个字符')
  })
})

describe('validateForm', () => {
  it('应该通过表单验证', () => {
    const data = {
      name: '张三',
      phone: '13812345678',
      age: 20
    }
    const schema = {
      name: { label: '姓名', rules: [{ type: 'required' }] },
      phone: { label: '手机号', rules: [{ type: 'required' }, { type: 'phone' }] },
      age: { label: '年龄', rules: [{ type: 'required' }, { type: 'range', min: 18, max: 100 }] }
    }
    const result = validateForm(data, schema)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('应该返回多个字段错误', () => {
    const data = {
      name: '',
      phone: '123',
      age: 150
    }
    const schema = {
      name: { label: '姓名', rules: [{ type: 'required' }] },
      phone: { label: '手机号', rules: [{ type: 'required' }, { type: 'phone' }] },
      age: { label: '年龄', rules: [{ type: 'required' }, { type: 'range', min: 18, max: 100 }] }
    }
    const result = validateForm(data, schema)
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
    expect(result.errors.phone).toBeDefined()
    expect(result.errors.age).toBeDefined()
  })
})

describe('escapeHtml', () => {
  it('应该正确转义HTML', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml("it's")).toBe('it&#x27;s')
  })

  it('应该处理非字符串输入', () => {
    expect(escapeHtml(123)).toBe(123)
    expect(escapeHtml(null)).toBe(null)
  })
})

describe('sanitizeHtml', () => {
  it('应该过滤危险标签', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('')
    expect(sanitizeHtml('<iframe src="evil.com">')).toBe('')
    expect(sanitizeHtml('javascript:alert(1)')).toBe(':alert(1)')
  })

  it('应该保留安全内容', () => {
    expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>')
    expect(sanitizeHtml('<div class="test">Content</div>')).toBe('<div class="test">Content</div>')
  })
})

describe('sanitizeInput', () => {
  it('应该处理字符串', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('')
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('应该处理对象', () => {
    const input = {
      name: '<script>',
      content: '  hello  '
    }
    const result = sanitizeInput(input)
    expect(result.name).toBe('')
    expect(result.content).toBe('hello')
  })

  it('应该处理数组', () => {
    const input = ['<script>', '  hello  ']
    const result = sanitizeInput(input)
    expect(result[0]).toBe('')
    expect(result[1]).toBe('hello')
  })
})

describe('validators', () => {
  it('应该包含常用校验器', () => {
    expect(validators.phone).toBeDefined()
    expect(validators.email).toBeDefined()
    expect(validators.idCard).toBeDefined()
    expect(validators.name).toBeDefined()
    expect(validators.studentId).toBeDefined()
    expect(validators.password).toBeDefined()
    expect(validators.description).toBeDefined()
  })
})
