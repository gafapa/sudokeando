import { useState, useEffect, useCallback, useRef } from 'react';
import { getSudoku } from 'sudoku-gen';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Zap, 
  Trash2,
  ChevronLeft,
  Lightbulb,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type Screen = 'home' | 'game';

interface GameStats {
  easy: { played: number; won: number; bestTime: number | null };
  medium: { played: number; won: number; bestTime: number | null };
  hard: { played: number; won: number; bestTime: number | null };
  expert: { played: number; won: number; bestTime: number | null };
}

interface PuzzleCell {
  value: number | null;
  initial: boolean;
  error: boolean;
}

// --- Mascot Component (SVG Robot, improved) ---
type MascotStatus = 'idle' | 'happy' | 'thinking' | 'oops' | 'win';

const MESSAGES: Record<MascotStatus, string> = {
  idle: '¡A jugar!',
  happy: '¡Correcto! 🎉',
  thinking: 'Hmm... 🤔',
  oops: '¡Ups! Ese no era 😅',
  win: '¡Eres un genio! 🥳',
};

const Mascot = ({ status, className = "" }: { status: MascotStatus, className?: string }) => {
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [displayedStatus, setDisplayedStatus] = useState<MascotStatus>(status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSmall = className.includes('mascot-small');

  useEffect(() => {
    // Show bubble when status changes, except when idle coming from idle
    setDisplayedStatus(status);
    setBubbleVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    // 'win' message stays longer; idle only briefly
    const duration = status === 'win' ? 4000 : status === 'idle' ? 1500 : 2000;
    timerRef.current = setTimeout(() => setBubbleVisible(false), duration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [status]);

  // Eye configs per state
  const getScreen = () => {
    const screenBg = {
      idle:     'rgba(45, 212, 191, 0.15)',
      happy:    'rgba(16, 185, 129, 0.2)',
      thinking: 'rgba(139, 92, 246, 0.2)',
      oops:     'rgba(239, 68, 68, 0.2)',
      win:      'rgba(244, 114, 182, 0.25)',
    }[status];

    return (
      <>
        {/* Screen background glow */}
        <rect x="28" y="28" width="64" height="50" rx="10" fill={screenBg} />
        {/* Screen border */}
        <rect x="28" y="28" width="64" height="50" rx="10" fill="none"
          stroke={status === 'oops' ? 'rgba(239,68,68,0.5)' : status === 'win' ? 'rgba(244,114,182,0.6)' : 'rgba(45,212,191,0.3)'}
          strokeWidth="1.5" />
        {/* Scanline effect */}
        {[35, 42, 49, 56, 63, 70].map((y, i) => (
          <line key={i} x1="30" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
      </>
    );
  };

  const getEyes = () => {
    switch (status) {
      case 'happy':
        // ^_^ style happy arcs
        return (
          <>
            <path d="M36 46 Q42 38 48 46" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M72 46 Q78 38 84 46" stroke="#2dd4bf" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* shine */}
            <circle cx="40" cy="43" r="1.5" fill="rgba(255,255,255,0.8)" />
            <circle cx="76" cy="43" r="1.5" fill="rgba(255,255,255,0.8)" />
          </>
        );
      case 'thinking':
        // one eye bigger, one squinting, thinking dots
        return (
          <>
            <circle cx="42" cy="46" r="6" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
            <circle cx="42" cy="46" r="3" fill="#8b5cf6" opacity="0.8" />
            <rect x="72" y="43" width="12" height="5" rx="2.5" fill="#8b5cf6" opacity="0.8" />
            {/* thinking dots */}
            <circle cx="78" cy="35" r="1.5" fill="#8b5cf6" opacity="0.6" />
            <circle cx="83" cy="31" r="2" fill="#8b5cf6" opacity="0.8" />
            <circle cx="89" cy="26" r="2.5" fill="#8b5cf6" />
          </>
        );
      case 'oops':
        // X X eyes
        return (
          <>
            <path d="M36 40 L46 50 M46 40 L36 50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M72 40 L82 50 M82 40 L72 50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            {/* sweat drop */}
            <path d="M88 38 Q90 32 92 38 Q92 43 90 44 Q88 43 88 38Z" fill="#93c5fd" />
          </>
        );
      case 'win':
        // Shining star eyes
        return (
          <>
            <circle cx="42" cy="45" r="7" fill="none" stroke="#f472b6" strokeWidth="2" />
            <circle cx="42" cy="45" r="4" fill="#f472b6" />
            <circle cx="42" cy="45" r="2" fill="#fff" />
            <circle cx="78" cy="45" r="7" fill="none" stroke="#f472b6" strokeWidth="2" />
            <circle cx="78" cy="45" r="4" fill="#f472b6" />
            <circle cx="78" cy="45" r="2" fill="#fff" />
            {/* sparkles */}
            <path d="M30 32 L31 28 L32 32 L36 33 L32 34 L31 38 L30 34 L26 33Z" fill="#fde047" />
            <path d="M85 28 L86 25 L87 28 L90 29 L87 30 L86 33 L85 30 L82 29Z" fill="#fde047" />
          </>
        );
      default: // idle — simple round eyes with blink animation
        return (
          <>
            {/* Left eye */}
            <circle cx="42" cy="45" r="7" fill="rgba(45,212,191,0.2)" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="42" cy="45" r="4" fill="#2dd4bf" />
            <circle cx="44" cy="43" r="1.5" fill="rgba(255,255,255,0.7)" />
            {/* Right eye */}
            <circle cx="78" cy="45" r="7" fill="rgba(45,212,191,0.2)" stroke="#2dd4bf" strokeWidth="1.5" />
            <circle cx="78" cy="45" r="4" fill="#2dd4bf" />
            <circle cx="80" cy="43" r="1.5" fill="rgba(255,255,255,0.7)" />
          </>
        );
    }
  };

  const getMouth = () => {
    switch (status) {
      case 'happy': case 'win':
        return (
          <>
            <path d="M44 62 Q60 74 76 62" stroke="#2dd4bf" strokeWidth="3" fill="rgba(45,212,191,0.15)" strokeLinecap="round" />
          </>
        );
      case 'oops':
        return <path d="M48 68 Q60 60 72 68" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'thinking':
        return (
          <>
            <path d="M50 64 Q55 68 62 64 Q68 61 74 64" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return <path d="M50 65 Q60 70 70 65" stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />;
    }
  };

  // Cheek blush — only on happy/win
  const getCheeks = () => {
    if (status !== 'happy' && status !== 'win') return null;
    return (
      <>
        <ellipse cx="33" cy="57" rx="5" ry="3" fill="rgba(244,114,182,0.35)" />
        <ellipse cx="87" cy="57" rx="5" ry="3" fill="rgba(244,114,182,0.35)" />
      </>
    );
  };

  const armColor = status === 'oops' ? '#ef4444' : status === 'win' ? '#f472b6' : 'var(--secondary)';
  const size = isSmall ? 80 : 180;

  return (
    <div className={`mascot-wrapper ${className}`} style={{ position: 'relative', width: size, height: size + 28 }}>
      {/* Speech Bubble — rendered outside SVG for full CSS control */}
      <AnimatePresence>
        {bubbleVisible && (
          <motion.div
            key={displayedStatus}
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.85 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              background: status === 'oops'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : status === 'win'
                ? 'linear-gradient(135deg, #f472b6, #a855f7)'
                : status === 'happy'
                ? 'linear-gradient(135deg, #10b981, #2dd4bf)'
                : status === 'thinking'
                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                : 'linear-gradient(135deg, #2dd4bf, #0891b2)',
              color: '#fff',
              fontSize: isSmall ? '10px' : '13px',
              fontWeight: 800,
              borderRadius: '20px',
              padding: isSmall ? '3px 8px' : '6px 14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              letterSpacing: '0.02em',
              zIndex: 20,
            }}
          >
            {MESSAGES[displayedStatus]}
            {/* Tail */}
            <span style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${status === 'oops' ? '#dc2626' : status === 'win' ? '#a855f7' : status === 'happy' ? '#2dd4bf' : status === 'thinking' ? '#6d28d9' : '#0891b2'}`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 120 110"
        width={size}
        height={size}
        style={{ marginTop: 28 }}
        className="mascot-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`bodyGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={status === 'oops' ? '#7f1d1d' : status === 'win' ? '#581c87' : '#1e1b4b'} />
            <stop offset="100%" stopColor={status === 'oops' ? '#450a0a' : status === 'win' ? '#2e1065' : '#0f172a'} />
          </linearGradient>
          <linearGradient id={`faceGrad-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={status === 'oops' ? '#ef4444' : status === 'win' ? '#a855f7' : '#8b5cf6'} />
            <stop offset="100%" stopColor={status === 'oops' ? '#dc2626' : status === 'win' ? '#f472b6' : '#2dd4bf'} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="60" cy="108" rx="28" ry="4" fill="rgba(0,0,0,0.25)" />

        {/* Legs */}
        <rect x="38" y="90" width="14" height="14" rx="5" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <rect x="68" y="90" width="14" height="14" rx="5" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <rect x="39" y="100" width="12" height="5" rx="3" fill={`url(#faceGrad-${status})`} />
        <rect x="69" y="100" width="12" height="5" rx="3" fill={`url(#faceGrad-${status})`} />

        {/* Body */}
        <rect x="22" y="22" width="76" height="72" rx="16" fill={`url(#bodyGrad-${status})`} />
        {/* Body highlight */}
        <rect x="22" y="22" width="76" height="72" rx="16" fill="none"
          stroke={`url(#faceGrad-${status})`} strokeWidth="2" opacity="0.6" />
        {/* Body inner shadow top */}
        <rect x="24" y="24" width="72" height="12" rx="12" fill="rgba(255,255,255,0.04)" />

        {/* Chest details — small ports */}
        <rect x="30" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.6" />
        <rect x="42" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.4" />
        <rect x="54" y="82" width="8" height="5" rx="2" fill={`url(#faceGrad-${status})`} opacity="0.6" />

        {/* Antenna base */}
        <rect x="56" y="16" width="8" height="8" rx="3" fill={`url(#faceGrad-${status})`} />
        {/* Antenna rod */}
        <rect x="59" y="4" width="2" height="14" rx="1" fill="rgba(255,255,255,0.3)" />
        {/* Antenna orb */}
        <motion.circle
          cx="60" cy="4" r="4"
          fill={status === 'oops' ? '#ef4444' : status === 'win' ? '#f472b6' : '#2dd4bf'}
          filter="url(#glow)"
          animate={{ r: [3.5, 5, 3.5], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Arms */}
        <motion.g
          style={{ transformOrigin: '22px 62px' }}
          animate={{ rotate: status === 'win' ? [-25, 0, -25] : status === 'oops' ? [5, -5, 5] : 0 }}
          transition={{ repeat: Infinity, duration: status === 'win' ? 0.4 : 1.2 }}
        >
          <rect x="8" y="48" width="14" height="28" rx="7" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="9" y="48" width="12" height="14" rx="6" fill="rgba(255,255,255,0.05)" />
          <rect x="10" y="72" width="10" height="5" rx="3" fill={armColor} opacity="0.8" />
        </motion.g>
        <motion.g
          style={{ transformOrigin: '98px 62px' }}
          animate={{ rotate: status === 'win' ? [25, 0, 25] : status === 'oops' ? [-5, 5, -5] : 0 }}
          transition={{ repeat: Infinity, duration: status === 'win' ? 0.4 : 1.2 }}
        >
          <rect x="98" y="48" width="14" height="28" rx="7" fill={`url(#bodyGrad-${status})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="99" y="48" width="12" height="14" rx="6" fill="rgba(255,255,255,0.05)" />
          <rect x="100" y="72" width="10" height="5" rx="3" fill={armColor} opacity="0.8" />
        </motion.g>

        {/* Face screen */}
        {getScreen()}

        {/* Eyes */}
        {getEyes()}
        {/* Mouth */}
        {getMouth()}
        {/* Cheeks */}
        {getCheeks()}
      </svg>
    </div>
  );
};

// --- App Component ---
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<PuzzleCell[][]>([]);
  const [solution, setSolution] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [timer, setTimer] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    easy: { played: 0, won: 0, bestTime: null },
    medium: { played: 0, won: 0, bestTime: null },
    hard: { played: 0, won: 0, bestTime: null },
    expert: { played: 0, won: 0, bestTime: null },
  });
  const [mascotStatus, setMascotStatus] = useState<MascotStatus>('idle');

  // Load stats
  useEffect(() => {
    const saved = localStorage.getItem('sudokeando_stats');
    if (saved) setStats(JSON.parse(saved));
  }, []);

  // Save stats
  useEffect(() => {
    localStorage.setItem('sudokeando_stats', JSON.stringify(stats));
  }, [stats]);

  // Timer
  useEffect(() => {
    let interval: number;
    if (gameActive && screen === 'game') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, screen]);

  const startNewGame = useCallback((diff: Difficulty = difficulty) => {
    const puzzle = getSudoku(diff);
    const newBoard: PuzzleCell[][] = [];
    
    for (let r = 0; r < 9; r++) {
      const row: PuzzleCell[] = [];
      for (let c = 0; c < 9; c++) {
        const char = puzzle.puzzle[r * 9 + c];
        const val = char === '-' ? null : parseInt(char);
        row.push({
          value: val,
          initial: val !== null,
          error: false
        });
      }
      newBoard.push(row);
    }

    setBoard(newBoard);
    setSolution(puzzle.solution);
    setDifficulty(diff);
    setTimer(0);
    setGameActive(true);
    setMascotStatus('idle');
    setSelectedCell(null);
    setScreen('game');

    setStats(prev => ({
      ...prev,
      [diff]: { ...prev[diff], played: prev[diff].played + 1 }
    }));
  }, [difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (!gameActive) return;
    setSelectedCell([r, c]);
    setMascotStatus('thinking');
  };

  const handleInput = (num: number | null) => {
    if (!selectedCell || !gameActive) return;
    const [r, c] = selectedCell;
    const cell = board[r][c];

    if (cell.initial) return;

    const newBoard = [...board.map(r => [...r])];
    const correctVal = parseInt(solution[r * 9 + c]);

    if (num === null) {
      newBoard[r][c].value = null;
      newBoard[r][c].error = false;
      setBoard(newBoard);
      return;
    }

    newBoard[r][c].value = num;
    const isError = num !== correctVal;
    newBoard[r][c].error = isError;

    setBoard(newBoard);
    setMascotStatus(isError ? 'oops' : 'happy');

    // Check Win
    const isWin = newBoard.every((row, ri) => 
      row.every((cell, ci) => cell.value === parseInt(solution[ri * 9 + ci]))
    );

    if (isWin) {
      handleWin();
    }
  };

  const handleWin = () => {
    setGameActive(false);
    setMascotStatus('win');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2dd4bf', '#8b5cf6', '#f472b6']
    });

    setStats(prev => {
      const currentBest = prev[difficulty].bestTime;
      return {
        ...prev,
        [difficulty]: { 
          ...prev[difficulty], 
          won: prev[difficulty].won + 1,
          bestTime: currentBest === null || timer < currentBest ? timer : currentBest
        }
      };
    });
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getHint = () => {
    if (!selectedCell || !gameActive) return;
    const [r, c] = selectedCell;
    if (board[r][c].value !== null && !board[r][c].error) return;

    const correctVal = parseInt(solution[r * 9 + c]);
    handleInput(correctVal);
  };

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <HomeScreen 
            key="home"
            difficulty={difficulty} 
            setDifficulty={setDifficulty} 
            stats={stats} 
            onPlay={() => startNewGame(difficulty)} 
            formatTime={formatTime}
          />
        ) : (
          <GameScreen 
            key="game"
            board={board}
            difficulty={difficulty}
            timer={timer}
            mascotStatus={mascotStatus}
            selectedCell={selectedCell}
            handleCellClick={handleCellClick}
            handleInput={handleInput}
            getHint={getHint}
            startNewGame={() => {
              if (window.confirm("¿Reiniciar partida?")) startNewGame();
            }}
            goBack={() => {
              if (gameActive && !window.confirm("¿Salir al menú? Se perderá el progreso.")) return;
              setScreen('home');
              setGameActive(false);
            }}
            formatTime={formatTime}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screen Components ---

function HomeScreen({ difficulty, setDifficulty, stats, onPlay, formatTime }: any) {
  const levels: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
  
  return (
    <motion.div 
      className="home-screen"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <h1>Sudokeando</h1>
      <p className="home-subtitle">Entrena tu mente con estilo</p>
      
      <Mascot status="idle" className="mascot-large" />

      <div className="difficulty-grid">
        {levels.map(lvl => (
          <div 
            key={lvl} 
            className={`glass diff-card ${difficulty === lvl ? 'selected' : ''}`}
            onClick={() => setDifficulty(lvl)}
          >
            <h3>{lvl}</h3>
            <p>{lvl === 'easy' ? 'Relajado' : lvl === 'medium' ? 'Retador' : lvl === 'hard' ? 'Experto' : 'Leyenda'}</p>
          </div>
        ))}
      </div>

      <button className="action-btn btn-primary play-btn" onClick={onPlay}>
        <Play size={24} fill="currentColor" /> ¡JUGAR!
      </button>

      <div className="stats-container">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="gold" /> Tus Logros
        </h2>
        {levels.map(lvl => (
          <div key={lvl} className="stat-item glass">
            <div className="stat-info">
              <h4>{lvl}</h4>
              <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{stats[lvl].won} victorias</p>
            </div>
            <div className="stat-val">
              <div style={{ fontWeight: 800 }}>{stats[lvl].played} jugadas</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Récord: {stats[lvl].bestTime ? formatTime(stats[lvl].bestTime) : '--:--'}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function GameScreen({ 
  board, difficulty, timer, mascotStatus, selectedCell, 
  handleCellClick, handleInput, getHint, startNewGame, goBack, formatTime 
}: any) {
  const currentCellValue = selectedCell ? board[selectedCell[0]][selectedCell[1]].value : null;

  return (
    <motion.div 
      className="game-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="game-header">
        <button className="back-btn" onClick={goBack}>
          <ChevronLeft size={24} /> Menú
        </button>
        <div className="difficulty-tag" style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--secondary)' }}>
          {difficulty}
        </div>
        <div className="timer">
          <Zap size={18} fill="currentColor" /> {formatTime(timer)}
        </div>
      </div>

      <div className="game-mascot-container">
        <Mascot status={mascotStatus} className="mascot-small" />
      </div>

      <div className="board glass">
        {board.map((row: any, r: number) => 
          row.map((cell: any, c: number) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isActive = selectedCell && (selectedCell[0] === r || selectedCell[1] === c || (Math.floor(selectedCell[0]/3) === Math.floor(r/3) && Math.floor(selectedCell[1]/3) === Math.floor(c/3)));
            const isSameValue = cell.value !== null && currentCellValue !== null && cell.value === currentCellValue;

            return (
              <div 
                key={`${r}-${c}`}
                className={`cell 
                  ${cell.initial ? 'initial' : 'user-input'} 
                  ${cell.error ? 'error' : ''} 
                  ${isSelected ? 'selected' : ''} 
                  ${isActive ? 'active' : ''} 
                  ${isSameValue ? 'same-value' : ''}
                `}
                onClick={() => handleCellClick(r, c)}
              >
                {cell.value || ''}
              </div>
            );
          })
        )}
      </div>

      <div className="num-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} className="num-btn" onClick={() => handleInput(n)}>{n}</button>
        ))}
        <button className="num-btn special" onClick={() => handleInput(null)}>
          <Trash2 size={20} />
        </button>
      </div>

      <div className="actions">
        <button className="action-btn btn-secondary" onClick={getHint}>
          <Lightbulb size={20} /> Pista
        </button>
        <button className="action-btn btn-primary" onClick={startNewGame}>
          <RotateCcw size={20} /> Reiniciar
        </button>
      </div>
    </motion.div>
  );
}
