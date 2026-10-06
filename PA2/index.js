// PA2 - Matrix Transformations and Perspective
// Student ID: 242322 (Okassova)
// Variants: last digit 2 = Wedge
//           6 + 2 - orbit period T = 8 s
//           2nd-to-last 2 mod 3=2 - normalised 
//           3rd-to-last 3 mod 3=0 - horizontal orbit (y)
//           4th-to-last 2 mod 2=0 - camera 0, FOV 45 deg

const STUDENT_ID = "242322";
const ORBIT_PERIOD = 8.0;                 
const CUBE_SPIN = 1.2;                    // rad/s
const CUBE_AXIS = [1, 1, 1];              
const ORBIT_RADIUS = 2.5;
const SOLID_SPIN = 2.0;                   // rad/s, y
const EYE0 = [0, 2.5, 7];
const TARGET = [0, 0, 0];
const UP = [0, 1, 0];
const FOV0 = 45;                          // degrees
const NEAR = 1.0;   // min distance over orbit ~4.6, 1.0 never clips
const FAR = 15.0;   // max distance ~10.2, 15 never clips

// Debug switches for the write-up
//  ?t=1.7453 freeze time. ?near=6 
//  ?aspect1=1 hard-code aspect. ?noclamp=1 remove dt clamp
//  ?logdt=1 for 5 s, then mean/max. ?e2=1 w demo in console
//  ?wire=1     draw the cube as lines (E3)           ?logorbit=1 log real time per orbit (E5)
const Q = new URLSearchParams(location.search);
const DEBUG = {
  t: Q.has("t") ? parseFloat(Q.get("t")) : null,
  near: Q.has("near") ? parseFloat(Q.get("near")) : NEAR,
  aspect1: Q.has("aspect1"),
  noclamp: Q.has("noclamp"),
  logdt: Q.has("logdt"),
  e2: Q.has("e2"),
  wire: Q.has("wire"),
  logorbit: Q.has("logorbit"),
};

main();

