import { useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

/* ─── Types ─────────────────────────────────────────────────────── */

interface ShaderHeroProps {
  children: ReactNode;
  className?: string;
}

/* ─── Purple / Indigo GLSL shader ───────────────────────────────── */

const SHADER_SOURCE = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 touch;
uniform int pointerCount;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p){
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p){
  float t=0.,a=1.;
  mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}
  return t;
}

float clouds(vec2 p){
  float d=1.,t=0.;
  for(float i=0.;i<3.;i++){
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);d=a;p*=2./(i+1.);
  }
  return t;
}

void main(void){
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.4,-st.y));

  uv*=1.-.25*(sin(T*.15)*.5+.5);

  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.4+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    // Indigo / purple / pink palette via shifted cosine
    col+=.00125/d*(cos(sin(i)*vec3(2.8,1.2,3.5))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    // Purple-tinted background fog
    col=mix(col,vec3(bg*.08,bg*.04,bg*.18),d);
  }

  // Boost indigo channel, tint overall purple
  col.r*=.55;
  col.g*=.35;
  col.b*=1.15;

  // Add subtle deep-blue base to avoid pure-black
  col+=vec3(.01,.005,.03);

  O=vec4(col,1);
}`;

/* ─── WebGL renderer (minimal, single-responsibility) ──────────── */

class ShaderRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private mouseCoords = [0, 0];
  private pointerCount = 0;

  constructor(private canvas: HTMLCanvasElement, private scale: number) {
    this.gl = canvas.getContext('webgl2')!;
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
  }

  compile(type: number, src: string) {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
    }
    return s;
  }

  setup() {
    const gl = this.gl;
    this.vs = this.compile(gl.VERTEX_SHADER, `#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}`);
    this.fs = this.compile(gl.FRAGMENT_SHADER, SHADER_SOURCE);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    this.uniforms.resolution = gl.getUniformLocation(this.program, 'resolution');
    this.uniforms.time = gl.getUniformLocation(this.program, 'time');
    this.uniforms.touch = gl.getUniformLocation(this.program, 'touch');
    this.uniforms.pointerCount = gl.getUniformLocation(this.program, 'pointerCount');
  }

  updateScale(s: number) {
    this.scale = s;
    this.gl.viewport(0, 0, this.canvas.width * s, this.canvas.height * s);
  }

  updateMouse(x: number, y: number) { this.mouseCoords = [x, y]; }
  updatePointerCount(n: number) { this.pointerCount = n; }

  render(now: number) {
    const gl = this.gl;
    if (!this.program) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, now * 1e-3);
    gl.uniform2f(this.uniforms.touch, ...this.mouseCoords);
    gl.uniform1i(this.uniforms.pointerCount, this.pointerCount);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    const gl = this.gl;
    if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
      if (this.vs) { gl.detachShader(this.program, this.vs); gl.deleteShader(this.vs); }
      if (this.fs) { gl.detachShader(this.program, this.fs); gl.deleteShader(this.fs); }
      gl.deleteProgram(this.program);
    }
  }
}

/* ─── React component ──────────────────────────────────────────── */

export default function AnimatedShaderHero({ children, className = '' }: ShaderHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ShaderRenderer | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const renderer = new ShaderRenderer(canvas, dpr);
    renderer.setup();
    rendererRef.current = renderer;

    const onResize = () => {
      const d = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = window.innerWidth * d;
      canvas.height = window.innerHeight * d;
      renderer.updateScale(d);
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = Math.max(1, 0.5 * window.devicePixelRatio);
      renderer.updateMouse(e.clientX * d, canvas.height - e.clientY * d);
      renderer.updatePointerCount(1);
    };

    const onPointerLeave = () => renderer.updatePointerCount(0);

    const loop = (now: number) => {
      renderer.render(now);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener('resize', onResize);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      renderer.destroy();
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ background: '#0f0a1e' }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
