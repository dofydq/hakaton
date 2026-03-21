import { useAuthStore, type User } from '@/lib/store/auth-store'

const API_BASE = '/api'

interface ApiError {
  status?: 'error'
  message?: string
  detail?: string
  details?: Array<{ field?: string; message?: string }> | string[]
}

interface BackendUser {
  id: number
  email: string
  full_name?: string | null
  phone?: string | null
  specialization?: string | null
  bio?: string | null
  bio_markdown?: string | null
  avatar_url?: string | null
  access_until?: string | null
  role: string
  is_active: boolean
}

interface BackendTest {
  id: number
  title: string
  description?: string | null
  logic_tree_json: Array<{
    title?: string
    questions?: Array<{
      id: string
      title?: string
      text?: string
      type: string
      options?: Array<{
        id: string
        text: string
        points?: number
        value?: number
      }>
    }>
  }>
}

interface BackendLink {
  id: string
  test_id: number
  label: string
  created_at: string
}

interface BackendResultItem {
  id: string
  client_fio?: string
  client_email?: string
  total_points?: number
  detailed_results?: Record<string, number>
  created_at?: string
}

interface PublicSection {
  title?: string
  questions?: Array<{
    id: string
    title?: string
    text?: string
    type: string
    options?: Array<{ id: string; text: string; points?: number }>
  }>
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const json = typeof window !== 'undefined' ? window.atob(padded) : Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function mapRole(role?: string): User['role'] {
  return role === 'admin' ? 'admin' : role === 'pending' ? 'pending' : 'psychologist'
}

function mapStatus(user: BackendUser): User['status'] {
  if (!user.is_active) return 'blocked'
  if (user.role === 'pending') return 'pending'
  return 'active'
}

function mapUser(user: BackendUser): User {
  return {
    id: String(user.id),
    email: user.email,
    name: user.full_name || user.email.split('@')[0],
    role: mapRole(user.role),
    status: mapStatus(user),
    specialization: user.specialization || undefined,
    bio: user.bio || user.bio_markdown || undefined,
    avatar: user.avatar_url || undefined,
    access_until: user.access_until || null,
    created_at: null,
  }
}

function flattenQuestions(logicTree: BackendTest['logic_tree_json'] = []): Question[] {
  return logicTree.flatMap((section) =>
    (section.questions || []).map((question) => ({
      id: question.id,
      text: question.title || question.text || 'Вопрос без названия',
      type: question.type === 'multiple_choice' ? 'multiple' : 'single',
      options: (question.options || []).map((option, index) => ({
        id: option.id,
        text: option.text,
        value: option.points ?? option.value ?? index,
      })),
    })),
  )
}

function buildLogicTree(questions: Question[]): BackendTest['logic_tree_json'] {
  return [
    {
      title: 'Основной раздел',
      questions: questions.map((question) => ({
        id: question.id,
        type: question.type === 'multiple' ? 'multiple_choice' : 'single_choice',
        title: question.text,
        description: '',
        isRequired: true,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          points: option.value,
          weight: 1,
        })),
      })),
    },
  ]
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeQuestions(questions: Array<{ text: string; type: 'single' | 'multiple'; options: Array<{ text: string; value: number }> }>): Question[] {
  return questions.map((question, qIndex) => ({
    id: makeId('q', qIndex),
    text: question.text,
    type: question.type,
    options: question.options.map((option, oIndex) => ({
      id: makeId(`q${qIndex + 1}o`, oIndex),
      text: option.text,
      value: option.value,
    })),
  }))
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'Произошла непредвиденная ошибка'
      try {
        const error: ApiError = await response.json()
        errorMessage =
          error.detail ||
          error.message ||
          (Array.isArray(error.details) && error.details.length > 0
            ? typeof error.details[0] === 'string'
              ? error.details[0]
              : error.details[0]?.message || errorMessage
            : errorMessage)
      } catch {}

      if (response.status === 401) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store',
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: unknown, init?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    const isSearchParams = typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams
    const baseHeaders =
      isFormData || isSearchParams
        ? this.getHeaders()
        : { ...this.getHeaders(), 'Content-Type': 'application/json' }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
      method: 'POST',
      headers: { ...baseHeaders, ...(init?.headers || {}) },
      body: data ? (isFormData || isSearchParams ? data : JSON.stringify(data)) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return this.handleResponse<T>(response)
  }
}

