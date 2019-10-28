import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

function loadHidherresolution(gltf, lod, level) {
    var mesh = loadAndMergeMesh(gltf);
    mesh.geometry.computeBoundingSphere();
    mesh.position.x = -mesh.geometry.boundingSphere.center.x;
    mesh.position.y = -mesh.geometry.boundingSphere.center.y;
    mesh.position.z = -mesh.geometry.boundingSphere.center.z;
    lod.addLevel(mesh, (level / 4));

}


export default function LOD(scene, camera, renderer, params, mouse, loader) {
    this.m_scene = scene;
    this.m_camera = camera;
    this.m_renderer = renderer;
    this.m_params = params;
    this.m_mouse = mouse;
    this.m_loader = loader;
    this.m_lodlist = [];

    this.m_InitBaseLayer = function (gltf, LOD_level_medium, LOD_level_medium_distance, LOD_level_high) {
        var boundingSphere;

        var lod = new THREE.LOD();
        var lod_position = new THREE.Vector3();
        lod.up.set(0, 0, 1);

        var mesh = loadAndMergeMesh(gltf);

        mesh.geometry.computeBoundingSphere();
        boundingSphere = mesh.geometry.boundingSphere;

        this.m_camera.position.z = 2739;

        lod.addLevel(mesh, 3 * LOD_level_medium_distance);
        mesh.position.x = -boundingSphere.center.x;
        mesh.position.y = -boundingSphere.center.y;
        mesh.position.z = -boundingSphere.center.z;

        lod.position.x = lod_position.x = boundingSphere.center.x;
        lod.position.y = lod_position.y = boundingSphere.center.y;
        lod.position.z = lod_position.z = boundingSphere.center.z;
        new THREE.Vector3(lod.position.x, lod.position.y, lod.position.y);

        this.m_scene.add(lod);

        this.m_lodlist.push({
            lodinstance: lod, lodposition: lod_position, medium_layer: LOD_level_medium, mediumdistance: LOD_level_medium_distance, high_layer: LOD_level_high, highdistance: boundingSphere
            , medium_loaded: false, high_loaded: false
        })
    };

    this.monitorDistance = function () {

        console.log("Monitoring distance");

        var cameraposition = new THREE.Vector3();
        var loader = this.m_loader;

        cameraposition.x = this.m_camera.position.x;
        cameraposition.y = this.m_camera.position.y;
        cameraposition.z = this.m_camera.position.z;

        this.m_lodlist.forEach(function (element) {
            console.log(element);
            if ((!element.high_loaded) | (!element.medium_loaded)) {
                var distance = cameraposition.distanceTo(element.lodposition);
                console.log(distance);
                if (!element.high_loaded && distance < element.highdistance) {
                    loader.load(element.high_layer, gltf => loadHidherresolution(gltf, element.lodinstance, element.highdistance), null, null);
                    console.log("Adding high resolution");
                    element.medium_loaded = true;
                }
                if (!element.high_loaded && distance < element.mediumdistance) {
                    loader.load(element.medium_layer, gltf => loadHidherresolution(gltf, element.lodinstance, element.mediumdistance), null, null);
                    console.log("Adding medium resolution");
                    element.medium_loaded = true;
                }

            }

        });

    }

    this.InitEventListener = function () {

        var context = this;

        this.m_renderer.domElement.addEventListener('mousedown', function (event) {
            //clicked(event);
            context.monitorDistance();
            camera.updateMatrixWorld();
        });

        this.m_renderer.domElement.addEventListener('wheel', function (event) {
            //console.log("scroll event")
            context.monitorDistance();
            //console.log(this);
            camera.updateMatrixWorld();
        });

    }

    this.InitEventListener();

}



function loadAndMergeMesh(gltf) {

    var geometries = [];
    var materials = [];

    gltf.scene.traverse(function (child) {

        if (child.isMesh) {
            var geometry = child.geometry;
            var material = child.material;

            geometries.push(geometry);
            materials.push(material);
        }

    });

    var geometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
    var material = new THREE.MultiMaterial(materials);
    material.wireframe = true;
    var mesh = new THREE.Mesh(geometry, material);

    return mesh;
}

LOD.prototype.AddBaseLayer = function (base_layer, medium_layer, LOD_level_medium_distance, high_layer) {
    const onProgress = () => { };

    const onError = (errorMessage) => {
        console.log(errorMessage);
    };
    this.m_loader.load(base_layer, gltf => this.m_InitBaseLayer(gltf, medium_layer, LOD_level_medium_distance, high_layer), onProgress, onError);
};
