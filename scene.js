import * as THREE from 'three';
import { TubeGeometry, CatmullRomCurve3 } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- BASIC SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('webgl-canvas'),
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// --- CONSTELLATION (NEURAL NET) ---
const particleCount = 2000;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0x555555,
    size: 0.02,
    sizeAttenuation: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// --- RIBBON FLOW ---
const curve = new CatmullRomCurve3([
    new THREE.Vector3(-5, 3, 0),
    new THREE.Vector3(0, 0, -2),
    new THREE.Vector3(5, -5, 0),
    new THREE.Vector3(0, -10, 2),
    new THREE.Vector3(-5, -15, 0),
    new THREE.Vector3(0, -20, -2),
    new THREE.Vector3(5, -25, 0)
]);

const tubeGeometry = new TubeGeometry(curve, 100, 0.05, 8, false);
const tubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xE8C547,
    metalness: 0.8,
    roughness: 0.4,
    emissive: 0xE8C547,
    emissiveIntensity: 0.2
});
const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tubeMesh);

// We will only draw a portion of the tube initially
tubeGeometry.setDrawRange(0, 0);

// --- SCROLL ANIMATION ---
const totalPoints = tubeGeometry.attributes.position.count;

gsap.to(tubeGeometry, {
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
    },
    onUpdate: function() {
        const progress = this.progress();
        const drawEnd = Math.floor(progress * totalPoints);
        tubeGeometry.setDrawRange(0, drawEnd);
    }
});

// --- MOUSE INTERACTION ---
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

function onMouseMove(event) {
    mouse.x = (event.clientX - windowHalf.x);
    mouse.y = (event.clientY - windowHalf.y);
}
document.addEventListener('mousemove', onMouseMove);

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
    windowHalf.set(window.innerWidth / 2, window.innerHeight / 2);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

const animate = () => {
    const elapsedTime = clock.getElapsedTime();

    // Lerp mouse for smooth camera movement
    target.x = (mouse.x * 0.001);
    target.y = (mouse.y * 0.001);

    camera.position.x += (target.x - camera.position.x) * 0.05;
    camera.position.y += (-target.y - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Animate particles
    particles.rotation.y = elapsedTime * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();
