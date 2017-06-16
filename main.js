// containerとstageの準備
const width = window.innerWidth;
const height = window.innerHeight;
const renderer = new PIXI.autoDetectRenderer(width, height);
document.body.appendChild(renderer.view);
const stage = new PIXI.Container();

// 画像
const bg = PIXI.Sprite.fromImage('image.jpg');
bg.width = width;
bg.height = height;

// シェーダーを設定
const uniforms = {};
uniforms.noise_value = {
  type: '1f',
  value: 0
};
uniforms.noise_size = {
  type: '1f',
  value: 0
};
const fShaderCode = `
  precision mediump float;
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float noise_value;
  uniform float noise_size;
  
  const int   oct  = 8;
  const float per  = 0.5;
  const float PI   = 3.1415926;
  const float cCorners = 1.0 / 16.0;
  const float cSides   = 1.0 / 8.0;
  const float cCenter  = 1.0 / 4.0;
  
  // このへんのノイズはネットから持ってきた
  // 補間関数
  float interpolate(float a, float b, float x){
    float f = (1.0 - cos(x * PI)) * 0.5;
    return a * (1.0 - f) + b * f;
  }
  
  // 乱数生成
  float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
  }
  
  // 補間乱数
  float irnd(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec4 v = vec4(rnd(vec2(i.x,       i.y      )),
                  rnd(vec2(i.x + 1.0, i.y      )),
                  rnd(vec2(i.x,       i.y + 1.0)),
                  rnd(vec2(i.x + 1.0, i.y + 1.0)));
    return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
  }
  
  // ノイズ生成
  float noise(vec2 p){
    float t = 0.0;
    for(int i = 0; i < oct; i++){
        float freq = pow(2.0, float(i));
        float amp  = pow(per, float(oct - i));
        t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
    }
    return t;
  }
  
  // シームレスノイズ生成
  float snoise(vec2 p, vec2 q, vec2 r){
    return noise(vec2(p.x,       p.y      )) *        q.x  *        q.y  +
           noise(vec2(p.x,       p.y + r.y)) *        q.x  * (1.0 - q.y) +
           noise(vec2(p.x + r.x, p.y      )) * (1.0 - q.x) *        q.y  +
           noise(vec2(p.x + r.x, p.y + r.y)) * (1.0 - q.x) * (1.0 - q.y);
  }

  void main(void) {
    vec2 t = gl_FragCoord.xy + vec2(noise_value * 10.0);
    float n = noise(t);
    float n2 = noise(t + 100.0);
    vec2 offset = vec2(n / 10.0, n / 10.0);
    offset -= (1.0 / 10.0) / 2.0; // オフセットするベクトルの方向を逆方向に0.5ずらす
    offset *= noise_size;
    vec4 pixel = texture2D(uSampler, vTextureCoord + offset);
    gl_FragColor = pixel;
  }`;
const shader = new PIXI.Filter(null, fShaderCode, uniforms);
bg.filters = [shader];

stage.addChild(bg);
window.setTimeout(() => {
  renderer.render(stage);
}, 1000);
window.addEventListener('mousemove', (e) => {
  shader.uniforms.noise_value = e.clientX / 20;
  shader.uniforms.noise_size = e.clientY / window.innerHeight;
  renderer.render(stage);
});
