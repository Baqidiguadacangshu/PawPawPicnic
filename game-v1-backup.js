import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// 1. 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color("#e8faf2");

// 2. 创建摄像机
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(12, 14, 18);
camera.lookAt(0, 0, 0);

// 3. 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

document.getElementById("game").appendChild(renderer.domElement);

// 4. 添加灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffffff, 3);
sunlight.position.set(5, 12, 8);
sunlight.castShadow = true;
scene.add(sunlight);

// 5. 创建 Low-poly 草地
const grassGeometry = new THREE.CylinderGeometry(9, 9, 1, 8);

const grassMaterial = new THREE.MeshStandardMaterial({
    color: "#a8dfb4",
    flatShading: true
});

const island = new THREE.Mesh(grassGeometry, grassMaterial);
island.position.y = -0.5;
island.receiveShadow = true;
scene.add(island);

// 6. 创建树木
function createTree(x, z) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 1.5, 6),
        new THREE.MeshStandardMaterial({ color: "#c89b75" })
    );

    trunk.position.y = 0.75;
    trunk.castShadow = true;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2, 0),
        new THREE.MeshStandardMaterial({
            color: "#8bd6a4",
            flatShading: true
        })
    );

    leaves.position.y = 2.2;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(x, 0, z);
    scene.add(tree);
}

createTree(-5, -4);
createTree(5, -3);
createTree(-4, 4);
createTree(4, 5);

// 7. 创建可爱的小狗
const dog = new THREE.Group();

const whiteMaterial = new THREE.MeshStandardMaterial({
    color: "#fff9ed",
    flatShading: true
});

const brownMaterial = new THREE.MeshStandardMaterial({
    color: "#d7aa79",
    flatShading: true
});

const blackMaterial = new THREE.MeshStandardMaterial({
    color: "#292929"
});

// 身体
const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 12, 8),
    whiteMaterial
);
body.scale.set(1, 0.8, 1.1);
body.position.y = 0.8;
dog.add(body);

// 头
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 12, 8),
    whiteMaterial
);
head.position.y = 1.7;
dog.add(head);

// 耳朵
function createEar(x) {
    const ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        brownMaterial
    );

    ear.scale.set(0.8, 1.4, 0.5);
    ear.position.set(x, 2.2, 0);
    dog.add(ear);
}

createEar(-0.65);
createEar(0.65);

// 眼睛
function createEye(x) {
    const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        blackMaterial
    );

    eye.position.set(x, 1.8, 0.78);
    dog.add(eye);
}

createEye(-0.3);
createEye(0.3);

// 鼻子
const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    blackMaterial
);

nose.position.set(0, 1.5, 0.85);
dog.add(nose);

// 添加小狗
scene.add(dog);

// 8. 动画循环
function animate() {
    requestAnimationFrame(animate);

    dog.rotation.y += 0.005;

    renderer.render(scene, camera);
}

animate();

// 9. 自适应窗口大小
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});