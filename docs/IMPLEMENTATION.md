# Raagroom implementation

## Initial repository audit

Only README.md (`# sangeet`) existed. No app, package manifest, assets, or design code was present. The repository was clean on main at e2fb703, tracking origin/main at git@github.com:sukhpreet-fynd/sangeet.git. The requested first commit and push completed before app work began. Existing README content was retained.

## Plan and resulting architecture

1. **Components/files:** Vite React/TypeScript app; instrument picker/art/surface, preset player, loop station, guide; music and persistence modules separate from presentation.
2. **Audio:** One gesture-unlocked Web Audio context. Five pitched oscillator/filter/envelope profiles plus an eight-piece synthesized drum kit; pointer, hover, and keyboard tokens; bounded polyphony and explicit release/disconnect.
3. **Responsive layout:** Quiet dark studio with horizontal instrument selector; large instrument visuals; stacked mobile controls; additional large string targets; faint decorative SUKHPREET background.
4. **Loop recording:** Eight-beat clock, sixteenth-note quantization, queued overdubs, captured note durations, up to eight layers, mute/delete, local storage, JSON export.
5. **Accessibility/performance:** Native interactive elements, accessible names, focus states, exact shortcut hints, reduced motion, pointer/visibility cleanup. No external assets/fonts, no sample downloads, lazy guide and near-viewport loop UI, SVG/CSS graphics.
6. **Verification:** TypeScript and production build; transport, synth, persistence and DOM interaction tests; Chrome desktop/mobile interaction checks.

## Verification record

- 76 tests pass across transport, synthesis, and interaction suites.
- Production build passes; approximately 88.4 KB gzip initial JS and 11.3 KB CSS. Guide ~1.1 KB and loop UI ~2.1 KB gzip load separately.
- Chrome: played all five instruments with keyboard/pointer controls; bass strum; preset play/pause/resume/restart; 0.5× speed; switching instruments during playback; practice waits and advances on correct input.
- Recorded a three-note keyboard take, added a three-note xylophone layer, verified two-layer playback, mute, stop, and removal. Test-created takes were removed afterward.
- Inspected 390×844 mobile xylophone and keyboard/preset layouts and desktop presentation. No app-origin console errors; unrelated installed Chrome extension errors were observed.
- Current songbook browser check: all four film-inspired presets reached completion (9.275s, 7s, 10.5s, 11.52s score durations). Observed active highlights on violin, keyboard, bass, xylophone and guitar; tested pause/resume, 0.5×→1.5× tempo, and switching the voice. All eight drum pads were triggered; mobile kit verified at 390×844 without horizontal overflow.
- Automated matrix checks every bundled preset on all six instruments; each of the four film-inspired presets also exercises play/pause/resume/restart/stop through the React UI.
- Synthetic pointer tests cover touch events, cancellation, hover gating/release, and sustained notes. Physical touchscreen latency and subjective timbre require target-device listening.

The supplied macOS temporary screenshot paths were blocked by OS permissions even after approval. Those images were not inspected or copied. Both original reference sites and Beatoven were inspected directly. Reference code, assets, wording, and music were not imported.
