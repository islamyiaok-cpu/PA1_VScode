## PA2 - Matrix Transformations and Perspective

**Student:** Okassova  Islamiya - **ID:** 242322

## Variant parameters (ID 242322)
| Rule | Digit | Result |
|---|---|---|
| Last digit → solid | 2 | Wedge, centred, fits in 1×1×1 |
| Orbit period T = 6 + last digit | 2 | T = 8 s |
| 2nd-to-last mod 3 | 2 mod 3 = 2 | Cube spins around normalised (1, 1, 1) at 1.2 rad/s |
| 3rd-to-last mod 3 | 3 mod 3 = 0 | Horizontal orbit (around y), radius 2.5 |
| 4th-to-last mod 2 | 2 mod 2 = 0 | Camera 0: eye (0, 2.5, 7), FOV 45* |

Fixed: solid self-spin 2.0 rad/s about its own y; scale pulse s(t) = 0.65 + 0.15·sin(2πt/3); target (0,0,0), up (0,1,0).
near = 1.0, far = 15.0 (closest eye–vertex distance ≈ 4.6, farthest ≈ 10.2).

## How to run
glMatrix 2.8.1 is loaded from cdnjs,internet connection is required. Serve the folder from a local web server and open it in Chrome / Firefox.

## Keys
| Key | Effect |
|---|---|
| P | Pause/ resume (freezes simulated time t) | 
| O | Toggle perspective<=>orthographic |
| + or = / − | FOV ±5*, limited to 20*–100* (perspective only) |
| ← / → | Orbit the camera eye around the y-axis by 5* per press |
| R | Reset camera (azimuth, FOV, projection) and time |

## Optional URL switches

* ?t=1.7453 - freeze time (E6, prints M*v, clip, NDC)
* ?near=6 - (E4a)
* ?aspect1=1 — (E4b)
* ?noclamp=1 - (E5)
* ?logdt=1 - (E5, mean/max dt over 5 s)
* ?e2=1 - (E2c, w demo)
* ?wire=1 - (E3)
* ?logorbit=1 - (E5)
