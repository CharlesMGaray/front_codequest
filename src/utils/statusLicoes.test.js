import test from 'node:test'
import assert from 'node:assert/strict'
import { activeLessonIndex, lessonStatus } from './statusLicoes.js'

const trilha = (...concluidas) => concluidas.map((concluida, i) => ({ id: `l${i + 1}`, concluida }))
const estados = (licoes) => {
  const ativa = activeLessonIndex(licoes)
  return licoes.map((l, i) => lessonStatus(l, i, ativa))
}

test('trilha nova: só a primeira lição está ativa e as demais ficam bloqueadas', () => {
  assert.deepEqual(estados(trilha(false, false, false)), ['active', 'locked', 'locked'])
})

test('concluir uma lição libera a seguinte', () => {
  assert.deepEqual(estados(trilha(true, false, false)), ['completed', 'active', 'locked'])
  assert.deepEqual(estados(trilha(true, true, false)), ['completed', 'completed', 'active'])
})

test('trilha concluída: nenhuma lição ativa ou bloqueada', () => {
  const licoes = trilha(true, true, true)
  assert.equal(activeLessonIndex(licoes), 3)
  assert.deepEqual(estados(licoes), ['completed', 'completed', 'completed'])
})

test('a lição ativa é a primeira não concluída, mesmo que uma posterior conste como concluída', () => {
  assert.deepEqual(estados(trilha(true, false, true, false)), ['completed', 'active', 'completed', 'locked'])
})

test('uma lição bloqueada continua bloqueada enquanto a anterior não for concluída', () => {
  const licoes = trilha(false, false)
  assert.equal(lessonStatus(licoes[1], 1, activeLessonIndex(licoes)), 'locked')
})

test('trilha sem lições', () => {
  assert.equal(activeLessonIndex([]), 0)
  assert.deepEqual(estados([]), [])
})