import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { BRAND_EASE } from "@/lib/brand";

// ── Word bank: UX/UI/Product Design terminology ──
const WORD_BANK = [
  "USER", "FLOW", "TASK", "TEST", "DATA",
  "WIRE", "SITE", "MAPS", "NOTE", "VIEW",
  "GRID", "GAPS", "FILL", "LINE", "EDGE",
  "PALE", "TONE", "HUE", "BLEND", "SHARP",
  "SHIP", "ITER", "SCAN", "PROB", "IDEA",
  "TEAM", "PLAN", "GOAL", "ROLE", "FIGMA",
  "MAZE", "HEUR", "PROTOTYPE", "RESEARCH", "FEEDBACK",
];

// ── Target kerning ──
function getTargetKerning(word: string): number[] {
  const pairs: number[] = [];
  for (let i = 0; i < word.length - 1; i++) {
    const pair = word[i] + word[i + 1];
    if (/[OQCGD0]/.test(pair[0]) && /[OQCGD0]/.test(pair[1])) pairs.push(-3);
    else if (/[HNMW]/.test(pair[0]) && /[HNMW]/.test(pair[1])) pairs.push(1);
    else if (/[ILT1]/.test(pair[0]) || /[ILT1]/.test(pair[1])) pairs.push(2);
    else if (/[VAWY]/.test(pair[0]) && /[VAWY]/.test(pair[1])) pairs.push(-2);
    else pairs.push(0);
  }
  return pairs;
}

// ── Scoring ──
function calculateScore(userKerning: number[], targetKerning: number[]): number {
  if (userKerning.length === 0) return 0;
  let totalError = 0;
  for (let i = 0; i < userKerning.length; i++) {
    totalError += Math.abs(userKerning[i] - targetKerning[i]);
  }
  return Math.max(0, Math.round(100 - (totalError / userKerning.length) * 10));
}

function getScoreVibe(score: number): { label: string; color: string; bg: string } {
  if (score >= 95) return { label: "Perfect", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (score >= 85) return { label: "Sharp", color: "text-blue-400", bg: "bg-blue-500/10" };
  if (score >= 70) return { label: "Good", color: "text-violet-400", bg: "bg-violet-500/10" };
  if (score >= 50) return { label: "Okay", color: "text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Off", color: "text-rose-400", bg: "bg-rose-500/10" };
}

function getScoreGradient(score: number): string {
  if (score >= 95) return "from-emerald-400 to-emerald-600";
  if (score >= 85) return "from-blue-400 to-blue-600";
  if (score >= 70) return "from-violet-400 to-violet-600";
  if (score >= 50) return "from-amber-400 to-amber-600";
  return "from-rose-400 to-rose-600";
}

// ── Difficulty ──
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG = {
  easy: { letters: [3, 4], label: "Beginner", sublabel: "3-4 letters", multiplier: 1 },
  medium: { letters: [4, 5], label: "Designer", sublabel: "4-5 letters", multiplier: 1.5 },
  hard: { letters: [5, 6, 7], label: "Lead", sublabel: "5-7 letters", multiplier: 2 },
};

// ── localStorage ──
const STORAGE_KEY = "kern-game-best-scores";

function loadBestScores(): Record<Difficulty, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { easy: 0, medium: 0, hard: 0 };
}

function saveBestScore(difficulty: Difficulty, score: number) {
  try {
    const best = loadBestScores();
    if (score > best[difficulty]) {
      best[difficulty] = score;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
      return true;
    }
  } catch {}
  return false;
}

// ── Confetti ──
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            width: 3 + Math.random() * 6,
            height: 3 + Math.random() * 6,
            backgroundColor: ["#1F67F1", "#EC4899", "#E8715A", "#6DB8A2", "#F59E0B", "#8B5CF6"][i % 6],
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 720 }}
          transition={{ duration: 0.8 + Math.random() * 1, delay: Math.random() * 0.3, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ── Timer bar ──
function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = (seconds / total) * 100;
  const isLow = seconds <= 5;
  const isCritical = seconds <= 3;

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-border/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
          animate={isCritical ? { opacity: [1, 0.4, 1] } : {}}
          transition={isCritical ? { duration: 0.4, repeat: Infinity } : {}}
        />
      </div>
      <span className={`font-mono text-[10px] tabular-nums ${isCritical ? "text-rose-500 font-bold" : isLow ? "text-amber-500" : "text-muted-foreground/60"}`}>
        {seconds}s
      </span>
    </div>
  );
}

