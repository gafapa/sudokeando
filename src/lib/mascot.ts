import { feedback, translations } from './i18n.ts'
import type { Language, MascotStatus } from '../types'

type MascotCommentBank = Record<MascotStatus, string[]>

const fallbackComments: MascotCommentBank = {
  idle: [
    'Board ready. Confidence currently unverified.',
    'Fresh grid, clean slate, questionable decisions pending.',
    'The robot is observing politely, which is always suspicious.',
    'Numbers are quiet now. They will not stay that way.',
    'Start anywhere. The grid is pretending to be friendly.',
    'No pressure. Only nine rows judging you silently.',
  ],
  happy: [
    'Move recorded. The robot withholds judgment.',
    'Number placed. Verdict postponed.',
    'Entry accepted. The final check will decide.',
    'The board has received your proposal.',
    'Logged without comment. Almost.',
    'The robot refuses to score that early.',
  ],
  thinking: [
    'That focus face is doing most of the work right now.',
    'The robot is watching the suspense build.',
    'A dramatic pause. Very professional.',
    'This cell has become the main character.',
    'The grid waits. The robot pretends patience.',
    'Thinking noises detected. Quality pending.',
  ],
  oops: [
    'The final review found conflicts.',
    'The full board needs another pass.',
    'Some completed cells disagree with the solution.',
    'Final audit failed. Review the marked cells.',
    'The board is full, but not settled.',
    'The robot objects only now, with evidence.',
  ],
  win: [
    'Solved. The robot is forced to respect the evidence.',
    'Grid complete. The numbers have surrendered.',
    'Victory. The robot will deny being impressed.',
    'Done. That was cleaner than expected.',
    'Solved with style and a tolerable amount of drama.',
    'The board is complete. The robot updates its opinion.',
  ],
}

const commentsByLanguage: Partial<Record<Language, MascotCommentBank>> = {
  es: {
    idle: [
      'Tablero listo. La confianza todavía no está auditada.',
      'Cuadrícula limpia, decisiones dudosas pendientes.',
      'El robot observa con educación, que siempre es sospechoso.',
      'Los números están callados. No les durará mucho.',
      'Empieza donde quieras. El tablero finge ser amable.',
      'Sin presión. Solo nueve filas juzgándote en silencio.',
      'El robot calienta motores y prepara comentarios innecesarios.',
      'Hoy el sudoku parece tranquilo. Mala señal.',
    ],
    happy: [
      'Movimiento registrado. El robot se reserva el veredicto.',
      'Número colocado. El juicio queda para el final.',
      'Entrada aceptada. La comprobación final decidirá.',
      'El tablero ha recibido tu propuesta.',
      'Anotado sin comentarios. Casi.',
      'El robot se niega a puntuar tan pronto.',
      'Queda puesto. No hay sentencia todavía.',
      'Movimiento guardado en silencio administrativo.',
    ],
    thinking: [
      'Esa cara de concentración está haciendo horas extra.',
      'El robot observa cómo sube el suspense.',
      'Pausa dramática. Muy profesional.',
      'Esta celda se cree protagonista.',
      'La cuadrícula espera. El robot finge paciencia.',
      'Ruidos de pensamiento detectados. Calidad pendiente.',
      'El silencio ahora mismo tiene bastante personalidad.',
      'El robot toma notas y mira con intensidad.',
    ],
    oops: [
      'La revisión final ha encontrado conflictos.',
      'El tablero completo necesita otra vuelta.',
      'Algunas celdas completadas no cuadran con la solución.',
      'Auditoría final fallida. Revisa las marcas.',
      'El tablero está lleno, pero no resuelto.',
      'El robot protesta solo ahora, con pruebas.',
      'La comprobación completa no ha pasado.',
      'Hay algo que corregir, pero solo se sabe al final.',
    ],
    win: [
      'Resuelto. El robot se ve obligado a respetar las pruebas.',
      'Cuadrícula completa. Los números se han rendido.',
      'Victoria. El robot negará estar impresionado.',
      'Hecho. Más limpio de lo esperado.',
      'Resuelto con estilo y una cantidad tolerable de drama.',
      'Tablero completo. El robot actualiza su opinión.',
      'El sudoku cae. La máquina toma nota.',
      'Final perfecto. El robot finge que era inevitable.',
    ],
  },
  en: fallbackComments,
}

const easyHintTemplates: Partial<Record<Language, string[]>> = {
  es: [
    'Pista de fácil: fila {row}, columna {column} necesita un {value}.',
    'Modo fácil activado: en la fila {row}, columna {column}, va el {value}.',
    'Te soplo una: esa casilla quiere el {value}. Fila {row}, columna {column}.',
    'Ayuda permitida: pon un {value} en esa celda.',
  ],
  en: [
    'Easy hint: row {row}, column {column} needs {value}.',
    'Easy mode assist: that cell is {value}.',
    'Allowed hint: place {value} there.',
    'Small nudge: row {row}, column {column} wants {value}.',
  ],
}

const fixedCellComments: Partial<Record<Language, string[]>> = {
  es: [
    'Esa celda ya venía escrita. El robot no negocia con números fijos.',
    'Número fijo. Puedes mirarlo con respeto, pero no tocarlo.',
    'Ahí no hay pista: ya está resuelto de fábrica.',
  ],
  en: [
    'That cell was given. The robot does not negotiate with fixed numbers.',
    'Fixed number. You may admire it, but not edit it.',
    'No hint needed there. That one shipped solved.',
  ],
}

const finalErrorComments: Partial<Record<Language, string[]>> = {
  es: [
    'Tablero completo, pero algo no cuadra. Ahora sí marco los conflictos.',
    'Final revisado: hay celdas que no pasan la auditoría.',
    'La cuadrícula está llena, pero no resuelta. Revisa las marcas rojas.',
    'Comprobación final fallida. El robot ya puede protestar con pruebas.',
  ],
  en: [
    'Board filled, but something is off. Conflicts are marked now.',
    'Final check failed. Some cells did not pass the audit.',
    'The grid is full, but not solved. Review the red marks.',
    'Final verification failed. The robot can now object with evidence.',
  ],
}

export function getMascotComment(language: Language, status: MascotStatus): string {
  const languageComments = commentsByLanguage[language]
  return languageComments ? pickRandom(languageComments[status]) : translations[language].mascotMessages[status]
}

export function getEasyHintComment(
  language: Language,
  rowIndex: number,
  columnIndex: number,
  value: number,
): string {
  return formatHint(
    easyHintTemplates[language] ? pickRandom(easyHintTemplates[language]) : feedback[language].hint,
    rowIndex,
    columnIndex,
    value,
  )
}

export function getFixedCellComment(language: Language): string {
  return fixedCellComments[language] ? pickRandom(fixedCellComments[language]) : feedback[language].fixed
}

export function getFinalErrorComment(language: Language): string {
  return finalErrorComments[language] ? pickRandom(finalErrorComments[language]) : feedback[language].finalError
}

function pickRandom(messages: string[]): string {
  if (messages.length === 0) {
    return ''
  }

  return messages[Math.floor(Math.random() * messages.length)]
}

function formatHint(
  template: string,
  rowIndex: number,
  columnIndex: number,
  value: number,
): string {
  return template
    .replace('{row}', String(rowIndex + 1))
    .replace('{column}', String(columnIndex + 1))
    .replace('{value}', String(value))
}
