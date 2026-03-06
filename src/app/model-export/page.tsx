"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildMoffiModel } from '@/components/game/MoffiModel3D';

export default function ModelExportPage() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [status, setStatus] = useState('3D model yükleniyor...');
    const modelRef = useRef<THREE.Group | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // ---- SCENE ----
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f0f1a);
        sceneRef.current = scene;

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambient);
        const key = new THREE.DirectionalLight(0xffeedd, 2.5);
        key.position.set(3, 6, 5);
        key.castShadow = true;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xaaccff, 1.0);
        fill.position.set(-4, 3, -3);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0xff9966, 0.8);
        rim.position.set(0, -2, -5);
        scene.add(rim);

        // Floor grid
        const grid = new THREE.GridHelper(6, 20, 0x333344, 0x222233);
        grid.position.y = -1.3;
        scene.add(grid);

        // Moffi model
        const moffi = buildMoffiModel();
        moffi.position.set(0, 0, 0);
        scene.add(moffi);
        modelRef.current = moffi;

        // Idle bob animation on the model
        let t = 0;

        setStatus('Hazır! GLB olarak indirebilirsin.');

        // ---- CAMERA ----
        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(0, 0.5, 4);

        // ---- RENDERER ----
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        canvasRef.current.appendChild(renderer.domElement);

        // ---- CONTROLS ----
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.minDistance = 1.5;
        controls.maxDistance = 8;
        controls.target.set(0, 0, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.5;

        // ---- RESIZE ----
        const onResize = () => {
            if (!canvasRef.current) return;
            const nw = canvasRef.current.clientWidth;
            const nh = canvasRef.current.clientHeight;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        };
        window.addEventListener('resize', onResize);

        // ---- LOOP ----
        let raf: number;
        const animate = () => {
            raf = requestAnimationFrame(animate);
            t += 0.016;
            // Gentle idle float
            if (modelRef.current) {
                modelRef.current.position.y = Math.sin(t * 1.2) * 0.04;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            canvasRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    const downloadGLB = async () => {
        if (!modelRef.current) return;
        setDownloading(true);
        setStatus('GLB dosyası hazırlanıyor...');
        try {
            const exporter = new GLTFExporter();
            const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
                exporter.parse(
                    modelRef.current!,
                    (result) => resolve(result as ArrayBuffer),
                    (err) => reject(err),
                    { binary: true, animations: [] }
                );
            });
            const blob = new Blob([glb], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'moffi.glb';
            a.click();
            URL.revokeObjectURL(url);
            setStatus('✅ moffi.glb indirildi! Mixamo\'ya yükleyebilirsin.');
        } catch (e) {
            setStatus('❌ Export hatası: ' + String(e));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-4xl px-6 pt-8 pb-4">
                <h1 className="text-4xl font-black tracking-tight">
                    🐱 Moffi <span className="text-purple-400">3D Model</span>
                </h1>
                <p className="text-white/40 mt-1 text-sm">
                    360° görüntüle · GLB indir · Mixamo'ya yükle · RIG ekle
                </p>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="w-full max-w-4xl mx-6 rounded-3xl overflow-hidden border border-white/10"
                style={{ height: '60vh' }}
            />

            {/* Status */}
            <p className="mt-4 text-white/50 text-sm">{status}</p>

            {/* Actions */}
            <div className="flex gap-4 mt-6 mb-8">
                <button
                    onClick={downloadGLB}
                    disabled={downloading}
                    className="px-10 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-lg rounded-2xl transition-all shadow-[0_8px_0_rgb(109,40,217)] active:translate-y-1 active:shadow-none"
                >
                    {downloading ? '⏳ Hazırlanıyor...' : '⬇️ GLB İndir'}
                </button>

                <a
                    href="https://www.mixamo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg rounded-2xl transition-all"
                >
                    🎬 Mixamo'ya Git
                </a>
            </div>

            {/* Instructions */}
            <div className="w-full max-w-4xl px-6 mb-12">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-white font-black text-lg mb-4">📋 Sonraki Adımlar</h2>
                    <ol className="space-y-3 text-white/60 text-sm">
                        <li className="flex gap-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">1</span>
                            <span><strong className="text-white">GLB İndir</strong> butonuna bas → moffi.glb dosyası iner</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">2</span>
                            <span><strong className="text-white">Mixamo.com</strong>'a git → Adobe ile giriş yap (ücretsiz)</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">3</span>
                            <span><strong className="text-white">"Upload Character"</strong> → moffi.glb'yi yükle → Otomatik iskelet eklenir</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">4</span>
                            <span>Animasyonları seç → <strong className="text-white">FBX for Unity formatında</strong> indir (her biri 1-2 MB)</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black text-xs flex-shrink-0">5</span>
                            <span>İndirdiğin FBX'leri <strong className="text-white">Anime klasörüne</strong> koy → ben oyuna bağlarım 🚀</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
