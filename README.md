# Assessment Gym

Practice simulations of the 13 game formats used in HireVue-style game-based assessments, in a static site with no build step.

## What's included

- **13 playable games**:
  - **Cognitive:** Numerosity, Flashback (n-back), Digitspan, Disconumbers
  - **Spatial:** Pathfinder, Puzzle, Shapedance, Singularity
  - **Personality & emotions:** Portrait, PortraitXT, E-Motions, Teamchat, Pulse
- **Game features:** each game runs on its original time limit, with levels that adapt to how you're doing, live feedback and keyboard controls. Every game has a 1-minute warm-up mode.
- **Results screen** with detailed stats or a personality profile.
- **Game pages** with how-to-play steps, skills assessed, a strategy guide, an FAQ and your attempt history.
- **Mock assessment:** five random games played back to back.
- **7-day prep plan:** a checklist that saves your ticks.
- **Teamchat review:** every reply is rated, and the end review shows the strongest reply for each situation.
- **Progress page:** how your score changes from attempt to attempt, plus copy, restore and reset for your data.
- **Works offline** once loaded (service worker on GitHub Pages), on phones and on desktops.

Results are stored only in your browser's `localStorage`.

## Planned

- **Video interview drill:** built but hidden for now (`SHOW_INTERVIEW` in `core.js`). It has single or 5-question interviews, timers, retakes, a STAR self-review and optional local webcam recording.

## Run locally

```sh
python -m http.server 8765
```

Then open http://localhost:8765.

## Files

| File | Contents |
| --- | --- |
| `index.html` | Page shell and styles |
| `core.js` | Game list, game engine, storage, charts, pages, mock assessment, interview drill |
| `games-a.js` | Cognitive and spatial games, plus Pulse |
| `games-b.js` | Portrait, PortraitXT, E-Motions, Teamchat |

## Disclaimer

This is an independent practice tool. It is not affiliated with HireVue or any employer. The games are original simulations of common assessment formats, for practice only.