function main() {
  /*========== Create a WebGL Context ==========*/
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("WebGL unavailable");
    return;
  }
  // Support glMatrix 2.8.1 and newer builds.
  const G = window.glMatrix || {};
  const mat4 = window.mat4 || G.mat4;
  const vec3 = window.vec3 || G.vec3;
  const vec4 = window.vec4 || G.vec4;
  if (!mat4 || !vec3 || !vec4) {
    console.log("glMatrix is not loaded: check the <script> tag order in index.html");
    return;
  }

  /*========== Define and Store the Geometry ==========*/
  const RED = [1, 0, 0, 1], GREEN = [0, 1, 0, 1], BLUE = [0, 0, 1, 1];
  const YELLOW = [1, 1, 0, 1], MAGENTA = [1, 0, 1, 1], CYAN = [0, 1, 1, 1];
  const WHITE = [1, 1, 1, 1], ORANGE = [1, 0.5, 0, 1];
  const GRAY = [0.6, 0.6, 0.6, 1], PURPLE = [0.5, 0, 0.5, 1];
  const repeat = (c, n) => Array.from({ length: n }, () => c).flat();

  // Cube -0.5 to +0.5, centred at origin 
  const c = {
    FBL: [-0.5, -0.5, -0.5], FBR: [0.5, -0.5, -0.5], FTR: [0.5, 0.5, -0.5], FTL: [-0.5, 0.5, -0.5],
    BBL: [-0.5, -0.5, 0.5], BBR: [0.5, -0.5, 0.5], BTR: [0.5, 0.5, 0.5], BTL: [-0.5, 0.5, 0.5],
  };
  const cubePositions = [
    ...[c.FBL, c.FBR, c.FTR, c.FBL, c.FTR, c.FTL],  // front
    ...[c.BBR, c.BBL, c.BTL, c.BBR, c.BTL, c.BTR],  // back
    ...[c.FTL, c.FBL, c.BBL, c.FTL, c.BBL, c.BTL],  // left
    ...[c.FBR, c.FTR, c.BTR, c.FBR, c.BTR, c.BBR],  // right gradient
    ...[c.FTL, c.BTL, c.BTR, c.FTL, c.BTR, c.FTR],  // top
    ...[c.FBL, c.BBR, c.BBL, c.FBL, c.FBR, c.BBR],  // bottom
  ].flat();
  const cubeColors = [
    ...repeat(RED, 6), ...repeat(GREEN, 6), ...repeat(BLUE, 6),
    ...YELLOW, ...MAGENTA, ...CYAN, ...YELLOW, ...CYAN, ...WHITE,
    ...repeat(ORANGE, 6), ...repeat(GRAY, 6),
  ];

  // Wedge: triangular prism centred on its own origin, fits in a 1x1x1 box
  const P1 = [-0.5, -0.25, -0.5], P2 = [0.5, -0.25, -0.5];
  const P3 = [-0.5, -0.25, 0.5], P4 = [0.5, -0.25, 0.5];
  const P5 = [-0.5, 0.25, 0.5], P6 = [0.5, 0.25, 0.5];
  const wedgePositions = [
    ...[P1, P2, P4, P1, P4, P3],  // bottom
    ...[P3, P4, P6, P3, P6, P5],  // back vertical
    ...[P1, P2, P6, P1, P6, P5],  // slope gradient
    ...[P1, P3, P5],              // left end triangle
    ...[P2, P4, P6],              // right end 
  ].flat();
  const wedgeColors = [
    ...repeat(GRAY, 6), ...repeat(PURPLE, 6),
    ...RED, ...GREEN, ...BLUE, ...RED, ...BLUE, ...YELLOW,
    ...repeat(ORANGE, 3), ...repeat(CYAN, 3),
  ];

  const positions = [...cubePositions, ...wedgePositions];
  const colors = [...cubeColors, ...wedgeColors];
  const CUBE_FIRST = 0;
  const CUBE_COUNT = cubePositions.length / 3;     
  const SOLID_FIRST = CUBE_COUNT;
  const SOLID_COUNT = wedgePositions.length / 3;   
  console.assert(CUBE_COUNT === 36 && SOLID_COUNT === 24, "unexpected vertex counts");
  console.assert(colors.length / 4 === positions.length / 3, "colour/position count mismatch");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  /*========== Shaders ==========*/
  const vsSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main() {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
      vColor = aVertexColor;
    }
  `;
  const fsSource = `
    varying lowp vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;
  gl.useProgram(program);

  /*====== Attribute pointers and uniform locations ======*/
  const posLoc = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posLoc);

  const colLoc = gl.getAttribLocation(program, "aVertexColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colLoc);

  const modelLoc = gl.getUniformLocation(program, "uModelMatrix");
  const viewLoc = gl.getUniformLocation(program, "uViewMatrix");
  const projLoc = gl.getUniformLocation(program, "uProjectionMatrix");

  // One-time GL state
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.05, 0.05, 0.08, 1);
  gl.clearDepth(1.0);

  /*========== State ==========*/
  const state = { t: 0, paused: false, ortho: false, fovDeg: FOV0, azimuth: 0 };
  if (DEBUG.t !== null) { state.t = DEBUG.t; state.paused = true; }
  let aspect = 1;

  // Reusable matrices
  const projection = mat4.create();
  const view = mat4.create();
  const eye = vec3.create();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    aspect = DEBUG.aspect1 ? 1 : canvas.clientWidth / canvas.clientHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function resetCamera() {
    state.azimuth = 0;
    state.fovDeg = FOV0;
    state.ortho = false;
    state.t = DEBUG.t !== null ? DEBUG.t : 0;
  }

  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "p": case "P":
        state.paused = !state.paused; break;
      case "o": case "O":
        state.ortho = !state.ortho; break;
      case "+": case "=":   // + needs Shift, so accept = too
        if (!state.ortho) state.fovDeg = Math.min(100, state.fovDeg + 5); break;
      case "-": case "_":
        if (!state.ortho) state.fovDeg = Math.max(20, state.fovDeg - 5); break;
      case "ArrowLeft":
        state.azimuth -= (5 * Math.PI) / 180; event.preventDefault(); break;
      case "ArrowRight":
        state.azimuth += (5 * Math.PI) / 180; event.preventDefault(); break;
      case "r": case "R":
        resetCamera(); break;
    }
  });

 /*========== Model matrices ==========*/
 // glMatrix right-multiplies: M = M * X; last call applies first
  function cubeModelMatrix(t) {
    const m = mat4.create();
    mat4.rotate(m, m, CUBE_SPIN * t, vec3.normalize(vec3.create(), CUBE_AXIS));
    return m;
  }

  // M = R_orbit * T * R_self * S   
  function solidModelMatrix(t) {
    const orbitAngle = (2 * Math.PI * t) / ORBIT_PERIOD;
    const s = 0.65 + 0.15 * Math.sin((2 * Math.PI * t) / 3);
    const m = mat4.create();
    mat4.rotate(m, m, orbitAngle, [0, 1, 0]);          // R_orbit-horizontal orbit around y
    mat4.translate(m, m, [ORBIT_RADIUS, 0, 0]);       // move to orbit radius
    mat4.rotate(m, m, SOLID_SPIN * t, [0, 1, 0]);       // self-rotation around y
    mat4.scale(m, m, [s, s, s]);                       // S pulsing scale
    return m;
  }

  /*========== Status label / fps ==========*/
  const statusEl = document.querySelector("#status");
  const frameTimes = [];               // real timestamps (ms)
  function updateStatus(nowMs) {
    frameTimes.push(nowMs);
    while (frameTimes.length && nowMs - frameTimes[0] > 1000) frameTimes.shift();
    const fps = frameTimes.length;     // frames during the last 1000 ms
    statusEl.textContent =
      `ID: ${STUDENT_ID}\n` +
      `Projection: ${state.ortho ? "Orthographic" : "Perspective"}\n` +
      `FOV: ${state.fovDeg}\u00B0${state.ortho ? " (not used)" : ""}\n` +
      `t: ${state.t.toFixed(1)} s${state.paused ? " (paused)" : ""}\n` +
      `FPS: ${fps}`;
  }

  /*========== Debug helpers for the writeup ==========*/
  if (DEBUG.e2) {
    const tr = mat4.fromTranslation(mat4.create(), [2, 3, 4]);
    console.log("E2c direction w=0:", Array.from(vec4.transformMat4(vec4.create(), [1, 0, 0, 0], tr)));
    console.log("E2c position  w=1:", Array.from(vec4.transformMat4(vec4.create(), [1, 0, 0, 1], tr)));
  }
  const dtLog = [];
  let dtLogDone = false;
  let dtStart = null;
  let e6Done = false;
  let orbitCount = 0;
  let realStart = null;

  /*========== Drawing (every frame) ==========*/
  let then = null;
  function render(nowMs) {
    const now = nowMs * 0.001;
    let dt = then === null ? 0 : now - then;
    if (!DEBUG.noclamp) dt = Math.min(dt, 0.1);
    if (DEBUG.noclamp && dt > 0.5) console.log("large dt:", dt.toFixed(2), "s");
    then = now;
    if (!state.paused) state.t += dt;

    if (DEBUG.logorbit) {
      if (realStart === null) realStart = now;
      while (state.t >= (orbitCount + 1) * ORBIT_PERIOD) {
        orbitCount++;
        console.log(`orbit ${orbitCount}: simulated t = ${state.t.toFixed(2)} s, real time = ${(now - realStart).toFixed(2)} s`);
      }
    }

    if (DEBUG.logdt && !dtLogDone) {
      if (dtStart === null) dtStart = now;
      dtLog.push(dt);
      if (now - dtStart >= 5) {
        const mean = dtLog.reduce((x, y) => x + y, 0) / dtLog.length;
        console.log(`dt over 5 s: n=${dtLog.length} mean=${mean.toFixed(5)} s max=${Math.max(...dtLog).toFixed(5)} s`);
        dtLogDone = true;
      }
    }

    // View matrix: eye orbits around the y-axis by state.azimuth
    vec3.rotateY(eye, EYE0, TARGET, state.azimuth);
    mat4.lookAt(view, eye, TARGET, UP);

    // Projection
    if (state.ortho) {
      // half height = distance * tan(fov0/2): same apparent size at the target as perspective
      const dist = vec3.distance(EYE0, TARGET);
      const halfH = dist * Math.tan((FOV0 * Math.PI) / 360);
      const halfW = halfH * aspect;
      mat4.ortho(projection, -halfW, halfW, -halfH, halfH, DEBUG.near, FAR);
    } else {
      mat4.perspective(projection, (state.fovDeg * Math.PI) / 180, aspect, DEBUG.near, FAR);
    }
    gl.uniformMatrix4fv(projLoc, false, projection);
    gl.uniformMatrix4fv(viewLoc, false, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const cubeM = cubeModelMatrix(state.t);
    gl.uniformMatrix4fv(modelLoc, false, cubeM);
    if (DEBUG.wire) {
      // E3 helper: every cube triangle as a line loop, so hidden edges are visible too
      for (let i = CUBE_FIRST; i < CUBE_FIRST + CUBE_COUNT; i += 3) gl.drawArrays(gl.LINE_LOOP, i, 3);
    } else {
      gl.drawArrays(gl.TRIANGLES, CUBE_FIRST, CUBE_COUNT);
    }

    gl.uniformMatrix4fv(modelLoc, false, solidModelMatrix(state.t));
    gl.drawArrays(gl.TRIANGLES, SOLID_FIRST, SOLID_COUNT);

    // E6 console output
    if (DEBUG.t !== null && !e6Done) {
      e6Done = true;
      const v = [0.5, 0.5, -0.5, 1];
      const mv = vec4.transformMat4(vec4.create(), v, cubeM);
      const pv = mat4.multiply(mat4.create(), projection, view);
      const clip = vec4.transformMat4(vec4.create(), mv, pv);
      console.log("E6 t =", state.t, "angle deg =", (CUBE_SPIN * state.t * 180) / Math.PI);
      console.log("E6 aspect =", aspect, "(canvas", canvas.clientWidth, "x", canvas.clientHeight, "), fov =", state.fovDeg, "near =", DEBUG.near, "far =", FAR);
      console.log("E6 M*v          =", Array.from(mv));
      console.log("E6 clip P*V*M*v =", Array.from(clip));
      console.log("E6 NDC (clip.xyz / clip.w) =", [clip[0] / clip[3], clip[1] / clip[3], clip[2] / clip[3]]);
    }

    updateStatus(nowMs);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Program link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}