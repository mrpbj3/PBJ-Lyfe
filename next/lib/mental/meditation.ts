// PBJ Health - Meditation Timer
// 5-minute default timer with callbacks

export function startFiveMinTimer(
  onTick: (secLeft: number) => void,
  onDone: () => void
): () => void {
  let left = 300; // 5 minutes in seconds
  const id = setInterval(() => {
    left -= 1;
    onTick(left);
    if (left <= 0) {
      clearInterval(id);
      onDone();
    }
  }, 1000);

  // Return cleanup function
  return () => clearInterval(id);
}

export function startCustomTimer(
  durationMin: number,
  onTick: (secLeft: number) => void,
  onDone: () => void
): () => void {
  let left = durationMin * 60;
  const id = setInterval(() => {
    left -= 1;
    onTick(left);
    if (left <= 0) {
      clearInterval(id);
      onDone();
    }
  }, 1000);

  return () => clearInterval(id);
}

export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
