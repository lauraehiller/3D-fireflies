import * as THREE from 'three';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GUI} from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
import {OBJLoader} from './node_modules/three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from './node_modules/three/examples/jsm/loaders/MTLLoader.js';
import {EffectComposer} from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {InstancedMesh} from './node_modules/three/src/objects/InstancedMesh.js';

let camera1_active = true;
let movesaucer = false;
let take = true;

function main() {

  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  document.onkeydown = keydown;
  window.addEventListener('resize',() => { resizeRendererToDisplaySize();});
  const scene = new THREE.Scene();

  //Perspective Camera1
  const fov = 45;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera1 = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera1.position.set(0, 10, 20);

  const controls1 = new OrbitControls(camera1, canvas);
  controls1.target.set(0, 10, 0);
  controls1.update();

  //Perspective Camera2
  const camera2 = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera2.position.set(0, 50, 150);

  const controls2 = new OrbitControls(camera2, canvas);
  controls2.target.set(0, 10, 30);
  controls2.update();

  function updateCamera() {
    camera1.updateProjectionMatrix();
    camera2.updateProjectionMatrix();
  }

  //Glow effect camera 1
  const renderScene1 = new RenderPass(scene, camera1);
  const bloomPass1 = new UnrealBloomPass(new THREE.Vector2(canvas.width, canvas.height),1.5, 0.4, 0.85);
  bloomPass1.threshold = 0;
  bloomPass1.strength = 1.5;
  bloomPass1.radius = 0;

  const bloomComposer1 = new EffectComposer(renderer);
  bloomComposer1.setSize(canvas.width, canvas.height);
  bloomComposer1.renderToScreen = true;
  bloomComposer1.addPass(renderScene1);
  bloomComposer1.addPass(bloomPass1);

  //Glow effect camera 2
  const renderScene2 = new RenderPass(scene, camera2);
  const bloomPass2 = new UnrealBloomPass(new THREE.Vector2(canvas.width, canvas.height),1.5, 0.4, 0.85);
  bloomPass2.threshold = 0;
  bloomPass2.strength = 1.5;
  bloomPass2.radius = 0;

  const bloomComposer2 = new EffectComposer(renderer);
  bloomComposer2.setSize(canvas.width, canvas.height);
  bloomComposer2.renderToScreen = true;
  bloomComposer2.addPass(renderScene2);
  bloomComposer2.addPass(bloomPass2);

function keydown(ev){
  if(ev.keyCode == 49){ 
    camera1_active = true;
  }else if(ev.keyCode == 50){ 
    camera1_active = false;
  }else if(ev.keyCode == 32){
    movesaucer = true;
  }
  updateCamera();
  requestAnimationFrame(render);
}

  //Fog
  //const color = 0x010302;
  const color = 0x08080a;
  const density = 0.007;
  scene.fog = new THREE.FogExp2(color, density);

  //Sun 
  const suncolor = 0xFFFFFF;
  const sunintensity = 0.2;
  const sun = new THREE.DirectionalLight(suncolor, sunintensity);
  sun.castShadow = true;
  sun.position.set(0, 40, 0);
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target);

  //Spot light
  const spotcolor = 0xFFFFFF;
  const spotintensity = 0.0;
  const spotLight = new THREE.SpotLight( spotcolor, spotintensity );
  spotLight.position.set( 0,200,50);
  spotLight.target.position.set(0,0,50);
  spotLight.penumbra = 0.5;
  scene.add( spotLight );
  scene.add(spotLight.target);

  //Cabin light(Point light)
  const clwidth = 8;  // ui: width
  const clheight = 6;  // ui: height
  const cldepth = 10;  // ui: depth
  const clgeometry = new THREE.BoxGeometry(clwidth, clheight, cldepth);
  const clmaterial = new THREE.MeshBasicMaterial({color: 0xfccc62});
  const cl = new THREE.Mesh(clgeometry, clmaterial);
  scene.add(cl);
  cl.position.set(0,9,-50);
  cl.scale.set(2,1,1);
  cl.rotation.y = Math.PI * .75;

  const cabinlightcolor = 0xfccc62;
  const cabinlightintensity = 0.5;
  let cabinlight = new THREE.PointLight(cabinlightcolor, cabinlightintensity, 5);
  cabinlight.position.set(0,9,-50);
  scene.add(cabinlight);

  //sky box
  const skyloader = new THREE.CubeTextureLoader();
    const skytexture = skyloader.load([
      'Images/px.jpg',
      'Images/nx.jpg',
      'Images/py.jpg',
      'Images/ny.jpg',
      'Images/pz.jpg',
      'Images/nz.jpg',
    ]);
  scene.background = skytexture;
  //scene.background = new THREE.Color(0xFFFFFF);

  //Ground Plane
  {
    const planeSize = 1000;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('Images/swamp.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 50;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
  }

  //Fireflies
  const firefliesPositions = [];
  for(let i = -500; i < 500; i+= 50){
    for(let j = -500; j < 500; j+= 50){
      let radius = Math.sqrt(Math.pow(i,2)+Math.pow(j,2))/100;
      let radiusinradians = 0;
      radiusinradians = Math.PI*radius/2/6; 
      radius = Math.floor(Math.abs(Math.cos(radiusinradians)*10));
      for(let k = 0; k < radius;k++){
        firefliesPositions.push(i+1+Math.floor(Math.random()*50));
        firefliesPositions.push(5);
        firefliesPositions.push(j+1+Math.floor(Math.random()*50));
      }
    }
  }
  let firefliesGeometry = new THREE.BufferGeometry();
  let fireflyPosAttribute = new THREE.BufferAttribute(new Float32Array(firefliesPositions), 3); // 3 because a position is x,y,z we would use 2 for uvs
  firefliesGeometry.setAttribute('position', fireflyPosAttribute);
  let uniforms = {
    uTime: {value: 0},
    uRandom: {value: Math.random()},
  };
  let firefliesMaterial = new THREE.ShaderMaterial({uniforms: uniforms, 
    vertexShader: document.getElementById('vertexShader').textContent, 
    fragmentShader: document.getElementById('fragmentShader').textContent,
  });

  let firefliesPoints = new THREE.Points();
  firefliesPoints.geometry = firefliesGeometry;
  firefliesPoints.material = firefliesMaterial;

  scene.add(firefliesPoints);


  /*Prairie Shed by Zebo [CC-BY], via Poly Pizza*/
  const cabinobjLoader = new OBJLoader();
    const cabinmtlLoader = new MTLLoader();
    cabinmtlLoader.load('Objects/Cabin/materials.mtl', (mtl) => {
    mtl.preload();
    cabinobjLoader.setMaterials(mtl);
    cabinobjLoader.load('Objects/Cabin/model.obj', (root) => {
        scene.add(root);
        root.position.set(0,10,-50);
        root.rotation.y = Math.PI * .75;
        root.scale.set(15,9,15);
    });
  });

  /*Farm by Poly by Google [CC-BY], via Poly Pizza*/
  const barnobjLoader = new OBJLoader();
    const barnmtlLoader = new MTLLoader();
    let loader = new THREE.TextureLoader();
    const barntexture = loader.load('Objects/Barn/1267 Farm1.png');
    const barnmaterial = new THREE.MeshBasicMaterial({map: barntexture});
    barnmtlLoader.load('Objects/Barn/1267 Farm.mtl', (mtl) => {
    mtl.preload();
    barnobjLoader.setMaterials(mtl);
    barnobjLoader.load('Objects/Barn/1267 Farm.obj', (root) => {
      root.traverse( function ( node ) {if ( node.isMesh ) node.material = barnmaterial;});
        scene.add(root);
        root.position.set(-70,0,27);
        root.rotation.y = Math.PI * -.4;
        root.scale.set(0.2,0.2,0.2);
    });
  });

  const bl = new THREE.Mesh(clgeometry, clmaterial);
  scene.add(bl);
  bl.position.set(-72.9,0,24.9);
  bl.scale.set(.7,2.5,2);
  bl.rotation.y = Math.PI * -.4;

  let barnlight = new THREE.PointLight(cabinlightcolor, cabinlightintensity, 5);
  barnlight.position.set(-70,0,24);
  scene.add(barnlight);

  //Reeds
    const reedradius = .3;
    const reedheight = 8;
    const reedradialSegments = 16;
    const reedgeometry = new THREE.ConeGeometry(reedradius, reedheight, reedradialSegments);
    const reedmaterial = new THREE.MeshBasicMaterial({color: 0x030802});
    let grass = new THREE.InstancedMesh(reedgeometry, reedmaterial, 10000);
    scene.add(grass);

    let grassobj = new THREE.Object3D();
    for(let x = 0; x < 400; x+=2){
      for(let z = 0; z < 400; z+=2){
        let newx = x+(Math.floor(Math.random() * 100))-100;
        let newz = z+(Math.floor(Math.random() * 100))-150;
        if(!((-19 < newx && newx < 19 ) && (-19 < newz && newz < 19))){
          grassobj.position.set(newx,2,newz);
          grassobj.scale.set(1,.5+Math.random(),1);
          grassobj.updateMatrix();
          grass.setMatrixAt((x*100 + z), grassobj.matrix);
        }
      }
    }

  function drawRock(i,j,rot){
    if(!((-10 < i && i < 10 ) && (-10 < j && j < 10))){
      const rock = new THREE.Mesh(rockgeometry, rockmaterial);
      scene.add(rock);
      rock.position.set(i,.5,j);
      let size = Math.random();
      rock.scale.set(.2+size ,.2 ,.1+size );
      rock.rotation.set(0,0,.1 * rot);
    }
  }

  //Rocks
  const rockradius = 7;
  const rockgeometry = new THREE.IcosahedronGeometry(rockradius);
  loader = new THREE.TextureLoader();
  const rocktexture = loader.load('Images/rock.png');
  const rockmaterial = new THREE.MeshPhongMaterial({map: rocktexture});
  let rot = 1;
  for(let i = -100; i < 100; i+=(20+Math.floor(Math.random() * 50))){
      for(let j = -100; j < 100; j+=(20+Math.floor(Math.random() * 50))){
        drawRock(i,j,rot);
        rot *= -1;
      }
      rot *= -1;
  }

  //Pond
  const pondradius = 2;
  const pondsegments = 24;
  loader = new THREE.TextureLoader();
  const watertexture = loader.load('Images/water.jpg');
  const pondgeometry = new THREE.CircleGeometry(pondradius, pondsegments);
  const pondmaterial = new THREE.MeshPhongMaterial({map: watertexture});
  const pond = new THREE.Mesh(pondgeometry, pondmaterial);
  pond.scale.set(10,10,10);
  pond.rotation.x = Math.PI * -.5;
  pond.position.set(0,.01,0);
  scene.add(pond);

  for(let i = 0; i < 360; i +=20){
    let x = 20*(Math.cos(i));
    let z = 20*(Math.sin(i));
    drawRock(x,z,0);
  }

  /*Frog by Poly by Google [CC-BY], via Poly Pizza*/
  const frogobjLoader = new OBJLoader();
    const frogmtlLoader = new MTLLoader();
    frogmtlLoader.load('Objects/Frog/Frog.mtl', (mtl) => {
    mtl.preload();
    frogobjLoader.setMaterials(mtl);
    frogobjLoader.load('Objects/Frog/Frog.obj', (root) => {
        scene.add(root);
        root.position.set(20,1.5,0);
        root.rotation.y = Math.PI * .9;
        root.scale.set(0.01,0.01,0.01);
    });
  });

  /*Lilly Pad by Jarlan Perez [CC-BY], via Poly Pizza*/
  const lillypadobjLoader = new OBJLoader();
  const lillypadmtlLoader = new MTLLoader();
  lillypadmtlLoader.load('Objects/LillyPad/materials.mtl', (mtl) => {
    mtl.preload();
    lillypadobjLoader.setMaterials(mtl);
    for(let i = -15; i < 15;i+=5){
      for(let j = -15; j < 15;j+=5){
          lillypadobjLoader.load('Objects/LillyPad/model.obj', (root) => {
          let size = 3+Math.floor(Math.random() * 5);
          scene.add(root);
          root.position.set(i+Math.floor(Math.random() * 5),0.3,j+Math.floor(Math.random() * 5));
          root.rotation.y = Math.PI * Math.random();
          root.scale.set(size,size,size);
        });
      }
    }

  });

    /*Tree by Poly by Google [CC-BY], via Poly Pizza*/
    const treeobjLoader = new OBJLoader();
    const treemtlLoader = new MTLLoader();
    loader = new THREE.TextureLoader();
    const treetexture = loader.load('Objects/Tree/BubingaTree_BaseColor.png');
    const treematerial = new THREE.MeshPhongMaterial({map: treetexture});         

    treemtlLoader.load('Objects/Tree/BubingaTree.mtl', (mtl) => {
    mtl.preload();
    treeobjLoader.setMaterials(mtl);
    treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
      root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
      scene.add(root);
      root.position.set(-30,0,-30);
      root.scale.set(1.0,1.0,1.0);
    });
       treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
        root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
            scene.add(root);
            root.position.set(30,0,-40);
            root.scale.set(1.0,1.0,1.0);
        });
        treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
          root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
            scene.add(root);
            root.position.set(-60,0,0);
            root.scale.set(1.0,1.0,1.0);
        });
        treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
          root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
            scene.add(root);
            root.position.set(60,0,0);
            root.scale.set(1.0,1.0,1.0);
        });
        treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
          root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
            scene.add(root);
            root.position.set(40,0,40);
            root.scale.set(1.0,1.0,1.0);
        });
        treeobjLoader.load('Objects/Tree/BubingaTree.obj', (root) => {
          root.traverse( function ( node ) {if ( node.isMesh ) node.material = treematerial;});
            scene.add(root);
            root.position.set(-30,0,40);
            root.scale.set(1.0,1.0,1.0);
        });
    });

  /*Flying saucer by Poly by Google [CC-BY], via Poly Pizza*/ 
  const saucerobjLoader = new OBJLoader();
    const saucermtlLoader = new MTLLoader();
    loader = new THREE.TextureLoader();
    const saucertexture = loader.load('Objects/Saucer/1352 Flying Saucer.png');
    const saucermaterial = new THREE.MeshPhongMaterial({map: saucertexture});  
    saucermtlLoader.load('Objects/Saucer/1352 Flying Saucer.mtl', (mtl) => {
    mtl.preload();
    saucerobjLoader.setMaterials(mtl);
    saucerobjLoader.load('Objects/Saucer/1352 Flying Saucer.obj', (saucer) => {
      saucer.traverse( function ( node ) {if ( node.isMesh ) node.material = saucermaterial;});
      saucer.name = 'saucer'; 
        saucer.position.set(0,200,50);
        saucer.scale.set(0.4,0.4,0.4);
        scene.add(saucer);
    });
  });

    const sl_radius = 6;  // ui: radius
    const sl_widthSegments = 12;  // ui: widthSegments
    const sl_heightSegments = 8;  // ui: heightSegments
    const sl_geometry = new THREE.SphereGeometry(sl_radius, sl_widthSegments, sl_heightSegments);
    const sl_material = new THREE.MeshBasicMaterial({color: 0xfccc62});
    const saucer_light = new THREE.Mesh(sl_geometry, sl_material);
    saucer_light.scale.set(1,1,1);
    saucer_light.position.set(0,213,50);
    scene.add(saucer_light);

  /*Cow by Poly by Google [CC-BY], via Poly Pizza*/
  const cowobjLoader = new OBJLoader();
    const cowmtlLoader = new MTLLoader();
    loader = new THREE.TextureLoader();
    const cowtexture = loader.load('Objects/Cow/Cow_BaseColor1.png');
    const cowmaterial = new THREE.MeshBasicMaterial({map: cowtexture});
    cowmtlLoader.load('Objects/Cow/Cow.mtl', (mtl) => {
    mtl.preload();
    cowobjLoader.setMaterials(mtl);
    cowobjLoader.load('Objects/Cow/Cow.obj', (cow) => {
      cow.traverse( function ( node ) {if ( node.isMesh ) node.material = cowmaterial;});
      cow.name = 'cow'; 
      cow.position.set(0,0,50);
        cow.rotation.y = Math.PI * .5;
        cow.scale.set(1,1,1);
        scene.add(cow);
    });
    cowobjLoader.load('Objects/Cow/Cow.obj', (cow) => {
      cow.traverse( function ( node ) {if ( node.isMesh ) node.material = cowmaterial;});
      cow.position.set(-20,0,70);
        cow.rotation.y = Math.PI * .5;
        cow.scale.set(1,1,1);
        scene.add(cow);
    });
    cowobjLoader.load('Objects/Cow/Cow.obj', (cow) => {
      cow.traverse( function ( node ) {if ( node.isMesh ) node.material = cowmaterial;});
      cow.position.set(20,0,70);
        cow.rotation.y = Math.PI * -.5;
        cow.scale.set(1,1,1);
        scene.add(cow);
    });
  });

  function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const c_width = window.innerWidth;
    const c_height = window.innerHeight;
    renderer.setSize(c_width, c_height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    bloomComposer1.setSize(c_width, c_height, false);
    bloomComposer1.setPixelRatio(Math.min(window.devicePixelRatio,2));
    bloomComposer2.setSize(c_width, c_height, false);
    bloomComposer2.setPixelRatio(Math.min(window.devicePixelRatio,2));
    camera1.aspect = c_width / c_height;
    camera1.updateProjectionMatrix();
    camera2.aspect = c_width / c_height;
    camera2.updateProjectionMatrix();
  }

  let movesaucerdown = true;
  let movesaucerup = false;
  let abductcow = false;
  let rotatecamera = true;
  let cow;
  let saucer;
  function render(time) {
    time *= 0.001;  // convert time to seconds
    firefliesPoints.material.uniforms.uTime.value = time;
    cow = scene.getObjectByName('cow');
    saucer = scene.getObjectByName('saucer');
    if(movesaucer){
      if(saucer){
        if(take){
            if(movesaucerdown){
                if(saucer.position.y > 15){
                    saucer.position.y -= .5;
                    spotLight.position.y -= .5;
                    saucer_light.position.y -= .5;
                }else{
                    movesaucerdown = false;
                    abductcow = true;
                }
            }
            if(abductcow){
                spotLight.intensity = 1.0;
                if(cow.position.y < 22){
                    cow.position.y += .1;
                }else{
                    abductcow = false;
                    movesaucerup = true;
                    spotLight.intensity = 0.0;
                }
            }
            if(movesaucerup){
                if(saucer.position.y < 200){
                    saucer.position.y += .5;
                    spotLight.position.y += .5;
                    cow.position.y += .5;
                    saucer_light.position.y += .5;
                }else{
                    movesaucerdown = true;
                    movesaucerup = false;
                    movesaucer = false;
                    take = false;
                }
            }  
        }else{
            if(movesaucerdown){
                if(saucer.position.y > 15){
                    saucer.position.y -= .5;
                    spotLight.position.y -= .5;
                    saucer_light.position.y -= .5;
                    cow.position.y -=.51;
                }else{
                    movesaucerdown = false;
                    abductcow = true;
                }
            }
            if(abductcow){
                spotLight.intensity = 1.0;
                if(cow.position.y > 0){
                    cow.position.y -= .1;
                }else{
                    abductcow = false;
                    movesaucerup = true;
                    spotLight.intensity = 0.0;
                }
            }
            if(movesaucerup){
                movesaucerdown = false;
                if(saucer.position.y < 200){
                    saucer.position.y += .5;
                    spotLight.position.y += .5;
                    //cow.position.y += .5;
                    saucer_light.position.y += .5;
                }else{
                    movesaucerdown = true;
                    movesaucerup = false;
                    movesaucer = false;
                    take = true;
                }
            } 

        }
    }
    }
    if(camera1_active){
      //renderer.render(scene, camera1);
      bloomComposer1.render();
    }else{
      bloomComposer2.render();
      //renderer.render(scene, camera2);
    }    
    requestAnimationFrame(render);
  }
  resizeRendererToDisplaySize();
  requestAnimationFrame(render);
}
main();