import { useState } from 'react'
import DukeMascot from './DukeMascot'

export default function QuizModal({
  lesson,
  isCompleted,
  skillProgress,
  onClose,
  onAnswer,
  onComplete,
}) {
  const [perguntas] = useState(() => {
    const questions = [...(lesson?.perguntas || [])]
    const mastery = skillProgress?.dominio ?? 50
    if (mastery < 60) {
      return questions.sort((a, b) => (a.dificuldade || 1) - (b.dificuldade || 1))
    }
    if (mastery >= 80) {
      return questions.sort((a, b) => (b.dificuldade || 1) - (a.dificuldade || 1))
    }
    return questions
  })
  const [stage, setStage] = useState('intro') // 'intro' | 'quiz' | 'celebration'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(perguntas.filter((question) => question.ultimaOpcaoId)
      .map((question) => [question.id, question.ultimaOpcaoId])),
  )
  const [verifiedMap, setVerifiedMap] = useState(() =>
    Object.fromEntries(perguntas.filter((question) => question.tentativasUsadas > 0)
      .map((question) => [question.id, {
        isCorrect: Boolean(question.ultimaCorreta),
        resolvida: question.resolvida,
        optionId: question.ultimaOpcaoId,
        tentativaQuestao: question.tentativasUsadas,
        dica: question.dicaAtual,
        explicacao: question.explicacao,
        alternativaCorretaId: question.alternativaCorretaId,
      }])),
  )
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentQ = perguntas[currentIdx] || null
  const selectedOptionId = currentQ ? answers[currentQ.id] : null
  const currentVerification = currentQ ? verifiedMap[currentQ.id] : null
  const isCurrentResolved = isCompleted || Boolean(currentVerification?.resolvida)

  const getAttemptXpMultiplier = (attemptNumber) => {
    if (!attemptNumber) return 0
    if (attemptNumber === 1) return 1
    if (attemptNumber === 2) return 0.6
    if (attemptNumber === 3) return 0.3
    return 0
  }

  const getXpRewardForAttempt = (attemptNumber, isCorrect) => {
    if (!isCorrect) return 0
    const baseXp = lesson?.xpBonus || 50
    return Math.round(baseXp * getAttemptXpMultiplier(attemptNumber))
  }

  const xpEarned = perguntas.reduce((total, question) => {
    const verification = verifiedMap[question.id]
    return total + (verification
      ? getXpRewardForAttempt(verification.tentativaQuestao, verification.isCorrect)
      : 0)
  }, 0)
  const maxXp = (lesson?.xpBonus || 50) * perguntas.length
  const masteryPercent = maxXp > 0 ? Math.round((xpEarned / maxXp) * 100) : 0
  const masteryTier = masteryPercent >= 80
    ? 'Difícil'
    : masteryPercent >= 60
    ? 'Médio'
    : 'Fácil'

  const handleSelectOption = (optionId) => {
    if (!currentQ || isCurrentResolved) return

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }))

  }

  const handleVerify = async () => {
    if (!currentQ || !selectedOptionId || isCurrentResolved) return

    setSubmitting(true)
    setErrorMsg('')
    try {
      const attemptNumber = (currentVerification?.tentativaQuestao || 0) + 1
      const result = await onAnswer(lesson.id, currentQ.id, selectedOptionId, attemptNumber)
      setVerifiedMap((prev) => ({
        ...prev,
        [currentQ.id]: {
          isCorrect: result.correta,
          resolvida: result.resolvida,
          optionId: selectedOptionId,
          masteryScore: result.dominio,
          masteryLevel: result.nivelDominio,
          reviewDays: result.diasAteRevisao,
          tentativaQuestao: result.tentativaQuestao,
          dica: result.dica,
          explicacao: result.explicacao,
          alternativaCorretaId: result.alternativaCorretaId,
        },
      }))
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível registrar a resposta.')
    } finally {
      setSubmitting(false)
    }
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
              Você completou a lição <strong>{lesson.titulo}</strong>.
            </p>
            <div className="celebration-xp">
              <span>+{xpEarned} XP</span>
            </div>
            <p className="celebration-mastery">
              Domínio calculado pelo XP acumulado: <strong>{masteryPercent}%</strong>
            </p>
            <div className="mastery-levels" aria-label={`Nível de domínio: ${masteryTier}`}>
              {[
                { label: 'Fácil', range: '0–59%' },
                { label: 'Médio', range: '60–79%' },
                { label: 'Difícil', range: '80–100%' },
              ].map((level) => (
                <div
                  key={level.label}
                  className={`mastery-level${masteryTier === level.label ? ' active' : ''}`}
                  aria-current={masteryTier === level.label ? 'step' : undefined}
                >
                  <strong>{level.label}</strong>
                  <span>{level.range}</span>
                </div>
              ))}
            </div>
            <p className="mastery-current-level">
              Seu nível nesta lição: <strong>{masteryTier}</strong>
            </p>
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

              <div className="adaptive-quiz-guidance">
                <strong>Desafios e XP</strong>
                <p>
                  Responda cada questão para avançar na trilha e acumular XP conforme a tentativa correta.
                </p>
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
                    {currentQ?.dificuldade ? ` • Desafio ${currentQ.dificuldade}` : ''}
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
                      if ((isCompleted && opcao.correta)
                        || (currentVerification?.resolvida
                          && opcao.id === currentVerification.alternativaCorretaId)) {
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
                          disabled={isCurrentResolved}
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
                        <div>
                          <p>🎉 <strong>Muito bem!</strong> Resposta correta!</p>
                          <p>Você acertou na tentativa {currentVerification.tentativaQuestao} de 3.</p>
                          {currentVerification.explicacao && <p>{currentVerification.explicacao}</p>}
                        </div>
                      ) : currentVerification.resolvida ? (
                        <div>
                          <p>📘 <strong>As três tentativas foram usadas.</strong> Veja a resposta correta destacada.</p>
                          <p>{currentVerification.explicacao}</p>
                        </div>
                      ) : (
                        <div>
                          <p>❌ <strong>Resposta incorreta.</strong> Tentativa {currentVerification.tentativaQuestao} de 3. Tente novamente.</p>
                          {currentVerification.dica && <p>{currentVerification.dica}</p>}
                        </div>
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
              {!isCurrentResolved && perguntas.length > 0 ? (
                <button
                  type="button"
                  className="btn primary small btn-verify"
                  onClick={handleVerify}
                  disabled={!selectedOptionId || submitting}
                >
                  {submitting ? 'Avaliando...' : 'Verificar Resposta ✨'}
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
              ) : isCompleted ? (
                <button
                  type="button"
                  className="btn primary small"
                  onClick={onClose}
                >
                  Fechar
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
