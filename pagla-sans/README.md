# Pagla Sans

A custom typeface for the PaglaAI ecosystem, built for **PaglaOS**.

> "Pagla Sans begins with Open Sans."
> *Pagla Sans is lighter, more open, more premium minimal. Same DNA, different attitude.*

## Design

- **Base:** Open Sans (variable `wdth` 75–100, `wght` 300–800) — design by
  Steve Matteson, licensed under the SIL Open Font License 1.1 /
  Apache License 2.0.
- **Family:** Pagla Sans, weights **Light 300 / Regular 400 / Medium 500 /
  SemiBold 600 / Bold 700** — "Open Sans 300–700 mapped".
- **Perfect-circle O & P:** the `O` (outer outline *and* counterhole) and the
  `P` counterhole are mathematically perfect circles. Every contour point is
  projected radially onto an exact circle; extrema deviate <1 unit at 2048 UPM.
- **Personality:** lighter, more open, more premium-minimal. Same DNA,
  different attitude. Type is the primary interface.

## Usage

| Weight   | File                    | OS/2 |
|----------|-------------------------|------|
| Light    | `fonts/PaglaSans-Light.ttf`    | 300 |
| Regular  | `fonts/PaglaSans-Regular.ttf`  | 400 |
| Medium   | `fonts/PaglaSans-Medium.ttf`   | 500 |
| SemiBold | `fonts/PaglaSans-SemiBold.ttf` | 600 |
| Bold     | `fonts/PaglaSans-Bold.ttf`     | 700 |

Web (`@font-face`):

```css
@font-face {
  font-family: "Pagla Sans";
  src: url("fonts/PaglaSans-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
}
```

Specimen, brand application, and license are in the repo root.

## Files

- `fonts/` — static + variable TrueType and woff2 instances
- `specimen.html` — interactive type specimen (self-contained, woff2 embedded)
- `preview.png` — rendered preview
- `LICENSE.txt` — SIL Open Font License 1.1 (Open Sans, original copyright)

## Credits

- Open Sans: Steve Matteson, Google — SIL OFL 1.1 / Apache License 2.0.
- Pagla Sans custom work: PaglaAI.
