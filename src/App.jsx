import { useEffect, useMemo, useState } from 'react'
import './App.css'
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

function request(path, options = {}, token) {
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

function LoginPage({ onGo, onSignedIn }) {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Nao foi possivel fazer login.')
      }

      onSignedIn(payload)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="auth-screen login-screen"
      style={{ '--hero-image': `url(${logoImg})` }}
    >
      <section className="auth-panel">
        <div className="brand-row">
          <img src={logoImg} alt="CodeQuest" className="brand-logo" />
          <div>
            <p className="eyebrow">CodeQuest</p>
            <h1>Login</h1>
          </div>
        </div>

        <p className="subcopy">
          Acesse suas trilhas, veja seu ranking e continue sua evolucao.
        </p>

        <form className="form-stack" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@exemplo.com"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Sua senha"
              required
            />
          </label>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Nao tem conta?</span>
          <button className="link-button" onClick={() => onGo('register')}>
            Criar conta
          </button>
        </div>

        {status ? <p className="message error">{status}</p> : null}
      </section>
    </main>
  )
}

function RegisterPage({ onGo, onSignedIn }) {
  const [form, setForm] = useState(defaultRegisterForm)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await request('/api/auth/registrar', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Nao foi possivel criar a conta.')
      }

      onSignedIn(payload)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel wide">
        <div className="brand-row">
          <img src={logoImg} alt="CodeQuest" className="brand-logo" />
          <div>
            <p className="eyebrow">CodeQuest</p>
            <h1>Criar conta</h1>
          </div>
        </div>

        <p className="subcopy">
          Entre na plataforma e comece pela trilha inicial.
        </p>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Nome
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Seu nome"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@exemplo.com"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="Crie uma senha"
              required
            />
          </label>

          <label>
            Perfil
            <select
              value={form.perfil}
              onChange={(e) => setForm({ ...form, perfil: e.target.value })}
            >
              <option value="ALUNO">Aluno</option>
              <option value="PROFESSOR">Professor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Ja tem conta?</span>
          <button className="link-button" onClick={() => onGo('login')}>
            Entrar
          </button>
        </div>

        {status ? <p className="message error">{status}</p> : null}
      </section>
    </main>
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
