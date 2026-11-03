import { useEffect, useMemo, useState } from 'react'
import './App.css'
import './auth.css'
import logoImg from './assets/codequest.png'

const TOKEN_KEY = 'codequest_token'
const USER_KEY = 'codequest_user'

const defaultRegisterForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'ALUNO',
}

const emptyAuth = {
  token: null,
  user: null,
}

function App() {
  const [route, setRoute] = useState('dashboard')
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)
    return {
      token,
      user: user ? JSON.parse(user) : null,
    }
  })

  useEffect(() => {
    const onPopState = () => setRoute(window.location.hash.replace('#', '') || 'dashboard')
    window.addEventListener('hashchange', onPopState)
    onPopState()
    return () => window.removeEventListener('hashchange', onPopState)
  }, [])

  const go = (nextRoute) => {
    window.location.hash = nextRoute
    setRoute(nextRoute)
  }

  const signIn = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data))
    setAuth({ token: data.token, user: data })
    go('dashboard')
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuth(emptyAuth)
    go('login')
  }

  useEffect(() => {
    const onSession = (event) => setAuth({ token: event.detail.token, user: event.detail })
    const onLogout = () => signOut()
    window.addEventListener('codequest:session', onSession)
    window.addEventListener('codequest:logout', onLogout)
    return () => {
      window.removeEventListener('codequest:session', onSession)
      window.removeEventListener('codequest:logout', onLogout)
    }
  }, [])

  const page = useMemo(() => {
    if (!auth.token) {
      if (route === 'register') {
        return <RegisterPage onGo={go} onSignedIn={signIn} />
      }

      return <LoginPage onGo={go} onSignedIn={signIn} />
    }

    return <DashboardPage auth={auth} onSignOut={signOut} />
  }, [auth, route])

  return <div className="app-shell">{page}</div>
}

let refreshInFlight = null

// O token do Firebase expira em 1h: renova com o refreshToken salvo no login.
function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
      if (!stored?.refreshToken) return null

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      })
      if (!response.ok) return null

      const data = await response.json()
      const user = { ...stored, token: data.token, refreshToken: data.refreshToken }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      window.dispatchEvent(new CustomEvent('codequest:session', { detail: user }))
      return data.token
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function request(path, options = {}, token) {
  const send = (bearer) =>
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
    })

  const response = await send(token)
  if (response.status !== 401 || !token) return response

  const newToken = await refreshSession().catch(() => null)
  if (!newToken) {
    window.dispatchEvent(new Event('codequest:logout'))
    return response
  }
  return send(newToken)
}

const perfis = [
  { value: 'ALUNO', label: 'Aluno', hint: 'Aprenda nas trilhas e ganhe XP' },
  { value: 'PROFESSOR', label: 'Professor', hint: 'Acompanhe a evolução da turma' },
  { value: 'ADMIN', label: 'Admin', hint: 'Gerencie a plataforma' },
]

function BrandMark() {
  return (
    <div className="brand-mark">
      <svg className="brand-mark-icon" viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 3.5 41.8 13.75v20.5L24 44.5 6.2 34.25v-20.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="m19 18-6 6 6 6M29 18l6 6-6 6M26.5 15.5l-5 17"
          fill="none"
          stroke="#eef3ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="brand-mark-text">
        Code<span>Quest</span>
      </span>
    </div>
  )
}

function AuthLayout({ children }) {
  return (
    <main className="auth">
      <aside className="auth-art" aria-hidden="true">
        <img src={logoImg} alt="" className="auth-art-image" />
        <ul className="auth-art-points">
          <li><span><strong>Jogue</strong> desafios e missões</span></li>
          <li><span><strong>Suba de nível</strong> com XP a cada lição</span></li>
          <li><span><strong>Dispute</strong> o ranking com a turma</span></li>
        </ul>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </main>
  )
}

function PasswordField({ value, onChange, placeholder, autoComplete, hint }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span className="field-label">Senha</span>
      <span className="field-control has-action">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={hint ? 6 : undefined}
          required
        />
        <button
          type="button"
          className="field-action"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </span>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

function useAuthSubmit(path, form, onSignedIn, fallbackMessage) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await request(path, {
        method: 'POST',
        body: JSON.stringify(form),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message || fallbackMessage)
      }

      onSignedIn(payload)
    } catch (error) {
      setStatus(error.message === 'Failed to fetch' ? 'Servidor indisponível. Tente novamente.' : error.message)
    } finally {
      setLoading(false)
    }
  }

  return { submit, status, loading }
}

