// PA2 - Matrix Transformations and Perspective  
// Student ID: 242322 (Okassova)
// Variants (read from the right: 2,2,3,2,4,2):
//   last digit 2          -> Wedge (ramp), same solid as PA1
//   6 + 2                 -> orbit period T = 8 s
//   2nd-to-last 2 mod 3=2 -> cube spins around normalised (1,1,1)
//   3rd-to-last 3 mod 3=0 -> horizontal orbit (around y)
//   4th-to-last 2 mod 2=0 -> camera 0: eye (0, 2.5, 7), FOV 45 deg

const STUDENT_ID = "242322";
const ORBIT_PERIOD = 8.0;                 // s
const CUBE_SPIN = 1.2;                    // rad/s
const CUBE_AXIS = [1, 1, 1];              // normalised below
const ORBIT_RADIUS = 2.5;
const SOLID_SPIN = 2.0;                   // rad/s around its own y
const EYE0 = [0, 2.5, 7];
const TARGET = [0, 0, 0];
const UP = [0, 1, 0];
const FOV0 = 45;                          // degrees
const NEAR = 1.0;   // closest eye->vertex distance over the orbit is ~4.6, so 1.0 never clips
const FAR = 15.0;   // farthest eye->vertex distance is ~10.2, so 15 never clips

main();

