import { useState } from 'react'
import DukeMascot from './DukeMascot'

export default function QuizModal({ lesson, isCompleted, onClose, onComplete }) {
  const perguntas = lesson?.perguntas || []
  const [stage, setStage] = useState('intro') // 'intro' | 'quiz' | 'celebration'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [verifiedMap, setVerifiedMap] = useState({}) // { [qId]: { isCorrect: boolean, optionId: string } }
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentQ = perguntas[currentIdx] || null
  const selectedOptionId = currentQ ? answers[currentQ.id] : null
  const currentVerification = currentQ ? verifiedMap[currentQ.id] : null
  const isCurrentVerifiedCorrect = isCompleted || Boolean(currentVerification?.isCorrect)

  const handleSelectOption = (optionId) => {
    if (!currentQ || isCompleted) return

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }))

    // Reset verification if the question was previously marked wrong
    if (currentVerification && !currentVerification.isCorrect) {
      setVerifiedMap((prev) => {
        const next = { ...prev }
        delete next[currentQ.id]
        return next
      })
    }
  }

  const handleVerify = () => {
    if (!currentQ || !selectedOptionId) return

    const chosenOption = currentQ.opcoes.find((o) => o.id === selectedOptionId)
    const isCorrect = Boolean(chosenOption?.correta)

    setVerifiedMap((prev) => ({
      ...prev,
      [currentQ.id]: {
        isCorrect,
        optionId: selectedOptionId,
      },
    }))
  }

  const handleNext = () => {
    if (currentIdx < perguntas.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  const handleFinish = async () => {
    if (isCompleted) {
      onClose()
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      await onComplete(lesson.id, answers)
      setStage('celebration')
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao concluir lição.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLastQuestion = currentIdx === perguntas.length - 1 || perguntas.length === 0

  return (
    <div className="quiz-backdrop" onClick={onClose}>
      <div
        className="quiz-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ========================================================
            ETAPA 3: CELEBRAÇÃO / SUCESSO
           ======================================================== */}
        {stage === 'celebration' && (
          <div className="quiz-celebration">
            <div className="celebration-badge">⭐</div>
            <h2>Nível Concluído!</h2>
            <p className="celebration-sub">
              Você completou a lição <strong>{lesson.titulo}</strong> e acertou todas as perguntas!
            </p>
            <div className="celebration-xp">
              <span>+{lesson.xpBonus || 50} XP</span>
            </div>
            <button
              type="button"
              className="btn primary celebration-btn"
              onClick={onClose}
            >
              Continuar Jornada 🚀
            </button>
          </div>
        )}

        {/* ========================================================
            ETAPA 1: TEXTO INTRODUTÓRIO & RESUMO
           ======================================================== */}
        {stage === 'intro' && (
          <>
            <header className="quiz-modal-header">
              <div className="quiz-header-info">
                <span className="quiz-badge">
                  {isCompleted ? '⭐ Nível Concluído' : `Nível ${lesson.ordem} • Introdução`}
                </span>
                <h3>{lesson.titulo}</h3>
              </div>
              <button
                type="button"
                className="quiz-close-btn"
                onClick={onClose}
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            <div className="quiz-content intro-content-scroll">
              <div className="intro-companion-banner">
                <div className="intro-mascot-box">
                  <DukeMascot className="intro-duke" />
                </div>
                <div className="intro-speech-card">
                  <span className="speech-title">Instruções da Missão</span>
                  <p className="speech-text">
                    Leia o resumo conceitual abaixo com atenção antes de responder às questões.
                  </p>
                </div>
              </div>

              <div className="intro-theory-card">
                <div className="theory-header">
                  <span className="theory-icon">📖</span>
                  <h4>Conteúdo da Lição</h4>
                </div>
                <p className="theory-text">
                  {lesson.resumo ||
                    'Nesta lição você aplicará os conceitos fundamentais para avançar na sua jornada de programação.'}
                </p>
              </div>

              <div className="intro-meta-grid">
                <div className="intro-meta-item">
                  <span className="meta-icon">🎯</span>
                  <div>
                    <strong>{perguntas.length} {perguntas.length === 1 ? 'questão' : 'questões'}</strong>
                    <p>Múltipla escolha</p>
                  </div>
                </div>
                <div className="intro-meta-item">
                  <span className="meta-icon">⚡</span>
                  <div>
                    <strong>+{lesson.xpBonus || 50} XP</strong>
                    <p>Recompensa</p>
                  </div>
                </div>
              </div>

              {errorMsg && <p className="message error">{errorMsg}</p>}
            </div>

            <footer className="quiz-modal-footer">
              <button
                type="button"
                className="btn ghost small"
                onClick={onClose}
              >
                Voltar
              </button>

              {perguntas.length > 0 ? (
                <button
                  type="button"
                  className="btn primary small btn-go-quiz"
                  onClick={() => setStage('quiz')}
                >
                  Ir para o Quiz →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn primary small"
                  onClick={handleFinish}
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : `Concluir Nível (+${lesson.xpBonus || 50} XP)`}
                </button>
              )}
            </footer>
          </>
        )}

        {/* ========================================================
            ETAPA 2: QUESTÕES DE MÚLTIPLA ESCOLHA (QUIZ)
           ======================================================== */}
        {stage === 'quiz' && (
          <>
            <header className="quiz-modal-header">
              <div className="quiz-header-info">
                <div className="quiz-header-row">
                  <button
                    type="button"
                    className="btn-back-theory-link"
                    onClick={() => setStage('intro')}
                    title="Voltar e reler o conteúdo teórico"
                  >
                    📖 Ver Introdução
                  </button>
                  <span className="quiz-badge">
                    Questão {currentIdx + 1}/{perguntas.length}
                  </span>
                </div>
                <h3>{lesson.titulo}</h3>
              </div>
              <button
                type="button"
                className="quiz-close-btn"
                onClick={onClose}
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            {perguntas.length > 0 && (
              <div className="quiz-progress-wrap">
                <div className="quiz-progress-text">
                  <span>
                    Pergunta {currentIdx + 1} de {perguntas.length}
                  </span>
                  <span>
                    {Math.round(((currentIdx + 1) / perguntas.length) * 100)}%
                  </span>
                </div>
                <div className="quiz-progress-bar">
                  <div
                    className="quiz-progress-fill"
                    style={{
                      width: `${((currentIdx + 1) / perguntas.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="quiz-content">
              {currentQ ? (
                <div className="quiz-question-block">
                  <p className="quiz-enunciado">{currentQ.enunciado}</p>

                  <div className="quiz-options-list">
                    {currentQ.opcoes.map((opcao, idx) => {
                      const letter = String.fromCharCode(65 + idx)
                      const isSelected = selectedOptionId === opcao.id
                      const isOptionVerified =
                        currentVerification?.optionId === opcao.id

                      let statusClass = ''
                      if (isCompleted && opcao.correta) {
                        statusClass = 'correct'
                      } else if (isOptionVerified) {
                        statusClass = currentVerification.isCorrect
                          ? 'correct'
                          : 'wrong'
                      } else if (isSelected) {
                        statusClass = 'selected'
                      }

                      return (
                        <button
                          key={opcao.id}
                          type="button"
                          className={`quiz-option-btn ${statusClass}`}
                          onClick={() => handleSelectOption(opcao.id)}
                          disabled={isCompleted || isCurrentVerifiedCorrect}
                        >
                          <span className="option-letter">{letter}</span>
                          <span className="option-text">{opcao.texto}</span>
                          <span className="option-status-icon">
                            {statusClass === 'correct' ? (
                              '✓'
                            ) : statusClass === 'wrong' ? (
                              '✕'
                            ) : (
                              <span className="option-radio" />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Feedback Banner */}
                  {currentVerification && (
                    <div
                      className={`quiz-feedback-box ${
                        currentVerification.isCorrect ? 'correct' : 'wrong'
                      }`}
                    >
                      {currentVerification.isCorrect ? (
                        <p>🎉 <strong>Muito bem!</strong> Resposta correta!</p>
                      ) : (
                        <p>❌ <strong>Ops! Resposta incorreta.</strong> Escolha outra opção e tente novamente!</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="quiz-empty-block">
                  <p className="lesson-summary">
                    {lesson.resumo || 'Lição prática sem quiz.'}
                  </p>
                </div>
              )}

              {errorMsg && <p className="message error">{errorMsg}</p>}
            </div>

            <footer className="quiz-modal-footer">
              {currentIdx > 0 ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={handlePrev}
                  disabled={submitting}
                >
                  ← Anterior
                </button>
              ) : (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setStage('intro')}
                >
                  ← Teoria
                </button>
              )}

              {/* Action Buttons: Verify vs Next vs Finish */}
              {isCompleted ? (
                !isLastQuestion ? (
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={handleNext}
                  >
                    Próxima →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                )
              ) : !isCurrentVerifiedCorrect && perguntas.length > 0 ? (
                <button
                  type="button"
                  className="btn primary small btn-verify"
                  onClick={handleVerify}
                  disabled={!selectedOptionId || submitting}
                >
                  Verificar Resposta ✨
                </button>
              ) : !isLastQuestion ? (
                <button
                  type="button"
                  className="btn primary small"
                  onClick={handleNext}
                  disabled={submitting}
                >
                  Próxima →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn primary small"
                  onClick={handleFinish}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Salvando...'
                    : `Concluir Nível (+${lesson.xpBonus || 50} XP)`}
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
