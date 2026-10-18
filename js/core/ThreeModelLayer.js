import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODELS_3D } from '../config/models3d.js';

// ML layer that renders Three.js GLTF models on the map
export const customLayer = {
  id: '3d-model',
  type: 'custom',
  renderingMode: '3d',

  onAdd(map, gl) {
    this.camera = new THREE.Camera();
    this.map = map;
    this.models = MODELS_3D;

    const loader = new GLTFLoader();

    this.models.forEach((model) => {
      const scene = new THREE.Scene();

      // lights per scene
      const light1 = new THREE.DirectionalLight(0xffffff);
      light1.position.set(0, -70, 100).normalize();
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff);
      light2.position.set(0, 70, 100).normalize();
      scene.add(light2);

      loader.load(
        model.url,
        (gltf) => {
          scene.add(gltf.scene);
          console.log(`[3d-model] loaded OK: ${model.url}`);
        },
        undefined,
        (error) => {
          console.error(`[3d-model] FAILED to load ${model.url}:`, error);
        }
      );

      model.scene = scene;
    });

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    this.renderer.autoClear = false;
  },

  render(gl, args) {
    const mainMatrix = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);

    this.models.forEach((model) => {
      if (!model.scene) return;
      const modelMatrix = this.map.transform.getMatrixForModel(model.origin, model.altitude);
      const l = new THREE.Matrix4().fromArray(modelMatrix).scale(
        new THREE.Vector3(model.scale, model.scale, model.scale)
      );

      this.camera.projectionMatrix = mainMatrix.clone().multiply(l);
      this.renderer.resetState();
      this.renderer.render(model.scene, this.camera);
    });

    this.map.triggerRepaint();
  }
};
