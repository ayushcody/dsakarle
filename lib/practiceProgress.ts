const KEY = 'dsakarle_practice_v1';

type PracticeState = {
  solved: string[]
  attempted: string[]
  streak: number
  lastSolveDate: string
};

const EMPTY: PracticeState = { solved: [], attempted: [], streak: 0, lastSolveDate: '' };

function read(): PracticeState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return EMPTY;
  }
}

function write(state: PracticeState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

const dayKey = (d: Date) => d.toLocaleDateString('en-CA');

export function getPracticeState(): PracticeState {
  const s = read();
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const alive = s.lastSolveDate === dayKey(new Date()) || s.lastSolveDate === yesterday;
  return { ...s, streak: alive ? s.streak : 0 };
}

export function markAttempted(id: string) {
  const s = read();
  if (!s.attempted.includes(id)) write({ ...s, attempted: [...s.attempted, id] });
}

export function toggleSolved(id: string) {
  const s = read();
  if (s.solved.includes(id)) {
    write({ ...s, solved: s.solved.filter((x) => x !== id) });
    return;
  }
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const streak = s.lastSolveDate === today ? s.streak : s.lastSolveDate === yesterday ? s.streak + 1 : 1;
  write({
    solved: [...s.solved, id],
    attempted: s.attempted.includes(id) ? s.attempted : [...s.attempted, id],
    streak,
    lastSolveDate: today,
  });
}