function main() {
  /*========== Create a WebGL Context ==========*/
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("WebGL unavailable");
    return;
  }
  // glMatrix 2.8.1 from cdnjs exposes mat4/vec3/vec4 as globals (3.x puts them under glMatrix.*);
  // this line works with both, so nothing breaks if the CDN build differs.
  const G = window.glMatrix || {};
  const mat4 = window.mat4 || G.mat4;
  const vec3 = window.vec3 || G.vec3;
  const vec4 = window.vec4 || G.vec4;
  if (!mat4 || !vec3 || !vec4) {
    console.log("glMatrix is not loaded: check the <script> tag order in index.html");
    return;
  }

  /*========== Define and Store the Geometry (once) ==========*/
  const RED = [1, 0, 0, 1], GREEN = [0, 1, 0, 1], BLUE = [0, 0, 1, 1];
  const YELLOW = [1, 1, 0, 1], MAGENTA = [1, 0, 1, 1], CYAN = [0, 1, 1, 1];
  const WHITE = [1, 1, 1, 1], ORANGE = [1, 0.5, 0, 1];
  const GRAY = [0.6, 0.6, 0.6, 1], PURPLE = [0.5, 0, 0.5, 1];
  const repeat = (c, n) => Array.from({ length: n }, () => c).flat();

  // Cube: -0.5..+0.5 on all axes, centred on the origin (no PA1 offset any more)
  const c = {
    FBL: [-0.5, -0.5, -0.5], FBR: [0.5, -0.5, -0.5], FTR: [0.5, 0.5, -0.5], FTL: [-0.5, 0.5, -0.5],
    BBL: [-0.5, -0.5, 0.5], BBR: [0.5, -0.5, 0.5], BTR: [0.5, 0.5, 0.5], BTL: [-0.5, 0.5, 0.5],
  };
  const cubePositions = [
    ...[c.FBL, c.FBR, c.FTR, c.FBL, c.FTR, c.FTL],  // front
    ...[c.BBR, c.BBL, c.BTL, c.BBR, c.BTL, c.BTR],  // back
    ...[c.FTL, c.FBL, c.BBL, c.FTL, c.BBL, c.BTL],  // left
    ...[c.FBR, c.FTR, c.BTR, c.FBR, c.BTR, c.BBR],  // right (gradient)
    ...[c.FTL, c.BTL, c.BTR, c.FTL, c.BTR, c.FTR],  // top
    ...[c.FBL, c.BBR, c.BBL, c.FBL, c.FBR, c.BBR],  // bottom
  ].flat();
  const cubeColors = [
    ...repeat(RED, 6), ...repeat(GREEN, 6), ...repeat(BLUE, 6),
    ...YELLOW, ...MAGENTA, ...CYAN, ...YELLOW, ...CYAN, ...WHITE,
    ...repeat(ORANGE, 6), ...repeat(GRAY, 6),
  ];

  // Wedge (ramp, PA1 variant): triangular prism centred on its own origin,
  // x in [-0.5,0.5], y in [-0.25,0.25], z in [-0.5,0.5] -> fits in a 1x1x1 box.
  const P1 = [-0.5, -0.25, -0.5], P2 = [0.5, -0.25, -0.5];
  const P3 = [-0.5, -0.25, 0.5], P4 = [0.5, -0.25, 0.5];
  const P5 = [-0.5, 0.25, 0.5], P6 = [0.5, 0.25, 0.5];
  const wedgePositions = [
    ...[P1, P2, P4, P1, P4, P3],  // bottom
    ...[P3, P4, P6, P3, P6, P5],  // back (vertical)
    ...[P1, P2, P6, P1, P6, P5],  // slope (gradient)
    ...[P1, P3, P5],              // left end triangle
    ...[P2, P4, P6],              // right end triangle
  ].flat();
  const wedgeColors = [
    ...repeat(GRAY, 6), ...repeat(PURPLE, 6),
    ...RED, ...GREEN, ...BLUE, ...RED, ...BLUE, ...YELLOW,
    ...repeat(ORANGE, 3), ...repeat(CYAN, 3),
  ];

  const positions = [...cubePositions, ...wedgePositions];
  const colors = [...cubeColors, ...wedgeColors];
  const CUBE_FIRST = 0;
  const CUBE_COUNT = cubePositions.length / 3;      // 36
  const SOLID_FIRST = CUBE_COUNT;
  const SOLID_COUNT = wedgePositions.length / 3;    // 24
  console.assert(CUBE_COUNT === 36 && SOLID_COUNT === 24, "unexpected vertex counts");
  console.assert(colors.length / 4 === positions.length / 3, "colour/position count mismatch");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  /*========== Shaders (once) ==========*/
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

  /*====== Attribute pointers and uniform locations (once) ======*/
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
  const state = { t: 0, paused: false };   // t = simulated time in seconds
  let aspect = 1;
  const projection = mat4.create();
  const view = mat4.create();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    aspect = canvas.clientWidth / canvas.clientHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  document.addEventListener("keydown", (event) => {
    if (event.key === "p" || event.key === "P") state.paused = !state.paused;
  });

  /*========== Model matrices ==========*/
  // Each glMatrix call RIGHT-multiplies: M = M * X. The last call is applied to the vertex first.
  function cubeModelMatrix(t) {
    const m = mat4.create();
    mat4.rotate(m, m, CUBE_SPIN * t, vec3.normalize(vec3.create(), CUBE_AXIS));
    return m;
  }

  // M = R_orbit * T * R_self * S   (vertex: scale -> self-spin -> move out to radius -> orbit)
  function solidModelMatrix(t) {
    const orbitAngle = (2 * Math.PI * t) / ORBIT_PERIOD;
    const s = 0.65 + 0.15 * Math.sin((2 * Math.PI * t) / 3);
    const m = mat4.create();
    mat4.rotate(m, m, orbitAngle, [0, 1, 0]);          // R_orbit (horizontal orbit, around y)
    mat4.translate(m, m, [ORBIT_RADIUS, 0, 0]);        // T
    mat4.rotate(m, m, SOLID_SPIN * t, [0, 1, 0]);      // R_self (own y-axis)
    mat4.scale(m, m, [s, s, s]);                       // S (pulse)
    return m;
  }

  /*========== Drawing (every frame) ==========*/
  const statusEl = document.querySelector("#status");
  let then = null;
  function render(nowMs) {
    const now = nowMs * 0.001;                          // ms -> s
    const dt = then === null ? 0 : Math.min(now - then, 0.1); // clamp: no jump after switching tabs
    then = now;
    if (!state.paused) state.t += dt;                   // pause freezes t

    mat4.lookAt(view, EYE0, TARGET, UP);
    mat4.perspective(projection, (FOV0 * Math.PI) / 180, aspect, NEAR, FAR);
    gl.uniformMatrix4fv(projLoc, false, projection);
    gl.uniformMatrix4fv(viewLoc, false, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(modelLoc, false, cubeModelMatrix(state.t));
    gl.drawArrays(gl.TRIANGLES, CUBE_FIRST, CUBE_COUNT);

    gl.uniformMatrix4fv(modelLoc, false, solidModelMatrix(state.t));
    gl.drawArrays(gl.TRIANGLES, SOLID_FIRST, SOLID_COUNT);

    statusEl.textContent =
      `ID: ${STUDENT_ID}\nProjection: Perspective\nFOV: ${FOV0}\u00B0\n` +
      `t: ${state.t.toFixed(1)} s${state.paused ? " (paused)" : ""}`;

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