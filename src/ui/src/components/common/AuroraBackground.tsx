import React, { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;

  // Random function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Value Noise
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractal Brownian Motion
  float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }

  void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      // Aspect ratio correction
      uv.x *= u_resolution.x / u_resolution.y;
      
      // Slow down the animation significantly
      float t = u_time * 0.08; 
      
      // Domain Warping for Fluidity
      // Layer 1
      vec2 q = vec2(0.);
      q.x = fbm(uv + 0.1 * t);
      q.y = fbm(uv + vec2(1.0));
      
      // Layer 2
      vec2 r = vec2(0.);
      r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t);
      r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t);
      
      // Base Height Map
      float f = fbm(uv + r);
      
      // --- 3D Lighting Effect (Pseudo-Normal) ---
      // Calculate gradient to approximate surface normal
      vec2 e = vec2(0.005, 0.0);
      float f_x = fbm(uv + e.xy + r) - f;
      float f_y = fbm(uv + e.yx + r) - f;
      // Normal vector (Z controls height exaggeration - lower Z = more bump)
      vec3 normal = normalize(vec3(f_x, f_y, 0.015)); 
      
      // Light source direction
      vec3 light = normalize(vec3(0.5, 0.5, 1.0));
      
      // Diffuse lighting
      float diff = max(dot(normal, light), 0.0);
      
      // Specular lighting (Glossiness/Wetness) - Increased shininess for 3D feel
      float spec = pow(max(dot(reflect(-light, normal), vec3(0,0,1)), 0.0), 24.0);
      
      // --- Aurora Color Palette ---
      // Base: Deep Space Blue
      vec3 colBase = vec3(0.01, 0.03, 0.12);
      // Mid: Aurora Green/Cyan
      vec3 colMid = vec3(0.0, 0.9, 0.7);
      // High: Aurora Purple/Pink
      vec3 colHigh = vec3(0.7, 0.2, 1.0);
      
      // Mix colors based on height (f) and warp (r.x)
      vec3 color = mix(colBase, colMid, smoothstep(0.2, 0.7, f));
      color = mix(color, colHigh, smoothstep(0.4, 0.9, r.x));
      
      // Apply Lighting
      // Darken valleys (shadows) and brighten peaks
      color *= (0.4 + 0.7 * diff); 
      // Add specular highlight for liquid 3D feel
      color += vec3(0.9) * spec * 0.3;
      
      // --- Frosted / Matte Effect ---
      // Static grain based on UV (not time) for a frosted glass look
      float grain = random(uv * 400.0) * 0.04; 
      color += grain;
      
      // Vignette to darken edges
      vec2 v_uv = gl_FragCoord.xy / u_resolution.xy;
      float vignette = length(v_uv - 0.5);
      color *= 1.0 - vignette * 0.6;

      gl_FragColor = vec4(color, 1.0);
  }
`;

export const AuroraBackground = React.memo(
  ({ speed = 1.0 }: { speed?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl =
        canvas.getContext("webgl") ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
      if (!gl) return;

      const compileShader = (type: number, source: string) => {
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

      const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const positionLocation = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.useProgram(program);

      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      const timeLocation = gl.getUniformLocation(program, "u_time");

      const resize = () => {
        // Performance optimization: Force dpr to 1 to reduce pixel calculations and solve lag issues
        const dpr = 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      };
      window.addEventListener("resize", resize);
      resize();

      let currentTime = 0;
      let lastFrameTime = Date.now();
      let animationFrameId: number;

      const render = () => {
        const now = Date.now();
        const delta = (now - lastFrameTime) * 0.001;
        lastFrameTime = now;
        currentTime += delta * speed;

        gl.uniform1f(timeLocation, currentTime);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
      };
      render();

      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(animationFrameId);
        gl.deleteProgram(program);
      };
    }, [speed]);

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        style={{ backgroundColor: "#0a001a" }}
      />
    );
  },
);
