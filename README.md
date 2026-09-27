# PA1 - 3D Shapes in WebGL

**Student ID:** 242322
**Course:** AR/VR/XR Applications (AR/VR/XR A AIB), 6B04103 AI Business, 3rd year

## Variant

- Last digit of ID (2) -> **Wedge (ramp)**: lying on the floor, slope rising towards the back. Reference vertex count: 24.
- Second-to-last digit of ID (2) -> 2 mod 4 = 2 -> offset **(o_x, o_y) = (+0.15, -0.15)**. Visible side faces with depth test on: **bottom and right**.

## How to run

1. Keep `index.html` and `index.js` in the same folder.
2. Serve the folder with a local web server (do not open the file directly):
   - VS Code "Live Server" extension, or
   - `python -m http.server` from inside the folder, then open `http://localhost:8000`, or
   - `http-server` (Node.js), or
   - Servez.
3. Open the page in current Chrome or Firefox.

## Key map

| Key | Effect |
|---|---|
| 1 | gl.TRIANGLES (default) |
| 2 | gl.LINE_LOOP |
| 3 | gl.LINES |
| 4 | gl.LINE_STRIP |
| 5 | gl.POINTS |
| 6 | gl.TRIANGLE_STRIP |
| D | Toggle depth testing on/off |
| S | Swap draw order (cube first <-> solid first) |

The on-screen status label shows the student ID, current drawing mode, depth-test state and draw order, and updates on every key press.

## Files

- `index.html` - canvas, status label, script tag
- `index.js` - all JavaScript and GLSL (shaders, buffers, drawing, controls)
- `README.md` - this file
- `writeup.docx` / `writeup.pdf` - E1-E6 answers and development log (screenshots added separately)
