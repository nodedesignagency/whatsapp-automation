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
--brand-soft: rgba(56,174,106,.10);  --panel-w: 388px;
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

The outline is a box-shadow ring rather than a border, so the green lip can
paint over it:

```css
.campaign            { box-shadow: 0 0 0 1px var(--stroke); }
.campaign.is-selected{ box-shadow: 0 3px 0 0 var(--brand), 0 0 0 1px var(--stroke); }
```

Two things make this read as one stroke rather than two:

- The lip is a copy of the *very same silhouette* offset 3px down, so its
  corner curve is a pure translation of the card's and the band keeps an even
  thickness the whole way round. Earlier attempts stacked two separately
  stroked shapes whose corners could not line up — that was the ragged seam.
- Box-shadows paint first-listed on top, so the lip covers the ring's bottom
  edge where they overlap. The outline reads as one stroke that turns green at
  the bottom, instead of a grey stroke with a second green one beneath it.

`box-shadow` does not affect layout, so the row reserves the 3px itself
(`.slot` padding, `.datestrip` padding).

### Status tabs

The highlight is one rectangle that travels between tabs rather than fading in
place. `--i` on `.segmented__track` is the active index, and the thumb's slot
pitch is its own width plus the 6px gap, so a percentage `translateX` does the
arithmetic without measuring anything:

```css
transform: translateX(calc((100% + 6px) * var(--i, 2)));
transition: transform .34s cubic-bezier(.34, 1.12, .42, 1);
```

The easing overshoots by about a pixel at the end — enough to read as a
settle, not a bounce. Disabled under `prefers-reduced-motion`.

### Month popover

The week strip only reaches seven days, so the month label opens a full-month
grid (`.monthpop`). Days carrying campaigns in the current tab get a dot,
picking one moves the strip to that week and scrolls the list to it. Closes on
outside click or Escape.

### Empty draft state

`Create New Draft` pushes an empty campaign and selects it, so the composer
falls to its placeholders. Both the title and the message body use
`--text-placeholder` (`#88888A`) when empty and `--text-strong` (`#292929`)
once typed into — the title through `::placeholder`, the body through
`:empty::before`, so neither needs JS to swap colour.

### Composer title

A `contenteditable` div, not an `<input>`. A long campaign title has to wrap
onto a second line, and an input can only clip or ellipsise. It shares the
message body's placeholder mechanism (`:empty::before`).

### Drafts

A draft carries no schedule (`date: null, time: null`). The Draft tab therefore
ignores the week strip, renders one undated group instead of day headers, and
its cards have no time chip. Undated campaigns also do not mark the date
strip's dots.

Confirm is what schedules a draft — it sets the date, flips the status and
moves it to the Scheduled tab. It currently takes the date selected in the
strip; a real `Set Schedule` picker should supply it instead.

Cancel on a draft that has been typed into opens the save prompt
(`#saveBackdrop`) rather than discarding silently. Save keeps it in Draft,
Discard removes it. Escape and a backdrop click both close without acting.

The prompt is illustrated: `assets/draft-illustration.jpg` sits full-bleed
across the top at a 2.2:1 ratio, with the panel behind it filled `#DFF0DC` so
the modal holds its shape while the image loads. Generated with Magnific,
cropped and re-encoded to 9KB.

### Responsive

Audited at 1600 / 1440 / 1366 / 1280 / 1180 / 1100 / 1024 / 960 / 860 / 768
for elements overflowing their box or escaping the workspace's clip.

The action bar was the culprit below ~1400px: it was `nowrap`, so its
min-content width propagated up and forced the composer grid wider than the
workspace, which then clipped it. Two fixes:

- `flex-wrap: wrap` on `.actionbar`, so its min-content no longer drives the
  grid and it reflows rather than clipping.
- Below 1400px the two pill buttons drop their labels to icons (the text stays
  for screen readers), which buys ~180px — more than the shortfall, so the bar
  stays on one row.

Below 1160px the panel narrows past what seven 38px pills plus two arrows
need, so the head padding and arrows shrink rather than the pills.

### Set Schedule and Select Contact

