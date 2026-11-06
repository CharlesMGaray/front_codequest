export default function DedicatedTrilhasPage({
  profile,
  trilhas,
  loading,
  onGoBack,
  onGo,
}) {
  const totalLessons = trilhas.reduce(
    (acc, t) => acc + (t.licoes?.length || 0),
    0,
  )
  const completedLessons = trilhas.reduce(
    (acc, t) => acc + (t.licoes?.filter((l) => l.concluida).length || 0),
    0,
  )
  const totalXpAvailable = trilhas.reduce(
    (acc, t) =>
      acc +
      (t.licoes?.reduce((sum, l) => sum + (l.xpBonus || 0), 0) || 0),
    0,
  )

  return (
    <div className="dedicated-trilhas-screen">
      {/* Fundo Cósmico Estrelado */}
      <div className="cosmic-stars-layer" aria-hidden="true">
        <div className="star star-1" />
        <div className="star star-2" />
        <div className="star star-3" />
        <div className="star star-4" />
        <div className="star star-5" />
        <div className="star star-6" />
        <div className="star star-7" />
        <div className="star star-8" />
      </div>

      {/* Topbar Dedicada */}
      <header className="dedicated-trilhas-topbar">
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={onGoBack}
          aria-label="Voltar para o Dashboard"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Dashboard</span>
        </button>

        <div className="trail-title-wrap">
          <h1 className="trail-heading">TRILHAS DE APRENDIZADO</h1>
          <span className="sparkle-deco">✨</span>
        </div>

        <div className="trail-topbar-xp">
          <span className="xp-pill">
            Nível {profile?.nivelAtual ?? 1} • {profile?.xpTotal ?? 0} XP
          </span>
        </div>
      </header>

      {/* Conteúdo Central da Rota Dedicada */}
      <main className="dedicated-trilhas-container">
        {/* Banner Informativo */}
        <section className="dedicated-trilhas-hero">
          <div className="hero-text-block">
            <span className="eyebrow">ROTA DE PROGRESSÃO</span>
            <h2>Escolha uma trilha e comece os quizzes</h2>
            <p>
              Cada trilha é uma aventura com mapa em zigue-zague, conteúdos teóricos e
              perguntas de múltipla escolha para validar seu conhecimento e ganhar XP.
            </p>
          </div>

          <div className="dedicated-stats-row">
            <div className="mini-stat-badge">
              <span>Trilhas</span>
              <strong>{trilhas.length}</strong>
            </div>
            <div className="mini-stat-badge">
              <span>Lições</span>
              <strong>{completedLessons} / {totalLessons}</strong>
            </div>
            <div className="mini-stat-badge">
              <span>XP Disponível</span>
              <strong className="text-gold">+{totalXpAvailable} XP</strong>
            </div>
          </div>
        </section>

        {loading && <p className="message">Carregando trilhas...</p>}

        {/* Lista de Trilhas com Início do Quiz */}
        <section className="dedicated-trails-list">
          {trilhas.map((trail, index) => {
            const lessons = trail.licoes || []
            const total = lessons.length
            const doneCount = lessons.filter((l) => l.concluida).length
            const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0
            const trailXp = lessons.reduce((sum, l) => sum + (l.xpBonus || 0), 0)
            const isAllCompleted = doneCount === total && total > 0

            return (
              <article className="trail-card dedicated-card" key={trail.id}>
                <div className="trail-card-header">
                  <div
                    className={`trail-card-icon-badge ${
                      isAllCompleted ? 'done' : ''
                    }`}
                  >
                    {isAllCompleted
                      ? '⭐'
                      : index === 0
                      ? '💻'
                      : index === 1
                      ? '🌐'
                      : '⚡'}
                  </div>

                  <div className="trail-card-info">
                    <div className="trail-card-tags">
                      <span className="trail-tag">
                        Trilha #{trail.ordem || index + 1}
                      </span>
                      <span className="trail-tag xp">+{trailXp} XP</span>
                      {isAllCompleted && (
                        <span className="trail-tag done">Concluída ⭐</span>
                      )}
                    </div>
                    <h3 className="trail-card-title">{trail.titulo}</h3>
                    <p className="trail-card-desc">{trail.descricao}</p>
                  </div>
                </div>

                <div className="trail-card-footer">
                  <div className="trail-progress-container">
                    <div className="trail-progress-labels">
                      <span>Progresso da Trilha</span>
                      <strong>
                        {doneCount} de {total} lições ({percent}%)
                      </strong>
                    </div>
                    <div className="trail-progress-bar">
                      <div
                        className="trail-progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn primary trail-card-btn"
                    onClick={() => onGo(`trilha/${trail.id}`)}
                  >
                    {doneCount === 0
                      ? 'Iniciar Trilha & Quiz'
                      : isAllCompleted
                      ? 'Revisar Níveis'
                      : 'Continuar Trilha & Quiz'}{' '}
                    🚀 →
                  </button>
                </div>
              </article>
            )
          })}

          {trilhas.length === 0 && !loading && (
            <p className="message">Nenhuma trilha encontrada.</p>
          )}
        </section>
      </main>
    </div>
  )
}

