(() => {
  window.createOrnament0 = createOrnament0;

  const THREE = window.THREE;

  const width = 1;
  const halfWidth = width / 2;
  const maxDistance = halfWidth;
  let color = new THREE.Color("rgb(231,35,35)");
  let color1 = new THREE.Color("rgb(64,128,255)");
  color = color.getStyle().replace("rgb(", "vec3(");
  color1 = color1.getStyle().replace("rgb(", "vec3(");

  function createOrnament0() {
    // https://codepen.io/Esambino/pen/AvbXzm
    const g = new THREE.SphereGeometry(
      halfWidth,
      30,
      30,
      0,
      Math.PI * 2,
      0,
      Math.PI
    );
    const m = new THREE.MeshPhongMaterial({
      color: new THREE.Color("rgb(231,35,35)"),
      emissive: new THREE.Color("rgb(64,128,255)"),
      specular: new THREE.Color("rgb(93,195,255)"),
      shininess: 3,
      shading: THREE.FlatShading,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    /* const uniforms = {
      u_time: {
        type: "f",
        value: 0.0,
      },
      u_frame: {
        type: "f",
        value: 0.0,
      },
      u_resolution: {
        type: "v2",
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        ).multiplyScalar(window.devicePixelRatio),
      },
      u_mouse: {
        type: "v2",
        value: new THREE.Vector2(
          0.7 * window.innerWidth,
          window.innerHeight
        ).multiplyScalar(window.devicePixelRatio),
      },
    };
    const m = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      side: THREE.DoubleSide,
      transparent: true,
      extensions: {
        derivatives: true,
      },
    }); */
    const res = new THREE.Mesh(g, m);
    const clock = new THREE.Clock();
    res.onBeforeRender = () => {
      const time = performance.now() * 0.001;
      res.rotation.x = time * 0.2;
      res.rotation.z = time * 0.15;
      /* uniforms.u_time.value = clock.getElapsedTime();
      uniforms.u_frame.value += 1.0; */
    };
    return res;
  }
  const VERT_SHADER = `
#define GLSLIFY 1
// Common varyings
varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_color;

/*
 * The main program
 */
void main() {
    // Save the varyings
    v_position = position;
    v_normal = normalize(normalMatrix * normal);

    float d = position.y / ${maxDistance.toFixed(1)};
    d = clamp(d, 0., 1.);
    v_color = mix(${color1}, ${color}, d) / 255.;

    // Vertex shader output
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
  const FRAG_SHADER = `
#define GLSLIFY 1
// Common uniforms
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_frame;

// Common varyings
varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_color;


/*
 * The main program
 */
void main() {
   if (cos(80.0 * v_position.y + 3.0 * u_time) < 0.0) {
        discard;
    }
    gl_FragColor = vec4( v_color, 0.8);
}
`;
})();
(() => {
  // Reference Sources https://codepen.io/prisoner849/pen/RwyzrVj
  const THREE = window.THREE;

  window.createOrnament1 = createOrnament1;
  function createOrnament1() {
    let gu = {
      time: { value: 0 },
    };

    let sizes = [];
    let shift = [];
    let pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.1,
        Math.random() * 0.4 + 0.1
      );
    };
    let pts = new Array(50000).fill().map((_p) => {
      sizes.push(Math.random() * 0.05 + 0.1);
      pushShift();
      return new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(Math.random() * 0.05 + 0.1);
    });

    let g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
    let m = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      onBeforeCompile: (shader) => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
      uniform float time;
      attribute float sizes;
      attribute vec4 shift;
      varying vec3 vColor;
      ${shader.vertexShader}
    `
          .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
          .replace(
            `#include <color_vertex>`,
            `#include <color_vertex>
        float d = length(abs(position) / vec3(0., 0.5, 1.));
        d = clamp(d, 0., 1.);
        vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
      `
          )
          .replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
        float t = time;
        float moveT = mod(shift.x + shift.z * t, PI2);
        float moveS = mod(shift.y + shift.z * t, PI2);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
      `
          );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
      varying vec3 vColor;
      ${shader.fragmentShader}
    `
          .replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
            float d = length(gl_PointCoord.xy - 0.5);
      `
          )
          .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d) );`
          );
        //console.log(shader.fragmentShader);
      },
    });
    let p = new THREE.Points(g, m);
    let clock = new THREE.Clock();
    p.onBeforeRender = () => {
      let t = clock.getElapsedTime() * 0.5;
      gu.time.value = t * Math.PI;
      p.rotation.y = t * 0.05;
    };
    return p;
  }
})();
