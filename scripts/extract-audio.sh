#!/bin/zsh
# Turn finished seminar videos in ~/Downloads into small mono audio tracks for Whisper,
# verify the audio, then delete the video (policy approved by Serhii 2026-10-09).
# Usage: extract-audio.sh <seminar-number> [--once]
#   Watches ~/Downloads for completed *.mp4 whose name starts with "ПК-<N>" (or any mp4 listed
#   in EXTRA), skips files still being written (.crdownload present or size changing),
#   writes  ~/Downloads/Kate/propedevtika/seminar-<N>/audio/<name>.m4a  (AAC 48 kbps, 16 kHz, mono)
#   and deletes the mp4 only when ffprobe durations match within 2 s.
set -u
N="${1:?seminar number}"; ONCE="${2:-}"
DL="$HOME/Downloads"; OUT="$DL/Kate/propedevtika/seminar-$N/audio"; LOG="$DL/Kate/propedevtika/seminar-$N/extract-audio.log"
mkdir -p "$OUT"
log(){ print -r -- "$(date '+%F %T') $*" | tee -a "$LOG"; }
dur(){ ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$1" 2>/dev/null | cut -d. -f1; }
while true; do
  found=0
  for f in "$DL"/"ПК-$N. Часть "[0-9].mp4(N) "$DL"/"ПК-$N. Часть-"[0-9].mp4(N); do   # lecture parts only; short technique clips stay as video
    [[ -f "$f" ]] || continue
    base="${f:t:r}"; dst="$OUT/$base.m4a"
    [[ -f "$dst" ]] && continue
    s1=$(stat -f %z "$f"); sleep 20; s2=$(stat -f %z "$f"); [[ "$s1" == "$s2" ]] || { log "still growing: $base"; continue; }
    found=1; log "extracting: $base ($((s1/1048576)) MB)"
    if ffmpeg -nostdin -v error -i "$f" -vn -ac 1 -ar 16000 -c:a aac -b:a 48k -f ipod "$dst.part" && mv "$dst.part" "$dst"; then
      dv=$(dur "$f"); da=$(dur "$dst")
      if [[ -n "$dv" && -n "$da" && $(( dv > da ? dv - da : da - dv )) -le 2 ]]; then
        rm -f "$f"; log "ok: $base  video=${dv}s audio=${da}s  -> $(du -h "$dst" | cut -f1); video deleted"
      else
        log "DURATION MISMATCH, video kept: $base video=${dv}s audio=${da}s"
      fi
    else
      log "ffmpeg FAILED, video kept: $base"; rm -f "$dst.part"
    fi
  done
  [[ "$ONCE" == "--once" ]] && break
  (( found )) || sleep 60
done