// ── Fun feedback messages ──
function getFunMessage(score: number): string {
  if (score >= 95) return "You have the eye.";
  if (score >= 85) return "Sharp kerning.";
  if (score >= 70) return "Getting there.";
  if (score >= 50) return "Not bad for a first draft.";
  return "Keep adjusting.";
}

// ── Main Game ──
export default function Play() {
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentWord, setCurrentWord] = useState("");
  const [letterOffsets, setLetterOffsets] = useState<number[]>([]);
  const [targetKerning, setTargetKerning] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [scores, setScores] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const [bestScores, setBestScores] = useState(loadBestScores);
  const [isNewBest, setIsNewBest] = useState(false);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const TIMER_DURATION = 30;

  const pickNewWord = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const len = config.letters[Math.floor(Math.random() * config.letters.length)];
    const filtered = WORD_BANK.filter(w => w.length === len && !usedWords.includes(w));
    const word = filtered.length > 0
      ? filtered[Math.floor(Math.random() * filtered.length)]
      : WORD_BANK.filter(w => w.length === len)[0] || "USER";
    const target = getTargetKerning(word);
    setCurrentWord(word);
    setTargetKerning(target);
    setLetterOffsets(new Array(word.length).fill(0));
    setShowHint(false);
    setTimeLeft(TIMER_DURATION);
    setUsedWords(prev => [...prev, word]);
  }, [difficulty, usedWords]);

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { submitRound(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, round]);

  const startGame = useCallback(() => {
    setGameState("playing");
    setRound(0);
    setScores([]);
    setScore(0);
    setStreak(0);
    setIsNewBest(false);
    setUsedWords([]);
    setTimeout(() => pickNewWord(), 50);
  }, [pickNewWord]);

  const computeKerning = useCallback(() => {
    const kerning: number[] = [];
    for (let i = 0; i < letterOffsets.length - 1; i++) {
      kerning.push(letterOffsets[i + 1] - letterOffsets[i]);
    }
    return kerning;
  }, [letterOffsets]);

  const submitRound = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const kerning = computeKerning();
    const roundScore = calculateScore(kerning, targetKerning);
    const timeBonus = Math.round(timeLeft * 2);
    const streakBonus = streak >= 2 ? streak * 5 : 0;
    const finalScore = Math.min(100, roundScore + timeBonus + streakBonus);

    setScore(finalScore);
    setScores(prev => [...prev, finalScore]);

    if (roundScore >= 70) setStreak(prev => prev + 1);
    else setStreak(0);

    if (finalScore >= 85) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setGameState("result");
  }, [computeKerning, targetKerning, timeLeft, streak]);

  const nextRound = useCallback(() => {
    if (round + 1 >= totalRounds) { setRound(prev => prev + 1); return; }
    setRound(prev => prev + 1);
    setGameState("playing");
    pickNewWord();
  }, [round, totalRounds, pickNewWord]);

  const resetGame = useCallback(() => {
    setGameState("intro");
    setRound(0);
    setScores([]);
    setScore(0);
    setStreak(0);
    setIsNewBest(false);
  }, []);

  useEffect(() => {
    if (round >= totalRounds && scores.length > 0) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const isNew = saveBestScore(difficulty, avg);
      setIsNewBest(isNew);
      setBestScores(loadBestScores());
    }
  }, [round, totalRounds, scores, difficulty]);

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const isGameOver = round >= totalRounds;

  return (
    <div className="w-full flex flex-col gap-10 md:gap-14 pb-24">
      <Confetti active={showConfetti} />

      <motion.section className="flex flex-col gap-4" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: BRAND_EASE }}>
        <Link href="/home" className="text-muted-foreground/80 hover:text-primary transition-colors text-xs uppercase tracking-[0.2em] font-sans w-max">← Back</Link>
        <h1 className="font-display font-black leading-[0.95] tracking-tight bg-gradient-to-r from-primary via-violet-500 to-pink-500 bg-clip-text text-transparent" style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>
          Kern this.
        </h1>
        <p className="text-foreground/65 text-base md:text-lg font-sans leading-relaxed max-w-xl">
          <strong className="text-foreground/80">Drag the letters</strong> to match optically correct kerning. Fast and accurate = high score.
        </p>
      </motion.section>

      <AnimatePresence mode="wait">
        {gameState === "intro" && (
          <IntroScreen key="intro" difficulty={difficulty} setDifficulty={setDifficulty} bestScores={bestScores} onStart={startGame} />
        )}
        {gameState === "playing" && (
          <PlayingScreen key={`playing-${round}`} word={currentWord} letterOffsets={letterOffsets} setLetterOffsets={setLetterOffsets} targetKerning={targetKerning} showHint={showHint} setShowHint={setShowHint} onSubmit={submitRound} onExit={resetGame} round={round} totalRounds={totalRounds} draggingIndex={draggingIndex} setDraggingIndex={setDraggingIndex} timeLeft={timeLeft} timerDuration={TIMER_DURATION} streak={streak} difficulty={difficulty} />
        )}
        {gameState === "result" && (
          <ResultScreen key="result" score={score} word={currentWord} letterOffsets={letterOffsets} targetKerning={targetKerning} round={round} totalRounds={totalRounds} scores={scores} avgScore={avgScore} isGameOver={isGameOver} isNewBest={isNewBest} bestScore={bestScores[difficulty]} streak={streak} difficulty={difficulty} onNext={nextRound} onRestart={resetGame} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Intro Screen ──
function IntroScreen({ difficulty, setDifficulty, bestScores, onStart }: { difficulty: Difficulty; setDifficulty: (d: Difficulty) => void; bestScores: Record<Difficulty, number>; onStart: () => void }) {
  return (
    <motion.div className="flex flex-col gap-8" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease: BRAND_EASE }}>
      <div className="flex flex-col gap-3">
        <span className="text-muted-foreground text-xs uppercase tracking-[0.25em] font-sans font-medium">Level</span>
        <div className="flex gap-2">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
            const config = DIFFICULTY_CONFIG[d];
            const isSelected = difficulty === d;
            const best = bestScores[d];
            return (
              <motion.button key={d} onClick={() => setDifficulty(d)} className={`relative flex-1 flex flex-row items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`} whileTap={{ scale: 0.97 }}>
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-sans font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>{config.label}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">{config.sublabel}</span>
                </div>
                {best > 0 && <span className={`text-xs font-mono ${isSelected ? "text-primary/70" : "text-muted-foreground/50"}`}>{best}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-1">
            {["K", "E", "R", "N"].map((letter, i) => (
              <motion.span key={i} className="text-4xl font-display font-black bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent select-none" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>{letter}</motion.span>
            ))}
          </div>
          <p className="text-foreground/70 text-sm font-sans leading-relaxed">
            <strong>Drag letters left/right</strong> to adjust spacing. Match what a typographer would consider optically correct.
          </p>
          <p className="text-foreground/50 text-xs font-sans">30s per round • Speed bonus • Streak multiplier • Best scores saved</p>
        </div>
      </div>

      <motion.button onClick={onStart} className="w-max px-8 py-3.5 bg-gradient-to-r from-primary to-violet-500 text-white font-sans text-sm uppercase tracking-[0.15em] font-bold rounded-full cursor-pointer shadow-lg shadow-primary/25" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        Start
      </motion.button>
    </motion.div>
  );
}

// ── Playing Screen ──
function PlayingScreen({ word, letterOffsets, setLetterOffsets, targetKerning, showHint, setShowHint, onSubmit, onExit, round, totalRounds, draggingIndex, setDraggingIndex, timeLeft, timerDuration, streak, difficulty }: {
  word: string; letterOffsets: number[]; setLetterOffsets: (o: number[]) => void; targetKerning: number[];
  showHint: boolean; setShowHint: (v: boolean) => void; onSubmit: () => void; onExit: () => void;
  round: number; totalRounds: number; draggingIndex: number | null; setDraggingIndex: (i: number | null) => void;
  timeLeft: number; timerDuration: number; streak: number; difficulty: Difficulty;
}) {
  const handleDrag = useCallback((index: number, deltaX: number) => {
    setLetterOffsets(prev => {
      const next = [...prev];
      for (let i = index; i < next.length; i++) {
        next[i] = Math.round(Math.max(-30, Math.min(30, next[i] + deltaX * 0.2)));
      }
      return next;
    });
  }, [setLetterOffsets]);

  const letterColors = [
    "from-blue-400 to-cyan-300",
    "from-violet-400 to-purple-300",
    "from-pink-400 to-rose-300",
    "from-orange-400 to-amber-300",
    "from-emerald-400 to-teal-300",
    "from-blue-300 to-indigo-300",
    "from-rose-300 to-pink-200",
  ];

  const showGuides = difficulty === "easy";

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease: BRAND_EASE }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-muted-foreground/60 hover:text-foreground text-xs uppercase tracking-[0.15em] font-sans transition-colors cursor-pointer">
            ✕ Exit
          </button>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-sans">{round + 1}/{totalRounds}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < round ? "bg-primary" : i === round ? "bg-violet-400" : "bg-border"}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <motion.span className="text-xs font-sans font-bold text-amber-500" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {streak}x
            </motion.span>
          )}
          <TimerBar seconds={timeLeft} total={timerDuration} />
        </div>
      </div>

      {/* Word area — BIG letters */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 flex flex-col items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl" />

        <span className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] font-sans">Drag letters to kern</span>

        {/* Letters container with optional guides */}
        <div className="relative w-full flex justify-center py-4">
          {/* Guide lines for beginner */}
          {showGuides && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
                {/* Baseline */}
                <div className="w-96 h-px bg-primary/15" />
                {/* x-height line */}
                <div className="w-96 h-px bg-primary/10 -mt-16" />
                {/* Cap height line */}
                <div className="w-96 h-px bg-primary/10 mt-0" />
                {/* Vertical center */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/10" />
              </div>
            </div>
          )}

          {/* Draggable letters */}
          <div className="flex items-end justify-center select-none">
            {word.split("").map((letter, i) => (
              <DraggableLetter
                key={`${word}-${i}`}
                letter={letter}
                index={i}
                offset={letterOffsets[i] || 0}
                isDragging={draggingIndex === i}
                showHint={showHint}
                colorClass={letterColors[i % letterColors.length]}
                onDrag={(delta) => handleDrag(i, delta)}
                onDragStart={() => setDraggingIndex(i)}
                onDragEnd={() => setDraggingIndex(null)}
              />
            ))}
          </div>
        </div>

        <button onClick={() => setShowHint(!showHint)} className={`text-[10px] uppercase tracking-[0.15em] font-sans px-3 py-1.5 rounded-full border transition-all cursor-pointer ${showHint ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
          {showHint ? "Hint on" : "Hint"}
        </button>
      </div>

      <div className="flex justify-end">
        <motion.button onClick={onSubmit} className="px-8 py-3 bg-gradient-to-r from-primary to-violet-500 text-white font-sans text-xs uppercase tracking-[0.15em] font-bold rounded-full cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          Check
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Draggable Letter (BIG) ──
function DraggableLetter({ letter, index, offset, isDragging, showHint, colorClass, onDrag, onDragStart, onDragEnd }: {
  letter: string; index: number; offset: number; isDragging: boolean; showHint: boolean;
  colorClass: string; onDrag: (delta: number) => void; onDragStart: () => void; onDragEnd: () => void;
}) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    let lastX = e.clientX;
    onDragStart();
    const move = (e: PointerEvent) => { const d = e.clientX - lastX; lastX = e.clientX; onDrag(d); };
    const up = () => { onDragEnd(); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [onDrag, onDragStart, onDragEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); onDrag(-3); }
    else if (e.key === "ArrowRight") { e.preventDefault(); onDrag(3); }
  }, [onDrag]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative cursor-grab active:cursor-grabbing touch-none"
        style={{ x: offset }}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label={`Letter ${letter}`}
        aria-valuenow={offset}
        animate={{ scale: isDragging ? 1.08 : 1, y: isDragging ? -4 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span className={`text-8xl md:text-9xl lg:text-[10rem] font-display font-black bg-gradient-to-b ${colorClass} bg-clip-text text-transparent select-none leading-none`}>
          {letter}
        </span>

        {/* Drag hint dots */}
        <motion.div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5" animate={{ opacity: isDragging ? 0.8 : 0.15 }}>
          <div className="w-0.5 h-0.5 rounded-full bg-foreground/50" />
          <div className="w-0.5 h-0.5 rounded-full bg-foreground/50" />
          <div className="w-0.5 h-0.5 rounded-full bg-foreground/50" />
        </motion.div>
      </motion.div>

      <span className={`font-mono text-sm tabular-nums mt-2 ${Math.abs(offset) < 2 ? "text-emerald-500" : "text-foreground/50"}`}>
        {offset > 0 ? "+" : ""}{offset}
      </span>
    </div>
  );
}

// ── Result Screen (fun, not clinical) ──
function ResultScreen({ score, word, letterOffsets, targetKerning, round, totalRounds, scores, avgScore, isGameOver, isNewBest, bestScore, streak, difficulty, onNext, onRestart }: {
  score: number; word: string; letterOffsets: number[]; targetKerning: number[];
  round: number; totalRounds: number; scores: number[]; avgScore: number;
  isGameOver: boolean; isNewBest: boolean; bestScore: number; streak: number;
  difficulty: Difficulty; onNext: () => void; onRestart: () => void;
}) {
  const vibe = getScoreVibe(score);
  const message = getFunMessage(score);

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease: BRAND_EASE }}>
      {/* Score card — visual, not clinical */}
      <div className="bg-card border border-border rounded-xl overflow-hidden relative">
        {/* Score banner */}
        <div className={`relative px-6 py-8 md:py-10 flex flex-col items-center gap-3`}>
          <div className="absolute inset-0 bg-primary/[0.03]" />

          {/* Big score number */}
          <motion.span
            className="text-7xl md:text-8xl font-sans font-black text-primary"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {score}
          </motion.span>

          {/* Fun message */}
          <motion.p
            className="text-foreground/70 text-sm font-sans"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {message}
          </motion.p>

          {/* Streak badge */}
          {streak >= 2 && (
            <motion.span
              className="text-xs font-sans font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {streak}x streak
            </motion.span>
          )}
        </div>

        {/* Overlapping comparison */}
        <div className="border-t border-border px-6 py-6 flex flex-col items-center gap-4">
          <div className="relative h-20 w-full flex items-center justify-center">
            {/* Optimal (background layer) */}
            <div className="absolute flex items-center">
              {word.split("").map((letter, i) => (
                <span key={i} className="text-6xl md:text-7xl font-display font-black text-primary/15">{letter}</span>
              ))}
            </div>
            {/* Yours (foreground layer) */}
            <div className="absolute flex items-center">
              {word.split("").map((letter, i) => (
                <span key={i} className="text-6xl md:text-7xl font-display font-black text-foreground">{letter}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-sans">
            <span className="text-foreground/60">● Yours</span>
            <span className="text-primary/40">● Optimal</span>
          </div>
        </div>
      </div>

      {/* Running average */}
      {scores.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-sans">Avg</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-foreground font-sans text-sm font-bold">{avgScore}</span>
          {bestScore > 0 && <span className="text-muted-foreground text-xs font-sans">(best: {bestScore})</span>}
        </div>
      )}

      {/* Actions */}
      {!isGameOver ? (
        <div className="flex justify-end">
          <motion.button onClick={onNext} className="px-8 py-3 bg-foreground text-background font-sans text-xs uppercase tracking-[0.15em] font-bold rounded-full cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Next
          </motion.button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Final card */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/[0.03]" />
            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.25em] font-sans relative z-10">
              {isNewBest ? "New Best" : "Done"}
            </span>
            <motion.span
              className="text-6xl font-sans font-black text-primary relative z-10"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {avgScore}
            </motion.span>
            <span className="text-foreground/50 text-xs font-sans relative z-10">{DIFFICULTY_CONFIG[difficulty].label} • {totalRounds} rounds</span>
            {isNewBest && <motion.span className="text-xs font-sans font-bold text-primary relative z-10" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>Personal best</motion.span>}
          </div>

          <div className="flex gap-3">
            <motion.button onClick={onRestart} className="px-8 py-3 bg-gradient-to-r from-primary to-violet-500 text-white font-sans text-xs uppercase tracking-[0.15em] font-bold rounded-full cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Play Again
            </motion.button>
            <Link href="/work" className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 font-sans text-xs uppercase tracking-[0.15em] rounded-full transition-colors">
              View Work
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
