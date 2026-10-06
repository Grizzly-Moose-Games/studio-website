# studio-website
Grizzly Moose Games Inc. studio website

A static site (plain HTML, CSS and JavaScript, no build step) with three pages:

- `index.html`: Home
- `games.html`: Our Games and services
- `about.html`: About, values and team

## Running it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## How it's put together

- `css/style.css` holds every style. Colours and fonts are set as variables at the top.
- `js/main.js` draws the inked mountains and spruce trees on `<canvas>` elements
  (`data-draw="back"`, `"front"` and `"strip"`) and handles the forms.
- Fonts load from Google Fonts: Londrina Solid for headings, Literata for body text.
- The hand-drawn wobble on borders and drawings is the inline SVG `#wobble` filter at the top of each page.

## Forms

The site has no backend, so the "Notify Me" and contact forms open the visitor's
email app with a message to GrizzlyMooseGames@gmail.com. To collect submissions
directly, point them at a form service such as Formspree.
