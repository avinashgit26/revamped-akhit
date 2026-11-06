(() => {
  const canvas = document.querySelector(".services-hero-wave");
  const stage = canvas?.closest(".services-hero-wave-stage");
  if (!canvas || !stage) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power"
  });

  const useStaticFallback = () => stage.classList.add("is-static-fallback");
  if (!gl) {
    useStaticFallback();
    return;
  }

  const palette = [
    [0.0, 0.02, 0.05],
    [0.0, 0.04, 0.08],
    [0.0, 0.06, 0.12],
    [0.0, 0.08, 0.18],
    [0.0, 0.1, 0.24],
    [0.0, 0.14, 0.32],
    [0.0, 0.2, 0.4],
    [0.0, 0.24, 0.48],
    [0.0, 0.3, 0.55],
    [0.05, 0.35, 0.6],
    [0.08, 0.4, 0.65],
    [0.1, 0.45, 0.7],
    [0.15, 0.5, 0.75],
    [0.2, 0.58, 0.8],
    [0.25, 0.65, 0.85],
    [0.3, 0.72, 0.9],
    [0.4, 0.78, 0.92],
    [0.5, 0.85, 0.95],
    [0.7, 0.9, 0.97],
    [0.85, 0.95, 1.0]
  ];
  const paletteSource = palette.map((color) => `vec3(${color.join(",")})`).join(",\n    ");

  const vertexSource = `#version 300 es
    precision mediump float;
    in vec2 aPosition;
    void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec2 uResolution;
    uniform float uTime;

    #define NUM_COLORS ${palette.length}
    vec3 seaColors[NUM_COLORS] = vec3[](
      ${paletteSource}
    );

    vec3 permute(vec3 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
    }

    float noise2D(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m *= m;
      m *= m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 7; i++) {
        value += amplitude * noise2D(st * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
      uv.x *= uResolution.x / uResolution.y;
      uv *= 0.3;
      float t = uTime * 0.25;
      float waveAmp = 0.2 + 0.15 * noise2D(vec2(t, 27.7));
      uv.x += waveAmp * sin(uv.y * 4.0 + t);
      uv.y += waveAmp * sin(uv.x * 4.0 - t);

      float radius = length(uv);
      float angle = atan(uv.y, uv.x);
      float swirlStrength = 1.2 * (1.0 - smoothstep(0.0, 1.0, radius));
      angle += swirlStrength * sin(uTime + radius * 5.0);
      uv = vec2(cos(angle), sin(angle)) * radius;

      float noise = fbm(uv);
      noise += 0.2 * sin(t + noise * 3.0);
      float colorPosition = clamp(0.5 * (noise + 1.0), 0.0, 1.0) * float(NUM_COLORS - 1);
      int low = int(floor(colorPosition));
      int high = int(min(float(low + 1), float(NUM_COLORS - 1)));
      vec3 color = mix(seaColors[low], seaColors[high], fract(colorPosition));
      float alpha = low == 0 && high == 0 ? 0.0 : 0.92;
      outColor = vec4(color, alpha);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    useStaticFallback();
    return;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    useStaticFallback();
    return;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    useStaticFallback();
    return;
  }

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) {
    if (vao) gl.deleteVertexArray(vao);
    if (buffer) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    useStaticFallback();
    return;
  }

  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolutionUniform = gl.getUniformLocation(program, "uResolution");
  const timeUniform = gl.getUniformLocation(program, "uTime");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let raf = 0;
  let visible = true;
  let startTime = 0;
  let disposed = false;
  const resize = () => {
    const bounds = stage.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 1.25);
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.uniform2f(resolutionUniform, width, height);
  };

  const draw = (time) => {
    if (disposed) return;
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeUniform, time);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  const stop = () => {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  const animate = (now) => {
    raf = 0;
    if (disposed || !visible || document.hidden || reducedMotion.matches) return;
    if (!startTime) startTime = now;
    draw((now - startTime) / 1000);
    raf = window.requestAnimationFrame(animate);
  };

  const syncMotion = () => {
    stop();
    if (reducedMotion.matches) draw(0);
    else if (visible && !document.hidden) raf = window.requestAnimationFrame(animate);
  };

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) syncMotion();
        else stop();
      }, { threshold: 0.01 })
    : null;
  observer?.observe(stage);
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncMotion);
  reducedMotion.addEventListener?.("change", syncMotion);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    useStaticFallback();
    stop();
  });
  window.addEventListener("pagehide", () => {
    disposed = true;
    stop();
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncMotion);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  }, { once: true });

  resize();
  syncMotion();
})();
