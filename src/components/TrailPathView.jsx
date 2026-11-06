import { useMemo, useState } from 'react'
import DukeMascot from './DukeMascot'
import QuizModal from './QuizModal'

export default function TrailPathView({
  trail,
  profile,
  onGoBack,
  onCompleteLesson,
}) {
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [lockedToast, setLockedToast] = useState('')

  const licoes = useMemo(() => {
    return [...(trail?.licoes || [])].sort((a, b) => a.ordem - b.ordem)
  }, [trail])

  // Determine active level index: first non-completed lesson
  const activeIndex = useMemo(() => {
    const idx = licoes.findIndex((l) => !l.concluida)
    return idx === -1 ? licoes.length : idx
  }, [licoes])

  // Horizontal zig-zag offsets for nodes (alternating pattern)
  const nodeOffsets = useMemo(() => {
    const offsets = [40, 75, 20, -50, -20, 50, -40, 30]
    return licoes.map((_, i) => offsets[i % offsets.length])
  }, [licoes])

  const handleNodeClick = (lesson, status) => {
    if (status === 'locked') {
      setLockedToast('Complete as lições anteriores para desbloquear!')
      setTimeout(() => setLockedToast(''), 3000)
      return
    }

    setSelectedLesson(lesson)
  }

  const handleCompleteAndRefresh = async (lessonId, answers) => {
    await onCompleteLesson(lessonId, answers)
  }

  return (
    <div className="trail-path-screen">
      {/* Space Starry Background */}
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

      {/* Header Bar */}
      <header className="trail-path-topbar">
        <button
          type="button"
          className="trail-back-btn"
          onClick={onGoBack}
          aria-label="Voltar para o dashboard"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="trail-title-wrap">
          <h1 className="trail-heading">
            {trail?.titulo ? trail.titulo.toUpperCase() : 'TRILHA'}
          </h1>
          <span className="sparkle-deco">✨</span>
        </div>

        <div className="trail-topbar-xp">
          <span className="xp-pill">{profile?.xpTotal ?? 0} XP</span>
        </div>
      </header>

      {/* Toast Notification */}
      {lockedToast && (
        <div className="locked-toast" role="alert">
          <span>🔒 {lockedToast}</span>
        </div>
      )}

      {/* Gamified Winding Path */}
      <main className="trail-path-body">
        <div className="trail-canvas">
          {licoes.length === 0 ? (
            <div className="trail-empty">
              <p>Nenhuma lição encontrada para esta trilha.</p>
            </div>
          ) : (
            <div className="trail-nodes-flow">
              {licoes.map((lesson, idx) => {
                const isCompleted = lesson.concluida
                const isActive = idx === activeIndex
                const isLocked = !isCompleted && !isActive
                const status = isCompleted ? 'completed' : isActive ? 'active' : 'locked'
                const xOffset = nodeOffsets[idx]
                const nextOffset = nodeOffsets[idx + 1]
                const hasNext = idx < licoes.length - 1
                const deltaX = hasNext ? nextOffset - xOffset : 0
                const isDukeHere = isActive || (activeIndex === licoes.length && idx === licoes.length - 1)

                return (
                  <div
                    key={lesson.id}
                    className="trail-node-row"
                    style={{ '--offset-x': `${xOffset}px` }}
                  >
                    {/* Connecting Glowing Line to Next Node */}
                    {hasNext && (
                      <svg
                        className="path-connecting-line"
                        viewBox="0 0 300 150"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <line
                          x1={150}
                          y1={15}
                          x2={150 + deltaX}
                          y2={150}
                          stroke="rgba(199, 210, 254, 0.75)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <line
                          x1={150}
                          y1={15}
                          x2={150 + deltaX}
                          y2={150}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="4 6"
                          opacity="0.9"
                        />
                      </svg>
                    )}

                    {/* Node Circle Button */}
                    <div className="node-wrapper">
                      <button
                        type="button"
                        className={`path-node-btn node-${status}`}
                        onClick={() => handleNodeClick(lesson, status)}
                        aria-label={`Lição ${lesson.ordem}: ${lesson.titulo} - ${
                          isCompleted ? 'Concluída' : isActive ? 'Atual' : 'Bloqueada'
                        }`}
                      >
                        <div className="node-top-gloss" />
                        <div className="node-content">
                          {isCompleted ? (
                            <span className="node-star" aria-hidden="true">★</span>
                          ) : isLocked ? (
                            <svg
                              className="node-lock-icon"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                          ) : (
                            <span className="node-number">{lesson.ordem}</span>
                          )}
                        </div>

                        {/* Sparkles on completed nodes */}
                        {isCompleted && (
                          <div className="node-sparkles" aria-hidden="true">
                            <span className="sparkle sp-1">✦</span>
                            <span className="sparkle sp-2">✦</span>
                          </div>
                        )}
                      </button>

                      {/* Duke Mascot next to the Active Level */}
                      {isDukeHere && (
                        <div
                          className={`duke-companion-container ${
                            xOffset > 25 ? 'duke-left' : 'duke-right'
                          }`}
                        >
                          <DukeMascot className="duke-active-mascot" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quiz Modal */}
      {selectedLesson && (
        <QuizModal
          lesson={selectedLesson}
          isCompleted={selectedLesson.concluida}
          onClose={() => setSelectedLesson(null)}
          onComplete={handleCompleteAndRefresh}
        />
      )}
    </div>
  )
}
