export const QUESTIONS_PER_LESSON = 5

// Ordem de preferência das dificuldades (1 = fácil, 2 = média, 3 = difícil) para cada faixa de domínio.
export function difficultyOrderForMastery(mastery) {
  if (mastery >= 80) return [3, 2, 1]
  if (mastery >= 60) return [2, 1, 3]
  return [1, 2, 3]
}

// Escolhe as questões do quiz: ordena pela preferência da faixa, coloca à frente as já tentadas,
// mantém as cinco primeiras e as reordena pela preferência da faixa para exibição.
export function selectLessonQuestions(questions, mastery) {
  const difficultyOrder = difficultyOrderForMastery(mastery)
  const priority = new Map(difficultyOrder.map((difficulty, index) => [difficulty, index]))
  const compareDifficulty = (a, b) =>
    (priority.get(a.dificuldade) ?? difficultyOrder.length)
      - (priority.get(b.dificuldade) ?? difficultyOrder.length)

  const ordered = [...questions].sort(compareDifficulty)
  const attempted = ordered.filter((question) => question.tentativasUsadas > 0)
  const unattempted = ordered.filter((question) => question.tentativasUsadas === 0)
  return [...attempted, ...unattempted]
    .slice(0, QUESTIONS_PER_LESSON)
    .sort(compareDifficulty)
}