function LoginPage({ onGo, onSignedIn }) {
  const [form, setForm] = useState({ email: '', senha: '' })
  const { submit, status, loading } = useAuthSubmit(
    '/api/auth/login',
    form,
    onSignedIn,
    'Não foi possível fazer login.',
  )

  return (
    <AuthLayout>
      <BrandMark />
      <header className="auth-head">
        <h1>Bem-vindo de volta</h1>
        <p>Acesse suas trilhas, veja seu ranking e continue sua evolução.</p>
      </header>

      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Email</span>
          <span className="field-control">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <PasswordField
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          placeholder="Sua senha"
          autoComplete="current-password"
        />

        {status ? <p className="auth-alert" role="alert">{status}</p> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-switch">
        Não tem conta?
        <button type="button" className="auth-link" onClick={() => onGo('register')}>
          Criar conta
        </button>
      </p>
    </AuthLayout>
  )
}

function RegisterPage({ onGo, onSignedIn }) {
  const [form, setForm] = useState(defaultRegisterForm)
  const { submit, status, loading } = useAuthSubmit(
    '/api/auth/registrar',
    form,
    onSignedIn,
    'Não foi possível criar a conta.',
  )

  return (
    <AuthLayout>
      <BrandMark />
      <header className="auth-head">
        <h1>Comece sua jornada</h1>
        <p>Crie sua conta e dê o primeiro passo na trilha inicial.</p>
      </header>

      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Nome</span>
          <span className="field-control">
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Como quer ser chamado"
              autoComplete="name"
              maxLength={100}
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <span className="field-control">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <PasswordField
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          placeholder="Crie uma senha"
          autoComplete="new-password"
          hint="Mínimo de 6 caracteres."
        />

        <fieldset className="field">
          <legend className="field-label">Perfil</legend>
          <div className="role-options">
            {perfis.map((perfil) => (
              <label
                key={perfil.value}
                className={`role-option ${form.perfil === perfil.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="perfil"
                  value={perfil.value}
                  checked={form.perfil === perfil.value}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                />
                <span className="role-name">{perfil.label}</span>
                <span className="role-hint">{perfil.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {status ? <p className="auth-alert" role="alert">{status}</p> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="auth-switch">
        Já tem conta?
        <button type="button" className="auth-link" onClick={() => onGo('login')}>
          Entrar
        </button>
      </p>
    </AuthLayout>
  )
}

function DashboardPage({ auth, onSignOut }) {
  const [profile, setProfile] = useState(auth.user)
  const [trilhas, setTrilhas] = useState([])
  const [ranking, setRanking] = useState([])
  const [selectedTrailId, setSelectedTrailId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const selectedTrail = trilhas.find((item) => item.id === selectedTrailId) || trilhas[0] || null

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const [profileRes, trailsRes, rankingRes] = await Promise.all([
          request('/api/auth/me', {}, auth.token),
          request('/api/trilhas', {}, auth.token),
          request('/api/ranking?limite=10', {}, auth.token),
        ])

        const [profileData, trailsData, rankingData] = await Promise.all([
          profileRes.json(),
          trailsRes.json(),
          rankingRes.json(),
        ])

        if (!profileRes.ok) throw new Error(profileData?.message || 'Falha ao carregar perfil.')
        if (!trailsRes.ok) throw new Error(trailsData?.message || 'Falha ao carregar trilhas.')
        if (!rankingRes.ok) throw new Error(rankingData?.message || 'Falha ao carregar ranking.')

        setProfile(profileData)
        setTrilhas(trailsData)
        setRanking(rankingData)
        setSelectedTrailId(trailsData[0]?.id ?? null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [auth.token])

  const completeLesson = async (lessonId) => {
    setStatus('')

    try {
      const response = await request(`/api/licoes/${lessonId}/concluir`, {
        method: 'POST',
      }, auth.token)

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Nao foi possivel concluir a licao.')
      }

      setProfile((current) => ({
        ...current,
        xpTotal: payload.xpTotal,
        nivelAtual: payload.nivelAtual,
      }))
      setStatus(`Licao concluida. +${payload.xpGanho} XP`)

      const [trailsRes, rankingRes] = await Promise.all([
        request('/api/trilhas', {}, auth.token),
        request('/api/ranking?limite=10', {}, auth.token),
      ])

      setTrilhas(await trailsRes.json())
      setRanking(await rankingRes.json())
    } catch (err) {
      setStatus(err.message)
    }
  }

  const stats = [
    { label: 'XP total', value: profile?.xpTotal ?? 0 },
    { label: 'Nivel atual', value: profile?.nivelAtual ?? 1 },
    { label: 'Trilhas', value: trilhas.length },
    {
      label: 'Licoes concluidas',
      value: trilhas.reduce(
        (count, trail) =>
          count + trail.licoes.filter((lesson) => lesson.concluida).length,
        0,
      ),
    },
  ]

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand-row compact">
          <img src={logoImg} alt="CodeQuest" className="brand-logo" />
          <div>
            <p className="eyebrow">CodeQuest</p>
            <h1>Plataforma</h1>
          </div>
        </div>

        <div className="profile-card">
          <p className="profile-name">{profile?.nome}</p>
          <p className="profile-meta">{profile?.email}</p>
          <div className="profile-badges">
            <span>Perfil: {profile?.perfil}</span>
            <span>XP: {profile?.xpTotal ?? 0}</span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="btn ghost" onClick={() => setSelectedTrailId(trilhas[0]?.id ?? null)}>
            Trilhas
          </button>
          <button className="btn ghost" onClick={() => setSelectedTrailId(trilhas[0]?.id ?? null)}>
            Aprender
          </button>
          <button className="btn ghost" onClick={onSignOut}>
            Sair
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Jornada</p>
            <h2>Dashboard de aprendizado</h2>
          </div>
          <div className="topbar-status">
            <span>Nivel {profile?.nivelAtual ?? 1}</span>
            <span>{profile?.xpTotal ?? 0} XP</span>
          </div>
        </header>

        {loading ? <p className="message">Carregando conteudo...</p> : null}
        {error ? <p className="message error">{error}</p> : null}
        {status ? <p className="message success">{status}</p> : null}

        <section className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel lessons-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Trilhas</p>
                <h3>{selectedTrail?.titulo || 'Nenhuma trilha'}</h3>
              </div>
              <div className="trail-picker">
                {trilhas.map((trail) => (
                  <button
                    key={trail.id}
                    className={`chip ${trail.id === selectedTrail?.id ? 'active' : ''}`}
                    onClick={() => setSelectedTrailId(trail.id)}
                  >
                    {trail.titulo}
                  </button>
                ))}
              </div>
            </div>

            <p className="panel-copy">{selectedTrail?.descricao}</p>

            <div className="lesson-list">
              {selectedTrail?.licoes?.map((lesson) => (
                <article className="lesson-card" key={lesson.id}>
                  <div>
                    <p className="lesson-title">
                      {lesson.ordem}. {lesson.titulo}
                    </p>
                    <p className="lesson-meta">
                      {lesson.xpBonus} XP - {lesson.perguntas.length} perguntas
                    </p>
                  </div>
                  <p className="lesson-summary">{lesson.resumo}</p>
                  <div className="lesson-actions">
                    <span className={`pill ${lesson.concluida ? 'done' : ''}`}>
                      {lesson.concluida ? 'Concluida' : 'Disponivel'}
                    </span>
                    <button
                      className="btn primary small"
                      onClick={() => completeLesson(lesson.id)}
                      disabled={lesson.concluida}
                    >
                      {lesson.concluida ? 'Feita' : 'Concluir'}
                    </button>
                  </div>

                  <details className="quiz-block">
                    <summary>Ver quiz</summary>
                    {lesson.perguntas.map((question) => (
                      <div key={question.id} className="quiz-card">
                        <p className="question">{question.enunciado}</p>
                        <ul className="options">
                          {question.opcoes.map((option) => (
                            <li key={option.id}>{option.texto}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </details>
                </article>
              ))}
            </div>
          </article>

          <aside className="panel ranking-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Ranking</p>
                <h3>Top jogadores</h3>
              </div>
            </div>

            <div className="ranking-list">
              {ranking.map((row) => (
                <div className="ranking-row" key={row.usuarioId}>
                  <div>
                    <strong>#{row.posicao}</strong>
                    <p>{row.nome}</p>
                  </div>
                  <span>{row.xpTotal} XP</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}

export default App