export const api = new ApiClient()

export interface Test {
  id: string
  title: string
  description?: string
  questions: Question[]
  created_at: string
  updated_at: string
  session_count: number
}

export interface Question {
  id: string
  text: string
  type: 'single' | 'multiple'
  options: { id: string; text: string; value: number }[]
}

export interface TestLink {
  id: string
  test_id: string
  test_title: string
  label: string
  url: string
  created_at: string
  submission_count: number
}

export interface TestResult {
  id: string
  test_id: string
  test_title: string
  link_label: string
  client_name?: string
  client_email?: string
  completed_at: string
  scores: Record<string, number>
}

export const authApi = {
  async register(data: {
    email: string
    password: string
    name: string
    specialization?: string
    bio?: string
  }) {
    const payload = {
      email: data.email,
      password: data.password,
      full_name: data.name,
      phone: 'not-provided',
      specialization: data.specialization,
      bio: data.bio,
      bio_markdown: data.bio,
    }
    const user = await api.post<BackendUser>('/auth/register', payload)
    return mapUser(user)
  },

  async login(data: { email: string; password: string }) {
    const formData = new URLSearchParams()
    formData.set('username', data.email)
    formData.set('password', data.password)
    return api.post<{ access_token: string; token_type: string }>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  async me() {
    const user = await api.get<BackendUser>('/users/me')
    return { user: mapUser(user) }
  },

  async bootstrapUser(email: string, token: string) {
    const payload = decodeJwtPayload(token)
    const role = typeof payload?.role === 'string' ? payload.role : 'psychologist'
    return {
      user: {
        id: typeof payload?.sub === 'string' ? payload.sub : 'unknown',
        email,
        name: email.split('@')[0],
        role: mapRole(role),
        status: role === 'pending' ? 'pending' : 'active',
        access_until: null,
        created_at: null,
      } satisfies User,
    }
  },
}

export const testsApi = {
  async list(): Promise<Test[]> {
    const [tests, counts] = await Promise.all([
      api.get<BackendTest[]>('/tests'),
      api.get<Record<string, number>>('/results/counts').catch(() => ({})),
    ])

    return tests.map((test) => ({
      id: String(test.id),
      title: test.title,
      description: test.description || undefined,
      questions: flattenQuestions(test.logic_tree_json),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_count: counts[String(test.id)] || 0,
    }))
  },

  async get(id: string): Promise<Test> {
    const test = await api.get<BackendTest>(`/tests/${id}`)
    return {
      id: String(test.id),
      title: test.title,
      description: test.description || undefined,
      questions: flattenQuestions(test.logic_tree_json),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_count: 0,
    }
  },

  async create(data: Partial<Test> & { questions?: Array<{ text: string; type: 'single' | 'multiple'; options: Array<{ text: string; value: number }> }> }) {
    const questions = data.questions ? normalizeQuestions(data.questions) : data.questions
    const payload = {
      title: data.title || 'Тест без названия',
      description: data.description || '',
      access_settings_json: null,
      report_config: { show_table: true, show_chart: false, show_interpretation: true },
      logic_tree_json: buildLogicTree(questions || []),
      calculation_rules_json: {},
    }
    const created = await api.post<BackendTest>('/tests', payload)
    return this.get(String(created.id))
  },

  async update(id: string, data: Partial<Test>) {
    const payload = {
      title: data.title || 'Тест без названия',
      description: data.description || '',
      access_settings_json: null,
      report_config: { show_table: true, show_chart: false, show_interpretation: true },
      logic_tree_json: buildLogicTree(data.questions || []),
      calculation_rules_json: {},
    }
    const updated = await api.put<BackendTest>(`/tests/${id}`, payload)
    return {
      id: String(updated.id),
      title: updated.title,
      description: updated.description || undefined,
      questions: flattenQuestions(updated.logic_tree_json),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_count: 0,
    }
  },

  delete: (id: string) => api.delete(`/tests/${id}`),
}

export const linksApi = {
  async list(): Promise<TestLink[]> {
    const [links, tests, resultsByTest] = await Promise.all([
      api.get<BackendLink[]>('/links'),
      testsApi.list(),
      api.get<Record<string, number>>('/results/counts').catch(() => ({})),
    ])

    const testsMap = new Map(tests.map((test) => [test.id, test]))
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return links.map((link) => ({
      id: link.id,
      test_id: String(link.test_id),
      test_title: testsMap.get(String(link.test_id))?.title || `Тест #${link.test_id}`,
      label: link.label,
      url: `${appUrl}/test/${link.id}`,
      created_at: link.created_at,
      submission_count: resultsByTest[String(link.test_id)] || 0,
    }))
  },

  create: (data: { test_id: string; label: string }) =>
    api.post<TestLink>('/links', { test_id: Number(data.test_id), label: data.label }),
}

export const resultsApi = {
  async list(params?: { test_id?: string; label?: string }): Promise<TestResult[]> {
    const tests = await testsApi.list()
    const filteredTests = params?.test_id ? tests.filter((test) => test.id === params.test_id) : tests
    const allResults = await Promise.all(
      filteredTests.map(async (test) => {
        const response = await api.get<{ items: BackendResultItem[] }>(`/results/test/${test.id}`)
        return response.items.map((result) => ({
          id: result.id,
          test_id: test.id,
          test_title: test.title,
          link_label: params?.label || 'По умолчанию',
          client_name: result.client_fio || undefined,
          client_email: result.client_email || undefined,
          completed_at: result.created_at || new Date().toISOString(),
          scores: result.detailed_results || {},
        }))
      }),
    )

    const flat = allResults.flat()
    return params?.label ? flat.filter((item) => item.link_label === params.label) : flat
  },

  async counts(): Promise<{ total: number; by_test: Record<string, number> }> {
    const byTest = await api.get<Record<string, number>>('/results/counts')
    const total = Object.values(byTest).reduce((sum, count) => sum + count, 0)
    return { total, by_test: byTest }
  },

  downloadReport: (id: string, type: 'client' | 'prof') =>
    `${API_BASE}/reports/api/results/${id}/report?type=${type}`,
}

export const adminApi = {
  async users(): Promise<User[]> {
    const users = await api.get<BackendUser[]>('/admin/users')
    return users.map(mapUser)
  },

  async updateUser(id: string, data: Partial<User> & { access_until?: string }) {
    return api.patch(`/admin/users/${id}`, {
      is_active: data.status ? data.status !== 'blocked' : undefined,
      role: data.role,
      access_until: data.access_until,
    })
  },

  async stats() {
    const stats = await api.get<{
      total_users: number
      pending_users: number
      total_tests: number
      total_sessions: number
    }>('/admin/stats')

    return {
      total_users: stats.total_users,
      active_users: stats.total_users - stats.pending_users,
      total_tests: stats.total_tests,
      total_sessions: stats.total_sessions,
    }
  },
}

export const profileApi = {
  async update(data: { name: string; specialization?: string; bio?: string }) {
    const updated = await api.patch<BackendUser>('/users/me', {
      full_name: data.name,
      specialization: data.specialization,
      bio: data.bio,
      bio_markdown: data.bio,
    })
    const user = mapUser(updated)
    useAuthStore.getState().setUser(user)
    return user
  },
}

export const publicApi = {
  async getLink(linkId: string) {
    const response = await api.get<{
      title: string
      description?: string
      sections: PublicSection[]
    }>(`/public/links/${linkId}`)

    return {
      test_title: response.title,
      test_description: response.description,
      questions: flattenQuestions(response.sections as BackendTest['logic_tree_json']),
    }
  },

  submit: (data: {
    link_id: string
    answers: Record<string, string | string[]>
    client_name: string
    client_email: string
  }) => api.post<{ message: string; result_id?: string }>('/public/submit', data),
}
