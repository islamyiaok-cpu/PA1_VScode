# PA1 - 3D Shapes in WebGL

**Student name:** Islamiya Okassova
**Student ID:** 242322
**Course:** AR/VR/XR Applications (AR/VR/XR A AIB), 6B04103 AI Business, 3rd year

## Repository Link
https://github.com/islamyiaok-cpu/PA1_VScode 

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

## Files Submitted

- `index.html` - canvas, status label, script tag
- `index.js` - WebGL 1.0 logic, shaders, buffers and controls
- `README.md` - Variant info, run instructions, key map
- `writeup.pdf` - E1-E6 answers, screenshots, and development log 

## Environment 

Tested in Chrome on Windows. 