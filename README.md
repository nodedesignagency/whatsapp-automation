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
--brand: #16A34A;   --panel-w: 408px;
--brand-soft: #DCFCE7;   --sidebar-w: 236px;
--phone-scale: .58;      /* phone is built at 320px, scaled down to fit */
```

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