Both are popovers anchored to their pill buttons, not full modals — the
composer stays visible behind them, and both write straight through to the
selected campaign.

**Set Schedule** is a 560px popover anchored to its pill, running three steps
with one decision each. The footer's primary button carries the step:
Continue -> Confirm -> Save.

1. **Date** — a full month grid: 82px cells, the number top-right, and the
   titles of campaigns already booked that day, so you are not scheduling
   blind. Past days are disabled rather than accepted-then-rejected. The grid
   scrolls; the header, month bar and footer stay put.
2. **Time** — three snap-scrolling wheels (hour, minute in 5s, AM/PM) with the
   selection under a centre band and the neighbours faded out. Clicking an item
   scrolls it to centre, so it works without dragging.
3. **Confirm** — the chosen date and time with a Change link back to step 1,
   plus the repeat row.

Edits are held in a `pending` object and only written on Save, so Cancel
genuinely cancels.

**Repeat** opens nested on top: how often (Once / Daily / Weekly / Monthly),
which days when weekly, and until when (I stop it / a date / after N sends).
It reads back in plain words — "Every week on Thu, Fri, 4 times".

Popovers are tracked in a stack rather than a single slot, because Repeat opens
over the schedule popover and must not close it; outside clicks and Escape only
dismiss the topmost.

**Select Contact** puts saved lists above individual people. For broadcasting,
one tap on a list is 128 recipients; picking people one at a time does not
scale past a handful. Each list row shows its size, one search filters both
sections, and the footer keeps a running total.

Both pill buttons then carry the current selection as their label, so the
action bar states what will happen without opening anything.

### Action bar

The Cancel / Confirm group matches the Figma frame at 146 x 36: Cancel, a 12px
gap, a 1px x 16px hairline at `#292929` / 15%, another 12px gap, then Confirm.
Confirm carries the linear gradient `#42423C -> #2F2F2C`, top to bottom.

### Time chip

The chip and the card overlap by 4px, per Figma. The chip is inset 16px to
line up with the card's padding, has square bottom corners, and sits at
`z-index: 0` so the card (at `z-index: 1`) covers the overlap — the chip runs
into the card's top edge rather than sitting on it.

### List background

The campaign list is white. Set `data-list-bg="tinted"` on `<html>` for the
grey list (`#F3F2F2`) that the gradient shadow below needs; `--chip` follows
so the time labels stay legible against either.

### Gradient shadow (available, unused)

`.gradient-shadow` implements the technique from
<https://lab01.dev/experiments/12/> — a blurred gradient copy of the shape
under its bottom edge, a translucent surface, and a 1px gradient border that
fades toward the top. It is not used on this screen; it is kept for a focal
element on a quiet page, which is where it earns its keep.

```html
<div class="gradient-shadow">
  <span class="layer layer--glow"></span>
  <span class="layer layer--surface"></span>
  ... content ...
</div>
```

Glow and surface are real elements because a negative `z-index` child would
paint behind an ancestor's background. The ring is one pseudo-element that
exposes a 1px padding ring through a padding-box mask, then multiplies it by a
vertical fade:

```css
mask-image: linear-gradient(to top, #000, transparent 100%),
            linear-gradient(#000 0 0), linear-gradient(#000 0 0);
mask-clip: border-box, content-box, border-box;
mask-composite: intersect, exclude, add;
```

It needs a tinted ground; on white the halo all but disappears and only the
ring survives. Scale `--glow-blur` and `--glow-y` with the shape's height (the
reference is 15px / −2px on a 60px-tall button) and leave every other value
alone. `tools/easing_gradient.py` regenerates `--grad` for any two colours
using the reference's 16-stop curve.

## Fonts

**Open Runde** (SIL OFL 1.1) in four weights, self-hosted from
`assets/fonts/`. License text ships alongside it. It is the only webfont —
nothing falls back to Inter or a system face. The stack ends in system fonts
purely as a last resort if the files 404.

Its 2512 glyphs cover everything this UI uses, including `₹`, the em dash and
curly quotes, so no character silently swaps to a fallback face mid-sentence.

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
