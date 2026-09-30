// PA1 - 3D Shapes in WebGL
// Student ID: 242322
// Variant: last digit 2 -> Wedge (ramp); second-to-last digit 2 -> offset (+0.15, -0.15), bottom+right faces visible

const STUDENT_ID = "242322";

main();

function main() {
  /*========== Create a WebGL Context ==========*/
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("WebGL unavailable");
    return;
  }

  /*========== Define and Store the Geometry ==========*/
  const OX = 0.15;
  const OY = -0.15;

  // x_draw = x + o_x * (z + 0.5); y_draw = y + o_y * (z + 0.5)
  function offsetVertex(x, y, z) {
    const factor = z + 0.5; // 0 at front (z=-0.5), 1 at back (z=+0.5)
    return [x + OX * factor, y + OY * factor, z];
  }

  // Cube corners (before offset)
  // Front face square: 0.5 x 0.5, centered around x = -0.5 so the whole cube sits in the left half
  const cubeCorners = {
    FBL: offsetVertex(-0.75, -0.25, -0.5),
    FBR: offsetVertex(-0.25, -0.25, -0.5),
    FTR: offsetVertex(-0.25, 0.25, -0.5),
    FTL: offsetVertex(-0.75, 0.25, -0.5),
    BBL: offsetVertex(-0.75, -0.25, 0.5),
    BBR: offsetVertex(-0.25, -0.25, 0.5),
    BTR: offsetVertex(-0.25, 0.25, 0.5),
    BTL: offsetVertex(-0.75, 0.25, 0.5),
  };

  function flat(...pts) {
    return pts.flat();
  }

  const cubePositions = [
    // front
    ...flat(cubeCorners.FBL, cubeCorners.FBR, cubeCorners.FTR, cubeCorners.FBL, cubeCorners.FTR, cubeCorners.FTL),
    // back
    ...flat(cubeCorners.BBR, cubeCorners.BBL, cubeCorners.BTL, cubeCorners.BBR, cubeCorners.BTL, cubeCorners.BTR),
    // left
    ...flat(cubeCorners.FTL, cubeCorners.FBL, cubeCorners.BBL, cubeCorners.FTL, cubeCorners.BBL, cubeCorners.BTL),
    // right side face, gradient
    ...flat(cubeCorners.FBR, cubeCorners.FTR, cubeCorners.BTR, cubeCorners.FBR, cubeCorners.BTR, cubeCorners.BBR),
    // top
    ...flat(cubeCorners.FTL, cubeCorners.BTL, cubeCorners.BTR, cubeCorners.FTL, cubeCorners.BTR, cubeCorners.FTR),
    // bottom (visible side)
    ...flat(cubeCorners.FBL, cubeCorners.BBR, cubeCorners.BBL, cubeCorners.FBL, cubeCorners.FBR, cubeCorners.BBR),
  ];

  const RED = [1, 0, 0, 1];
  const GREEN = [0, 1, 0, 1];
  const BLUE = [0, 0, 1, 1];
  const YELLOW = [1, 1, 0, 1];
  const MAGENTA = [1, 0, 1, 1];
  const CYAN = [0, 1, 1, 1];
  const WHITE = [1, 1, 1, 1];
  const ORANGE = [1, 0.5, 0, 1];
  const GRAY = [0.6, 0.6, 0.6, 1];
  const PURPLE = [0.5, 0, 0.5, 1];

  function repeat(color, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(...color);
    return out;
  }

  const cubeColors = [
    ...repeat(RED, 6), // front
    ...repeat(GREEN, 6), // back
    ...repeat(BLUE, 6), // left
    // right face: gradient across FBR, FTR, BTR, FBR, BTR, BBR
    ...YELLOW, ...MAGENTA, ...CYAN, ...YELLOW, ...CYAN, ...WHITE,
    ...repeat(ORANGE, 6), // top
    ...repeat(GRAY, 6), // bottom
  ];

  // Wedge / Ramp: Triangular prism placed in the right half of the canvas (x > 0)
  const P1 = offsetVertex(0.25, 0, -0.5); // front-bottom-left
  const P2 = offsetVertex(0.75, 0, -0.5); // front-bottom-right
  const P3 = offsetVertex(0.25, 0, 0.5); // back-bottom-left
  const P4 = offsetVertex(0.75, 0, 0.5); // back-bottom-right
  const P5 = offsetVertex(0.25, 0.5, 0.5); // back-top-left
  const P6 = offsetVertex(0.75, 0.5, 0.5); // back-top-right

  const wedgePositions = [
    // bottom (P1,P2,P4,P1,P4,P3)
    ...flat(P1, P2, P4, P1, P4, P3),
    // back, vertical face (P3,P4,P6,P3,P6,P5)
    ...flat(P3, P4, P6, P3, P6, P5),
    // slope, visible top face - radient (P1,P2,P6,P1,P6,P5)
    ...flat(P1, P2, P6, P1, P6, P5),
    // left end triangle (P1,P3,P5)
    ...flat(P1, P3, P5),
    // right end (P2,P4,P6)
    ...flat(P2, P4, P6),
  ];

  const wedgeColors = [
    ...repeat(GRAY, 6), // bottom
    ...repeat(PURPLE, 6), // back
    // slope gradient P1,P2,P6,P1,P6,P5
    ...RED, ...GREEN, ...BLUE, ...RED, ...BLUE, ...YELLOW,
    ...repeat(ORANGE, 3), // left end
    ...repeat(CYAN, 3), // right end
  ];

  const positions = [...cubePositions, ...wedgePositions];
  const colors = [...cubeColors, ...wedgeColors];

  const CUBE_FIRST = 0;
  const CUBE_COUNT = cubePositions.length / 3;
  const SOLID_FIRST = CUBE_COUNT;
  const SOLID_COUNT = wedgePositions.length / 3;

  console.assert(colors.length % 4 === 0, "Color array must have 4 values per vertex");
  console.assert(colors.length / 4 === positions.length / 3, "Color count must match vertex count");
  console.assert(CUBE_COUNT === 36, "Cube must have 36 vertices");
  console.assert(SOLID_COUNT === 24, "Wedge must have 24 vertices");

  const buffers = initBuffers(gl, positions, colors);

  // E6: buffer sizes in bytes, for the writeup. Logged once at startup.
  // Must (re)bind each buffer before querying it - BUFFER_SIZE reports on whichever uffer is currently bound to the target, not on a buffer object directly
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
  const positionBufferSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  const colorBufferSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
  console.log("Total vertices N =", positions.length / 3);
  console.log("Position buffer size (bytes) =", positionBufferSize);
  console.log("Color buffer size (bytes) =", colorBufferSize);

  /*========== Shaders ==========*/
  const vsSource = `
    attribute vec3 aPosition;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor;
    void main() {
      gl_Position = vec4(aPosition, 1.0);
      gl_PointSize = 8.0;
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
  gl.useProgram(program);

  /*====== Connect the attributes with the vertex shader ======*/
  const posAttribLocation = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
  gl.vertexAttribPointer(posAttribLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posAttribLocation);

  const colorAttribLocation = gl.getAttribLocation(program, "aVertexColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  gl.vertexAttribPointer(colorAttribLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorAttribLocation);

  /*========== Drawing ==========*/
  const modeNames = {
    [gl.TRIANGLES]: "TRIANGLES",
    [gl.LINE_LOOP]: "LINE_LOOP",
    [gl.LINES]: "LINES",
    [gl.LINE_STRIP]: "LINE_STRIP",
    [gl.POINTS]: "POINTS",
    [gl.TRIANGLE_STRIP]: "TRIANGLE_STRIP",
  };

  const state = {
    mode: gl.TRIANGLES,
    depth: true,
    cubeFirst: true,
  };

  const statusEl = document.querySelector("#status");

  function updateStatus() {
    statusEl.textContent =
      `ID: ${STUDENT_ID}\n` +
      `Mode: ${modeNames[state.mode]}\n` +
      `Depth test: ${state.depth ? "ON" : "OFF"}\n` +
      `Draw order: ${state.cubeFirst ? "Cube first" : "Solid first"}`;
  }

  function drawCube() {
    gl.drawArrays(state.mode, CUBE_FIRST, CUBE_COUNT);
  }

  function drawSolid() {
    gl.drawArrays(state.mode, SOLID_FIRST, SOLID_COUNT);
  }

  function render() {
    if (state.depth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (state.cubeFirst) {
      drawCube();
      drawSolid();
    } else {
      drawSolid();
      drawCube();
    }

    updateStatus();
  }

  document.addEventListener("keydown", (event) => {
    const key = event.key;
    let changed = true;
    switch (key) {
      case "1": state.mode = gl.TRIANGLES; break;
      case "2": state.mode = gl.LINE_LOOP; break;
      case "3": state.mode = gl.LINES; break;
      case "4": state.mode = gl.LINE_STRIP; break;
      case "5": state.mode = gl.POINTS; break;
      case "6": state.mode = gl.TRIANGLE_STRIP; break;
      case "d":
      case "D":
        state.depth = !state.depth;
        break;
      case "s":
      case "S":
        state.cubeFirst = !state.cubeFirst;
        break;
      default:
        changed = false;
    }
    if (changed) render();
  });

  render();
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

function initBuffers(gl, positions, colors) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return { positionBuffer, colorBuffer };
}