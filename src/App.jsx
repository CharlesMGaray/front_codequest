import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import './auth.css'
import './trail-path.css'
import logoImg from './assets/codequest.png'
import TrailPathView from './components/TrailPathView'
import DedicatedTrilhasPage from './components/DedicatedTrilhasPage'

const TOKEN_KEY = 'codequest_token'
const USER_KEY = 'codequest_user'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

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
    const onPopState = () => {
      const cleanHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard'
      setRoute(cleanHash)
    }
    window.addEventListener('hashchange', onPopState)
    onPopState()
    return () => window.removeEventListener('hashchange', onPopState)
  }, [])

  const go = (nextRoute) => {
    const cleanRoute = nextRoute.replace(/^#\/?/, '')
    window.location.hash = cleanRoute
    setRoute(cleanRoute)
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

    return (
      <AuthenticatedGame
        auth={auth}
        route={route}
        onGo={go}
        onSignOut={signOut}
      />
    )
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

      const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/refresh` : '/api/auth/refresh'
      const response = await fetch(refreshUrl, {
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
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path
  const send = (bearer) =>
    fetch(url, {
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

async function readResponsePayload(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

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

      const payload = await readResponsePayload(response)
      if (!response.ok) {
        throw new Error(payload?.message || fallbackMessage)
      }

      if (!payload) {
        throw new Error('A API respondeu sem dados de autenticacao.')
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

function AuthenticatedGame({ auth, route, onGo, onSignOut }) {
  const [profile, setProfile] = useState(auth.user)
  const [trilhas, setTrilhas] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const reloadGameData = useCallback(async () => {
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
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Servidor backend offline (http://localhost:8080). Inicie o backend com `mvn spring-boot:run`.'
          : err.message,
      )
    }
  }, [auth.token])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      await reloadGameData()
      setLoading(false)
    }
    load()
  }, [reloadGameData])

  const completeLesson = async (lessonId, answers = {}) => {
    setStatus('')

    const response = await request(
      `/api/licoes/${lessonId}/concluir`,
      {
        method: 'POST',
        body: JSON.stringify({ respostas: answers }),
      },
      auth.token,
    )

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || 'Não foi possível concluir a lição.')
    }

    setProfile((current) => ({
      ...current,
      xpTotal: payload.xpTotal,
      nivelAtual: payload.nivelAtual,
    }))
    setStatus(`Lição concluída! +${payload.xpGanho} XP`)

    await reloadGameData()
  }

  const firstIncompleteTrail =
    trilhas.find((t) => t.licoes?.some((l) => !l.concluida)) || trilhas[0]

  // Rota dedicada da trilha: #trilha/:id
  if (route.startsWith('trilha/')) {
    const trailId = route.replace(/^trilha\//, '')
    const selectedTrail = trilhas.find((t) => t.id === trailId) || trilhas[0]

    return (
      <TrailPathView
        trail={selectedTrail}
        profile={profile}
        onGoBack={() => onGo('trilhas')}
        onCompleteLesson={completeLesson}
      />
    )
  }

  // Rota dedicada exclusiva para as trilhas: #trilhas
  if (route === 'trilhas') {
    return (
      <DedicatedTrilhasPage
        profile={profile}
        trilhas={trilhas}
        loading={loading}
        onGoBack={() => onGo('dashboard')}
        onGo={onGo}
      />
    )
  }

  const stats = [
    { label: 'XP total', value: profile?.xpTotal ?? 0 },
    { label: 'Nível atual', value: profile?.nivelAtual ?? 1 },
    { label: 'Trilhas ativas', value: trilhas.length },
    {
      label: 'Lições concluídas',
      value: trilhas.reduce(
        (count, trail) =>
          count + (trail.licoes || []).filter((lesson) => lesson.concluida).length,
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

        <div className="sidebar-actions">
          <button
            className={`btn ghost ${route === 'dashboard' ? 'active' : ''}`}
            onClick={() => onGo('dashboard')}
          >
            🏠 Início
          </button>
          <button
            className="btn ghost"
            onClick={() => onGo('trilhas')}
          >
            🗺️ Trilhas
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (firstIncompleteTrail) {
                onGo(`trilha/${firstIncompleteTrail.id}`)
              }
            }}
          >
            ⚡ Aprender
          </button>
          <button className="btn ghost" onClick={onSignOut}>
            🚪 Sair
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Jornada</p>
            <h2>Dashboard do Jogador</h2>
          </div>
          <div className="topbar-status">
            <div className="topbar-user-chip">
              <div className="topbar-user-avatar">
                {profile?.nome?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{profile?.nome}</span>
                <span className="topbar-user-email">{profile?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {loading ? <p className="message">Carregando conteúdo...</p> : null}
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

        <DashboardHeroView
          profile={profile}
          trilhas={trilhas}
          ranking={ranking}
          firstIncompleteTrail={firstIncompleteTrail}
          onGo={onGo}
        />
      </section>
    </main>
  )
}

/* ========================================================
   DASHBOARD HERO VIEW: Card Atrativo sobre a Plataforma
   ======================================================== */
function DashboardHeroView({
  profile,
  trilhas,
  ranking,
  firstIncompleteTrail,
  onGo,
}) {
  const totalLicoes = trilhas.reduce((acc, t) => acc + (t.licoes?.length || 0), 0)
  const concluidas = trilhas.reduce(
    (acc, t) => acc + (t.licoes?.filter((l) => l.concluida).length || 0),
    0,
  )

  return (
    <section className="content-grid">
      <article className="panel platform-hero-card">
        <div className="hero-card-body">
          <div className="hero-card-headline">
            <h3 className="hero-card-title">
              Domine a programação de forma prática, dinâmica e interativa
            </h3>
            <p className="hero-card-lead">
              O <strong>CodeQuest</strong> é o seu campo de treinamento em computação. Aqui a teoria
              se conecta com quizzes e desafios reais: resolva missões, ganhe experiência (XP),
              avance pelos níveis da trilha e dispute o ranking com outros estudantes.
            </p>
          </div>

          <div className="platform-highlights-grid">
            <div className="highlight-item">
              <span className="highlight-icon">🗺️</span>
              <div>
                <h4>Trilhas em Níveis</h4>
                <p>Navegue por um mapa interativo com lições conceituais organizadas passo a passo.</p>
              </div>
            </div>

            <div className="highlight-item">
              <span className="highlight-icon">📝</span>
              <div>
                <h4>Quizzes com Validação</h4>
                <p>Teste seus conhecimentos com feedback imediato de acerto para fixar o aprendizado.</p>
              </div>
            </div>

            <div className="highlight-item">
              <span className="highlight-icon">⚡</span>
              <div>
                <h4>XP & Ranking</h4>
                <p>Suba de nível a cada lição completada e alcance as primeiras colocações da turma.</p>
              </div>
            </div>
          </div>


          <div className="hero-card-actions">
            <button
              type="button"
              className="btn primary hero-action-btn"
              onClick={() => onGo('trilhas')}
            >
              Ver Trilhas 🗺️
            </button>

            {firstIncompleteTrail && (
              <button
                type="button"
                className="btn ghost hero-action-btn"
                onClick={() => onGo(`trilha/${firstIncompleteTrail.id}`)}
              >
                Continuar: {firstIncompleteTrail.titulo} ⚡
              </button>
            )}
          </div>
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
          {ranking.length === 0 && (
            <p className="message">Nenhum jogador no ranking ainda.</p>
          )}
        </div>
      </aside>
    </section>
  )
}

export default App
