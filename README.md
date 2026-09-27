# sangeet

## Raagroom

An original, dark interactive music playground built with React, TypeScript, Vite, and the Web Audio API. Includes six playable instruments, hover/touch/keyboard input, event-based preset songs, guided practice, and an eight-layer loop station. The background signature and footer credit Sukhpreet Singh Lohiya.

### Run

Use Node 22.12+ or Node 24+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite serves the development app at `http://127.0.0.1:5173`. Deploy the generated `dist/` directory to a static host. No backend, API keys, microphone permissions, or remote audio assets are required.

### Playing

Click **Enable sound** or play a note to initialize audio. Hover only plays after audio has been enabled; it never creates or resumes an audio context. Turn **Hover play** off when you prefer deliberate presses.

| Instrument | Keyboard | Interaction |
| --- | --- | --- |
| Guitar | A S D F G H | Standard open E2 A2 D3 G3 B3 E4; select fret 0–24. Hover/pluck a string, drag across strings, or use ↑/↓ to strum. |
| Bass | A S D F | Standard open E1 A1 D2 G2; fret 0–24, pluck, hover, or strum. |
| Violin | A S D F G H J K | C4–C5 major scale. Hold a key/pointer to sustain; hover sustains until pointer leave. |
| Xylophone | A S D F G H J K | C4–C5 major scale, short wooden mallet tones. |
| Keyboard | A W S E D F T G Y H U J K | C4–C5 chromatic keys. Hold for sustain and play multiple keys together. |

| Drums | A S D F G H J K | Kick, snare, closed hat, open hat, low tom, high tom, crash, ride. Tap or hover; each hit decays naturally. |

Violin, xylophone, and keyboard have octave shifts. Each visible control displays its actual pitch and shortcut. Mobile guitar/bass have larger secondary string buttons. Enter/Space operates a focused note button; **Escape** stops everything. Switching instruments or losing window focus releases held notes. Hiding/leaving the page stops all playback and cancels unfinished takes.

These are synthesized timbres approximating the instruments, with original SVG/CSS illustrations. They are not sampled acoustic recordings.

### Preset songs and Practice Mode

The songbook has one original practice melody and **four original Indian-film-inspired compositions**: Monsoon window, Marigold walk, Rooftop lanterns, and Saffron sky. Each includes complete note-event data. These are original Bollywood-style instrumental demos, with no commercial song titles or transcriptions. Only playable entries appear in the selector; the Bollywood collection appears when licensed songs are added.

Play, pause/resume, stop, restart, and change tempo from 0.5× to 1.5×. The progress display uses the selected speed. Instrument changes preserve the melody position and replay the current note with the new voice. Guitar performs preset pitches one octave lower; bass two octaves lower; violin, xylophone, and keyboard use the stored pitches. Drums interpret the same event timing as a percussion pattern, mapping pitch classes to the eight kit pieces.

Practice Mode waits for each exact target pitch. Play it on the instrument, press the highlighted target button, or press Space outside note/input controls. The target button provides access to notes beyond the visible octave/fret setting. For chord data, practice checks the notes sequentially in file order. Preset playback and loop playback are mutually exclusive so timing remains easy to follow.

### Adding licensed Bollywood note data

Edit `src/data/bollywood.json`. Choose a unique song ID and supply the complete note events and rights information. Its `$schema` points to `songs.schema.json` for editor validation; `PresetSong`/`SongLibrary` in `src/lib/songs.ts` provide TypeScript types. Runtime validation rejects malformed data, duplicate IDs, missing attribution, and Bollywood entries lacking a rights source.

```json
{
  "$schema": "./songs.schema.json",
  "version": 1,
  "songs": [
    {
      "id": "your-licensed-song",
      "title": "Your licensed song title",
      "collection": "Bollywood",
      "difficulty": "Easy",
      "composer": "Composer name",
      "license": {
        "kind": "licensed",
        "attribution": "Required credit and permission details",
        "source": "https://your-rights-source.example/permission"
      },
      "notes": [
        { "pitch": 60, "startTime": 0, "duration": 0.5, "velocity": 0.7 },
        { "pitch": 64, "startTime": 0.75, "duration": 1, "velocity": 0.6 }
      ]
    }
  ]
}
```

