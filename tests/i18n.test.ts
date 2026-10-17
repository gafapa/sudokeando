import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SUPPORTED_LANGUAGES, translations, feedback } from '../src/lib/i18n.ts'
import { getEasyHintComment, getFixedCellComment, getFinalErrorComment, getMascotComment } from '../src/lib/mascot.ts'

test('every locale has native hint, fixed-cell, error, and persistence messages', () => {
  for (const language of SUPPORTED_LANGUAGES) {
    const hint = getEasyHintComment(language, 0, 1, 9)
    assert.ok(hint.includes('9'))
    assert.doesNotMatch(hint, /\{(?:row|column|value)\}/)
    assert.ok(getFixedCellComment(language).length > 0)
    assert.ok(getFinalErrorComment(language).length > 0)
    assert.ok(feedback[language].storage.length > 0)
    if (language !== 'es' && language !== 'en') {
      assert.equal(getFixedCellComment(language), feedback[language].fixed)
      assert.equal(getFinalErrorComment(language), feedback[language].finalError)
      assert.equal(getMascotComment(language, 'thinking'), translations[language].mascotMessages.thinking)
    }
  }
})
