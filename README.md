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
