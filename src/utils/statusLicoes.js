// Índice da lição ativa: a primeira que ainda não foi concluída (ou o tamanho da lista, se todas foram).
export function activeLessonIndex(licoes) {
  const idx = licoes.findIndex((l) => !l.concluida)
  return idx === -1 ? licoes.length : idx
}

// Estado de cada lição na trilha: concluída, ativa (a próxima a fazer) ou bloqueada.
export function lessonStatus(lesson, idx, activeIndex) {
  if (lesson.concluida) return 'completed'
  return idx === activeIndex ? 'active' : 'locked'
}