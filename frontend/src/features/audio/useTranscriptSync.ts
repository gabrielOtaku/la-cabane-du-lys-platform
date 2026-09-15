import { useMemo } from "react";
import type { TranscriptLine } from "@/types";

/** Index de la dernière ligne dont le timecode est atteint (recherche dichotomique). */
export function activeLineIndex(transcript: TranscriptLine[], seconds: number): number {
  let lo = 0;
  let hi = transcript.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (transcript[mid].t <= seconds) { found = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return found;
}

/** Associe le temps courant aux segments de transcription. */
export function useTranscriptSync(transcript: TranscriptLine[] | undefined, seconds: number) {
  const lines = useMemo(() => (transcript ?? []).slice().sort((a, b) => a.t - b.t), [transcript]);
  const activeIndex = useMemo(() => activeLineIndex(lines, seconds), [lines, seconds]);
  return { lines, activeIndex };
}
