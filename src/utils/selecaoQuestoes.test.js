import test from 'node:test'
import assert from 'node:assert/strict'
import {
  QUESTIONS_PER_LESSON,
  difficultyOrderForMastery,
  selectLessonQuestions,
} from './selecaoQuestoes.js'

// Banco de seis questões, duas de cada dificuldade (F = fácil, M = média, D = difícil).
const banco = (tentativas = {}) =>
  [['F1', 1], ['F2', 1], ['M1', 2], ['M2', 2], ['D1', 3], ['D2', 3]].map(([id, dificuldade]) => ({
    id,
    dificuldade,
    tentativasUsadas: tentativas[id] || 0,
  }))
const ids = (questoes) => questoes.map((q) => q.id)
const contagem = (questoes, dificuldade) => questoes.filter((q) => q.dificuldade === dificuldade).length

test('a ordem de preferência muda nos limites exatos das faixas', () => {
  assert.deepEqual(difficultyOrderForMastery(0), [1, 2, 3])
  assert.deepEqual(difficultyOrderForMastery(59), [1, 2, 3])
  assert.deepEqual(difficultyOrderForMastery(60), [2, 1, 3])
  assert.deepEqual(difficultyOrderForMastery(79), [2, 1, 3])
  assert.deepEqual(difficultyOrderForMastery(80), [3, 2, 1])
  assert.deepEqual(difficultyOrderForMastery(100), [3, 2, 1])
})

test('o quiz tem cinco questões distintas em qualquer faixa', () => {
  for (const dominio of [50, 70, 90]) {
    const quiz = selectLessonQuestions(banco(), dominio)
    assert.equal(quiz.length, QUESTIONS_PER_LESSON)
    assert.equal(new Set(ids(quiz)).size, QUESTIONS_PER_LESSON)
  }
})

test('quiz novo abaixo de 60: duas fáceis, duas médias, uma difícil, fáceis primeiro', () => {
  const quiz = selectLessonQuestions(banco(), 50)
  assert.deepEqual(ids(quiz), ['F1', 'F2', 'M1', 'M2', 'D1'])
})

test('quiz novo de 60 a 79: mesma composição da faixa anterior, médias primeiro', () => {
  const quiz = selectLessonQuestions(banco(), 70)
  assert.deepEqual(ids(quiz), ['M1', 'M2', 'F1', 'F2', 'D1'])
  assert.equal(contagem(quiz, 1), 2)
  assert.equal(contagem(quiz, 2), 2)
  assert.equal(contagem(quiz, 3), 1)
})

test('quiz novo a partir de 80: duas difíceis, duas médias, uma fácil, difíceis primeiro', () => {
  const quiz = selectLessonQuestions(banco(), 90)
  assert.deepEqual(ids(quiz), ['D1', 'D2', 'M1', 'M2', 'F1'])
})

test('questões já tentadas têm prioridade mesmo fora da faixa preferida', () => {
  const quiz = selectLessonQuestions(banco({ D2: 1 }), 50)
  assert.ok(ids(quiz).includes('D2'))
  assert.deepEqual(ids(quiz), ['F1', 'F2', 'M1', 'M2', 'D2'])
})

test('ao retomar um quiz, as questões tentadas permanecem mesmo que a faixa mude', () => {
  const tentadas = { F1: 1, F2: 1, M1: 1 }
  assert.deepEqual(ids(selectLessonQuestions(banco(), 50)), ['F1', 'F2', 'M1', 'M2', 'D1'])
  const retomada = selectLessonQuestions(banco(tentadas), 90)
  for (const id of Object.keys(tentadas)) assert.ok(ids(retomada).includes(id))
  // M2 nunca foi vista e sai; D2 nunca foi vista e entra.
  assert.deepEqual(ids(retomada), ['D1', 'D2', 'M1', 'F1', 'F2'])
})

test('com todas as questões tentadas, ficam cinco e sai a última da preferência da faixa', () => {
  const todas = { F1: 1, F2: 1, M1: 1, M2: 1, D1: 1, D2: 1 }
  assert.deepEqual(ids(selectLessonQuestions(banco(todas), 50)), ['F1', 'F2', 'M1', 'M2', 'D1'])
})

test('a seleção não altera a lista original', () => {
  const original = banco()
  const copia = JSON.parse(JSON.stringify(original))
  selectLessonQuestions(original, 90)
  assert.deepEqual(original, copia)
})

test('um banco com menos de cinco questões devolve todas', () => {
  assert.equal(selectLessonQuestions(banco().slice(0, 3), 50).length, 3)
  assert.deepEqual(selectLessonQuestions([], 50), [])
})