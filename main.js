var width = window.innerWidth;
var height = window.innerHeight;
var renderer = new PIXI.autoDetectRenderer(width, height);//Chooses either WebGL if supported or falls back to Canvas rendering
document.body.appendChild(renderer.view);//Add the render view object into the page

var stage = new PIXI.Container();//The stage is the root container that will hold everything in our scene

const wave_length = 20;
const center_array = [];
const time_array = [];
for (let i = 0; i < wave_length; i++) {
  center_array.push(0);
  center_array.push(0);
  time_array.push(-1);
}

// smoke shader
var uniforms = {};
uniforms.center_array = {
  type: '2fv',
  value: center_array
};
uniforms.time_array = {
  type: 'fv1',
  value: time_array
};

renderer.view.addEventListener('touchstart', addWave);
renderer.view.addEventListener('click', addWave);

function addWave() {
  for (let i = 0; i < wave_length; i++) {
    if (smokeShader.uniforms.time_array[i] < 0) {
      smokeShader.uniforms.center_array[i * 2] = event.clientX / event.target.clientWidth;
      smokeShader.uniforms.center_array[i * 2 + 1] = event.clientY / event.target.clientHeight;
      smokeShader.uniforms.time_array[i] = 0;
      break;
    }
  }
}

var fShaderCode = document.getElementById('fShader').innerHTML.replace('[WAVE_LENGTH]', wave_length);
var smokeShader = new PIXI.Filter(null, fShaderCode, uniforms);

var bg = PIXI.Sprite.fromImage('image.png');
bg.width = width;
bg.height = height;
bg.filters = [smokeShader];
stage.addChild(bg);
animate();

function animate() {
  smokeShader.uniforms.time_array = smokeShader.uniforms.time_array.map((value) => {
    if (value >= 4000) {
      return -1;
    } else if (value >= 0) {
      return value + 1000 / 60;
    } else {
      return value;
    }
  });
  if (smokeShader.uniforms.time_array.find((value) => (value >= 0))) {
    console.log('render');
    renderer.render(stage);
  }

  requestAnimationFrame(animate);
}