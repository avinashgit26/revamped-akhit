(() => {
  const canvas = document.querySelector(".services-hero-wave");
  const stage = canvas?.closest(".services-hero-wave-stage");
  if (!canvas || !stage) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power"
  });

  if (!gl) {
    stage.classList.add("is-static-fallback");
    return;
  }

  const vertexSource = `#version 300 es
    in vec2 aPosition;
    void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    out vec4 outColor;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = p * 2.02 + vec2(17.1, 9.2);
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= uResolution.x / max(uResolution.y, 1.0);
      float t = uTime * 0.17;
      float field = fbm(p * 1.6 + vec2(t * 0.12, -t * 0.08));
      float detail = fbm(p * 3.2 + vec2(-t * 0.09, t * 0.07));
      float curve = sin(p.y * 2.35 + field * 2.8 + sin(p.x * 0.62 + t * 0.45) * 0.42);
      float stream = 1.0 - smoothstep(0.13, 0.76, abs(curve));
      float filament = 1.0 - smoothstep(0.012, 0.07, abs(curve + (detail - 0.5) * 0.22));
      float glow = exp(-abs(curve) * 4.2) * (0.28 + field * 0.18);
      vec3 color = mix(vec3(0.055, 0.17, 0.37), vec3(0.10, 0.31, 0.72), stream);
      color = mix(color, vec3(0.10, 0.57, 0.84), filament * 0.46 + glow * 0.36);
      float lime = smoothstep(0.84, 0.99, detail) * stream * 0.13;
      color = mix(color, vec3(0.78, 0.95, 0.20), lime);
      float alpha = clamp(stream * 0.19 + filament * 0.16 + glow * 0.16 + lime * 0.4, 0.0, 0.42);
      alpha *= smoothstep(0.0, 0.11, uv.x) * (1.0 - smoothstep(0.91, 1.0, uv.x) * 0.18);
      outColor = vec4(color, alpha);
    }
  `;

  const compile = (type, source) => {
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

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = vertexShader && fragmentShader ? gl.createProgram() : null;
  if (!program) {
    stage.classList.add("is-static-fallback");
    return;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    stage.classList.add("is-static-fallback");
    return;
  }

  gl.useProgram(program);
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const buffer = gl.createBuffer();
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
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

  const animate = (now) => {
    raf = 0;
    if (disposed || !visible || document.hidden || reducedMotion.matches) return;
    if (!startTime) startTime = now;
    draw((now - startTime) / 1000);
    raf = window.requestAnimationFrame(animate);
  };

  const stop = () => {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
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
    stage.classList.add("is-static-fallback");
    stop();
  });
  window.addEventListener("pagehide", () => {
    disposed = true;
    stop();
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncMotion);
  }, { once: true });

  resize();
  syncMotion();
})();
