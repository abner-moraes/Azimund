// camada custom do maplibre que desenha os modelos GLTF (config/models3d.js) com Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODELS_3D } from '../config/models3d.js';
import { readThemeColor } from '../config/theme.js';

export const customLayer = {
  id: '3d-model',
  type: 'custom',
  renderingMode: '3d',

  onAdd(map, gl) {
    this.map = map;
    // Ao religar os modelos 3D, o contexto WebGL é o mesmo do mapa: reaproveita renderer e
    // cenas já carregados em vez de baixar os GLTF de novo e criar outro renderer.
    if (this.renderer) {
      map.triggerRepaint();
      return;
    }
    this.camera = new THREE.Camera();
    this.models = MODELS_3D;

    const loader = new GLTFLoader();

    this.models.forEach((model) => {
      const scene = new THREE.Scene();

      // lights per scene
      const light1 = new THREE.DirectionalLight(
        readThemeColor('--color-tertiary-white'),
      );
      light1.position.set(0, -70, 100).normalize();
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(
        readThemeColor('--color-tertiary-white'),
      );
      light2.position.set(0, 70, 100).normalize();
      scene.add(light2);

      loader.load(
        model.url,
        (gltf) => {
          scene.add(gltf.scene);
          map.triggerRepaint();
        },
        undefined,
        (error) => {
          console.error(`[3d-model] FAILED to load ${model.url}:`, error);
        },
      );

      model.scene = scene;
    });

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
  },
  onRemove() {}, // nada a liberar, renderer e cenas ficam pro próximo onAdd

  render(gl, args) {
    // matriz da câmera do maplibre x matriz do modelo (lng/lat/altitude + escala) = câmera do Three
    const mainMatrix = new THREE.Matrix4().fromArray(
      args.defaultProjectionData.mainMatrix,
    );

    this.models.forEach((model) => {
      if (!model.scene) return;
      const modelMatrix = this.map.transform.getMatrixForModel(
        model.origin,
        model.altitude,
      );
      const scaled = new THREE.Matrix4()
        .fromArray(modelMatrix)
        .scale(new THREE.Vector3(model.scale, model.scale, model.scale));

      this.camera.projectionMatrix = mainMatrix.clone().multiply(scaled);
      this.renderer.resetState();
      this.renderer.render(model.scene, this.camera);
    });
  },
};
