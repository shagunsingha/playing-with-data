# Playing with Data workshop

A responsive, four-part interactive workshop built from the supplied index-card PDF.

## Run locally

From this directory, start any static web server. Python is the simplest option:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

The site is plain HTML, CSS, and JavaScript; it has no build step. Its PDF-matched typefaces load from Google Fonts and require an internet connection on first load.

## Interaction

- Open the Guide to reveal the workshop activities in sequence.
- Drag the 13 button artifacts or the azalea with a mouse, pen, or touch.
- Keyboard users can focus a draggable artifact and use the arrow keys to move it. Hold Shift for smaller movements.
- Use the azalea size slider to resize the flower; moving or resizing it leaves varied heart confetti.
- Click the UNO card to flip through Wild, Skip, Reverse, Draw Two, and Draw Four cards. Each draw can be dramatically smaller or larger and moves to a random safe position within the box. Colored actions rotate through the original red, yellow, green, and blue palette.
- Each activity includes a reset control. The final button clears the workshop and returns to the Guide.