The example pitches are a format illustration, not a commercial melody. Replace them with data you own or are authorized to use.

- `pitch`: integer MIDI note, 24–108; middle C is 60.
- `startTime`: seconds from the beginning at 1× speed, sorted ascending. Equal start times produce chords.
- `duration`: seconds at 1×, 0.04–30; total song length at most 600 seconds.
- `velocity`: greater than 0 and at most 1; up to 10,000 events per song.
- `difficulty`: `Easy` or `Intermediate`; duration is calculated from the note data.
- `license.kind`: `licensed`, `CC0`, or `CC-BY-4.0` for Bollywood entries. Include attribution and a nonempty permission/source reference. Metadata is not proof of rights; verify actual permission yourself before adding music.

Keep IDs unique across files. Run `npm test` and `npm run build` after changes. Songs appear in the Bollywood selector automatically. No copyrighted MIDI scraping, commercial recording transcription, or prerecorded song audio is used.

### Loops and saving

Record two bars in 4/4; events snap to sixteenth notes. Subsequent takes queue at the next loop boundary. Up to eight layers can play together; mute and delete layers independently. Sustained note lengths are recorded, while plucked notes preserve their decay. Loop tempo can change while stopped, and an optional click track follows the loop clock.

Finished layers, session title, volume, and tempo save to this browser's local storage. The session JSON export is a data backup, not an audio file; import and WAV export are not implemented. Clearing browser storage removes the local session. Empty takes are discarded.

### Architecture and performance

- `src/audio/synth.ts`: single gesture-unlocked context, distinct harmonic profiles/envelopes, pitch-swept drums and filtered-noise/metallic cymbals, voice groups, smooth release, compressor, 64-voice cap.
- `src/audio/song-player.ts`: audio-clock anchored transport, 25ms scheduling checks with a 100ms lookahead, pause/resume and tempo re-anchoring, practice matching.
- `src/audio/looper.ts`: two-bar event capture and synchronized layered scheduling, including the first repeat.
- `src/lib/`: instrument/note mapping, preset validation, versioned session validation.
- `src/hooks/useRoom.ts`: lifecycle and input coordination without putting musical timing in React renders.
- `src/components/`: original SVG/CSS instruments, responsive controls, presets, loops, guide.

No third-party font, image, audio, or analytics requests. System fonts render immediately. Only the selected instrument SVG is mounted. The guide is dynamically imported on demand; the loop panel loads within 300px of the viewport with a reserved placeholder. Audio nodes disconnect when finished; inactive transports do not poll. The production app uses approximately 88 KB gzip initial JS and 11 KB CSS (exact output printed by Vite). This is a bundle measurement, not a measured network load-time guarantee.

Focus indicators, accessible names, native buttons/selects, keyboard hints, live announcements, reduced-motion styling, pointer cancellation, and visibility cleanup are included.

### Verification

`npm test` covers transport timing, pause/resume, speed changes, instrument changes, cancellation of future notes, practice matching, loop boundaries, overdubs, storage, rights metadata, gesture-only audio initialization, synth release/polyphony, all six instrument pointer/keyboard inputs, hover release, strum, and page-hide cleanup.

Manual browser checks cover desktop/mobile layout, each instrument, preset progress/pause/resume, instrument switching, practice advancement, and loop controls. Audio tests use mocked Web Audio nodes; subjective acoustic realism and physical-device touch/audio latency still need listening checks on target hardware.

UI references were used only for interaction and visual hierarchy inspiration: instruments-final.vercel.app, resonant-henna.vercel.app, and beatoven.ai. No reference code, artwork, song data, or copy was imported.
