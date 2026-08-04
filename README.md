# WhatsApp Automation — Campaign Composer (static front-end)

Plain HTML/CSS/JS build of the campaign composer screen. No framework, no build
step — open `index.html` in a browser. Intended to be ported to Next.js by the
dev team, so the markup is component-shaped and the styling is token-driven.

```
index.html          the whole screen
css/styles.css      design tokens (:root) + component styles
js/app.js           prototype-only interactions
assets/             placeholder avatars + WhatsApp chat wallpaper (SVG)
```

## Structure

| Block | Class | Notes |
|---|---|---|
| Sidebar | `.sidebar` | logo, `.nav-item` list, `.account` card pinned to bottom |
| Workspace | `.workspace` | light rounded container holding panel + composer |
| Schedule panel | `.panel` | date strip, status tabs, new-draft row, search, scrolling list |
| Date pill | `.dpill` | `.is-active` = selected day |
| Status tabs | `.segmented` | `.is-active` = green pill |
| Campaign card | `.campaign` | `.is-selected` adds the green bottom rule |
| Composer | `.composer` | title input + `contenteditable` body |
| Phone preview | `.phone` | rendered at 320px and CSS-scaled via `--phone-scale` |
| Action bar | `.actionbar` | tool cluster, schedule/contact pills, Cancel / Confirm |

## Design tokens

All colours, radii, shadows and the three layout widths live in `:root` at the
top of `css/styles.css`. Swapping in exact Figma values means editing that block
only — nothing downstream hardcodes a colour.

```css
--brand: #38AE6A;                    --line: #EEEFF1;
--brand-soft: rgba(56,174,106,.10);  --panel-w: 396px;
--phone-scale: .58;   /* phone is built at 320px, scaled down to fit */
```

### Elevation

Figma's six drop shadows are stacked into one token rather than applied
separately — all six are `#2A3346` at 3–4%, and together they read as a single
soft shadow:

| Layer | Y | Blur | Spread | Opacity |
|---|---|---|---|---|
| `--sh-1` | 1 | 1 | -0.5 | 3% |
| `--sh-2` | 2 | 2 | -1 | 4% |
| `--sh-3` | 3 | 3 | -1.5 | 4% |
| `--sh-4` | 5 | 5 | -2.5 | 3% |
| `--sh-5` | 10 | 10 | -5 | 3% |
| `--sh-6` | 24 | 24 | -8 | 3% |

`--sh-md` is all six and is what raised surfaces use. `--sh-sm` is the first
three, for small in-list elements where the 24px layer would muddy the stack.
The selected date pill and campaign card carry no shadow at all.

### Selected state

The date pill and the campaign card share one construction, after the gradient
shadow technique from <https://lab01.dev/experiments/12/>. Three layers:

1. **Glow** — a blurred copy of the shape filled with the gradient, sitting
   under the bottom edge. Tints the face through the translucent surface and
   spills below as a coloured halo.
2. **Surface** — white at `--surface-op`, with a hairline ring and an inset
   white highlight.
3. **Ring** — a 1px gradient border, faded out toward the top.

Glow and surface are real elements (`.layer--glow`, `.layer--surface`) rather
than pseudo-elements: three paint layers need more than `::before`/`::after`,
and a negative `z-index` child would paint behind the panel's own background.

The ring is one pseudo-element. It exposes a 1px padding ring through a
padding-box mask, then multiplies that by a vertical fade:

```css
mask-image: linear-gradient(to top, #000, transparent 100%),
            linear-gradient(#000 0 0),
            linear-gradient(#000 0 0);
mask-clip: border-box, content-box, border-box;
mask-composite: intersect, exclude, add;
```

Every parameter is a token (`--glow-*`, `--ring-op`, `--surface-op`).

**Scale only blur and offset; keep everything else verbatim.** The reference
values (glow 90%/60%, bottom −2px, blur 15px at .5, face white/80, ring .3)
are tuned for a 60px-tall button. Blur and the bottom offset scale with shape
height — ~×1.8 for the 110px card (27px), ~×0.85 for the 51px pill (13px) —
and every other number carries over unchanged. Hand-tweaking the opacities
instead of scaling is what made earlier attempts look harsh.

### List background

The campaign list is tinted (`--bg-list: #F3F2F2`, the reference demo's own frame colour) because the gradient shadow
needs something to sit against — on white the halo all but disappears and the
effect reduces to a coloured 1px edge. To go back to a white list:

```html
<html data-list-bg="white">
```

That switches `--bg-list` and `--chip` together; the time chip needs to stay
legible against whichever one is in play. Nothing else changes.

`tools/easing_gradient.py` regenerates `--grad` for any two colours, using the
16-stop easing curve measured off that demo — the extra stops are what keep the
blend from showing a midpoint band:

```
python3 tools/easing_gradient.py "#38AE6A" "#C9DE4F"
```

## Fonts

**Open Runde** (SIL OFL 1.1) in four weights, self-hosted from
`assets/fonts/`. License text ships alongside it.

Note for the Next.js port: Apple's SF Pro / SF Pro Rounded cannot be used here.
Apple's license covers designing and building interfaces for its own platforms
and does not permit embedding the font in a web page. Open Runde is the
open-licensed stand-in.

## Phone preview

Built as real DOM (bubbles, file chips, ticks) rather than an image, so it can
mirror the composer live. `js/app.js` already pipes typed text into a
`.bub--live` bubble at the end of the thread.

## Prototype interactions

`js/app.js` only handles selection state (date pills, status tabs, nav, campaign
cards) and the live preview. There is no data layer — every campaign, avatar and
timestamp in the markup is placeholder content.

## Responsive

Breakpoints at 1280 / 1080 / 860px shrink the panel, drop the sidebar, then
stack the panel above the composer and hide the phone preview.
