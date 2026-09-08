"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Plus, Minus, Play, Pause } from "lucide-react";

export interface Truck3DViewerRef {
  zoomIn: () => void;
  zoomOut: () => void;
  togglePlay: () => void;
  resetView: () => void;
}

interface Truck3DViewerProps {
  selectedModelId: "truck1" | "truck2";
  isDarkMode?: boolean;
  isAutoRotating?: boolean;
  onToggleAutoRotate?: () => void;
  onShowToast?: (msg: string) => void;
}

const Truck3DViewer = forwardRef<Truck3DViewerRef, Truck3DViewerProps>(
  function Truck3DViewer(
    { selectedModelId, isDarkMode = false, isAutoRotating = true, onToggleAutoRotate, onShowToast },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadProgress, setLoadProgress] = useState<number>(0);
    const [autoRotateState, setAutoRotateState] = useState<boolean>(isAutoRotating);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const modelSizeRef = useRef<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
    const reqIdRef = useRef<number | null>(null);

    // Theme-adaptive lighting & floor refs (updated without rebuilding the scene)
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const dirLight1Ref = useRef<THREE.DirectionalLight | null>(null);
    const dirLight2Ref = useRef<THREE.DirectionalLight | null>(null);
    const dirLight3Ref = useRef<THREE.DirectionalLight | null>(null);
    const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
    const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
    const floorRef = useRef<THREE.Mesh | null>(null);

    const modelPaths: Record<"truck1" | "truck2", string> = {
      truck1: "/truck1.glb",
      truck2: "/truck2.glb",
    };

    // Zoom and control functions
    const zoomIn = () => {
      if (!cameraRef.current || !controlsRef.current) return;
      const target = controlsRef.current.target;
      const offset = cameraRef.current.position.clone().sub(target);
      offset.multiplyScalar(0.8);
      cameraRef.current.position.copy(target).add(offset);
      controlsRef.current.update();
    };

    const zoomOut = () => {
      if (!cameraRef.current || !controlsRef.current) return;
      const target = controlsRef.current.target;
      const offset = cameraRef.current.position.clone().sub(target);
      offset.multiplyScalar(1.25);
      cameraRef.current.position.copy(target).add(offset);
      controlsRef.current.update();
    };

    const togglePlay = () => {
      const next = !autoRotateState;
      setAutoRotateState(next);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next;
      }
      onToggleAutoRotate?.();
      onShowToast?.(next ? "3D Model 360° Rotation Playing" : "3D Model Rotation Paused");
    };

    const resetView = () => {
      if (!cameraRef.current || !controlsRef.current || !modelSizeRef.current) return;
      const { size } = modelSizeRef.current;
      const dist = 11.8;
      const targetY = (size.y || 4) * 0.58;
      const isZLonger = size.z >= size.x;
      if (isZLonger) {
        cameraRef.current.position.set(
          dist,
          targetY,
          0.01
        );
      } else {
        cameraRef.current.position.set(
          0.01,
          targetY,
          dist
        );
      }
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    };

    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      togglePlay,
      resetView,
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      setLoading(true);
      setLoadProgress(0);

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Transparent background so it blends seamlessly with the card.
      // The card itself supplies the black/grey/white backdrop in dark mode.
      scene.background = null;

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 320;
      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
      camera.position.set(16, 4, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isDarkMode ? 1.05 : 1.35;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Generate realistic HDR Room Environment for vivid PBR materials & textures
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const roomEnv = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

      rendererRef.current = renderer;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 + 0.04;
      controls.minDistance = 1;
      controls.maxDistance = 100;
      controls.autoRotate = true; // Auto-rotate by default (Play active)
      controls.autoRotateSpeed = 1.6;
      controlsRef.current = controls;

      // Multi-angle Studio Lighting for rich color rendering
      const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.6 : 2.0);
      ambientLightRef.current = ambientLight;
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, isDarkMode ? 1.1 : 2.4);
      dirLight1.position.set(15, 25, 20);
      dirLight1.castShadow = true;
      dirLight1.shadow.mapSize.width = 1024;
      dirLight1.shadow.mapSize.height = 1024;
      dirLight1.shadow.bias = -0.0005;
      dirLight1Ref.current = dirLight1;
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.55 : 1.8);
      dirLight2.position.set(-15, 15, -15);
      dirLight2Ref.current = dirLight2;
      scene.add(dirLight2);

      const dirLight3 = new THREE.DirectionalLight(isDarkMode ? 0xffffe0 : 0xfff8ee, isDarkMode ? 0.4 : 1.2);
      dirLight3.position.set(15, 10, -15);
      dirLight3Ref.current = dirLight3;
      scene.add(dirLight3);

      const hemiLight = new THREE.HemisphereLight(
        isDarkMode ? 0x404040 : 0xffffff,
        isDarkMode ? 0x202020 : 0xe2e8f0,
        isDarkMode ? 0.4 : 1.2
      );
      hemiLightRef.current = hemiLight;
      scene.add(hemiLight);

      // Subtle contact shadow floor
      const shadowPlaneGeo = new THREE.PlaneGeometry(60, 60);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: isDarkMode ? 0.3 : 0.15 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.01;
      shadowPlane.receiveShadow = true;
      shadowPlaneRef.current = shadowPlane;
      scene.add(shadowPlane);

      // Dark theme gets a visible matte grey floor (black shadows are invisible
      // on a near-black backdrop, so grounding the truck shows its silhouette).
      const floorGeo = new THREE.PlaneGeometry(60, 60);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1c1c1c,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.45,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.02;
      floor.receiveShadow = true;
      floor.visible = isDarkMode;
      floorRef.current = floor;
      scene.add(floor);

      // Load model with optional Draco decoding support
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
      loader.setDRACOLoader(dracoLoader);

      const modelUrl = modelPaths[selectedModelId] || "/truck1.glb";
      let isDisposed = false;

      const onLoadSuccess = (gltf: any) => {
        if (isDisposed) return;
        const model = gltf.scene;
        modelRef.current = model;

        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = new THREE.Vector3();
        rawBox.getSize(rawSize);
        const rawMaxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;

        // Standardize model to a balanced, prominent size (length ~ 10.2 units)
        const scaleFactor = 10.2 / rawMaxDim;
        model.scale.setScalar(scaleFactor);

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Ensure all meshes and textures use correct SRGB color space and double-sided materials
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }

            const processMaterial = (mat: any) => {
              if (!mat) return;
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.needsUpdate = true;
              }
              if (mat.emissiveMap) {
                mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              }
              if (mat.envMapIntensity === undefined || mat.envMapIntensity === 0) {
                mat.envMapIntensity = 1.0;
              }
              if (mat.opacity === 0) {
                mat.opacity = 1;
                mat.transparent = false;
              }
            };

            if (Array.isArray(child.material)) {
              child.material.forEach(processMaterial);
            } else if (child.material) {
              processMaterial(child.material);
            }
          }
        });

        scene.add(model);

        const targetY = (size.y || 4) * 0.58;
        const adjustedCenter = new THREE.Vector3(0, targetY, 0);
        modelSizeRef.current = { size, center: adjustedCenter };

        const dist = 11.8;

        // Default Side View: frame from broadside with balanced proportions & subtle upward shift
        const isZLonger = size.z >= size.x;
        if (isZLonger) {
          camera.position.set(
            dist,
            targetY,
            0.01
          );
        } else {
          camera.position.set(
            0.01,
            targetY,
            dist
          );
        }

        controls.target.set(0, targetY, 0);
        controls.update();

        setLoading(false);
        setLoadProgress(100);
      };

      loader.load(
        modelUrl,
        onLoadSuccess,
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
          } else {
            setLoadProgress((prev) => (prev < 90 ? prev + 15 : 90));
          }
        },
        (err) => {
          console.error(`Error loading model ${modelUrl}:`, err);
          setLoading(false);
        }
      );

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);

      const animate = () => {
        reqIdRef.current = requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };
      animate();

      return () => {
        isDisposed = true;
        resizeObserver.disconnect();
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        scene.clear();
        floorRef.current = null;
        shadowPlaneRef.current = null;
        ambientLightRef.current = null;
        dirLight1Ref.current = null;
        dirLight2Ref.current = null;
        dirLight3Ref.current = null;
        hemiLightRef.current = null;
        sceneRef.current = null;
        rendererRef.current = null;
        controlsRef.current = null;
      };
    }, [selectedModelId]);

    // Adapt lights + floor to the current theme without rebuilding the scene.
    useEffect(() => {
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = isDarkMode ? 0.6 : 2.0;
      }
      if (dirLight1Ref.current) {
        dirLight1Ref.current.intensity = isDarkMode ? 1.1 : 2.4;
      }
      if (dirLight2Ref.current) {
        dirLight2Ref.current.intensity = isDarkMode ? 0.55 : 1.8;
      }
      if (dirLight3Ref.current) {
        dirLight3Ref.current.intensity = isDarkMode ? 0.4 : 1.2;
        dirLight3Ref.current.color.set(isDarkMode ? 0xffffe0 : 0xfff8ee);
      }
      if (hemiLightRef.current) {
        hemiLightRef.current.intensity = isDarkMode ? 0.4 : 1.2;
        hemiLightRef.current.color.set(isDarkMode ? 0x8a8a8a : 0xffffff);
        hemiLightRef.current.groundColor.set(isDarkMode ? 0x555555 : 0xe2e8f0);
      }
      if (shadowPlaneRef.current) {
        const mat = shadowPlaneRef.current.material as THREE.ShadowMaterial;
        mat.opacity = isDarkMode ? 0.3 : 0.15;
      }
      if (floorRef.current) {
        floorRef.current.visible = isDarkMode;
      }
      if (rendererRef.current) {
        rendererRef.current.toneMappingExposure = isDarkMode ? 1.05 : 1.35;
      }
    }, [isDarkMode]);

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        {/* 3D Canvas */}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            cursor: "grab",
          }}
        />

        {/* Loading Spinner */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: isDarkMode ? "rgba(13, 13, 13, 0.88)" : "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(4px)",
              zIndex: 10,
              gap: 8,
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2.5px solid #333333",
                borderTopColor: isDarkMode ? "#faff02" : "#111827",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: isDarkMode ? "#d4d4d4" : "#334155" }}>
              Loading 3D Model ({loadProgress}%)
            </span>
          </div>
        )}

        {/* Floating Zoom and Play Controls inside the card */}
        <div
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 5,
          }}
        >
          <button
            type="button"
            className="truck-zoom-btn"
            onClick={zoomIn}
            title="Zoom In"
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              border: isDarkMode ? "1px solid #3d3d3d" : "1px solid #e2e8f0",
              background: isDarkMode ? "#161616" : "#ffffff",
              boxShadow: isDarkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: isDarkMode ? "#d4d4d4" : "#334155",
            }}
          >
            <Plus size={13} />
          </button>

          <button
            type="button"
            className="truck-zoom-btn"
            onClick={zoomOut}
            title="Zoom Out"
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              border: isDarkMode ? "1px solid #3d3d3d" : "1px solid #e2e8f0",
              background: isDarkMode ? "#161616" : "#ffffff",
              boxShadow: isDarkMode ? "0 2px 6px rgba(0,0,0,0.6)" : "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: isDarkMode ? "#d4d4d4" : "#334155",
            }}
          >
            <Minus size={13} />
          </button>

          <button
            type="button"
            className="truck-zoom-btn"
            onClick={togglePlay}
            title={autoRotateState ? "Pause Rotation" : "Auto Rotate 360°"}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              border: autoRotateState ? "1px solid #faff02" : isDarkMode ? "1px solid #3d3d3d" : "1px solid #e2e8f0",
              background: autoRotateState ? "#faff02" : isDarkMode ? "#161616" : "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: autoRotateState ? "#111827" : isDarkMode ? "#d4d4d4" : "#111827",
            }}
          >
            {autoRotateState ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      </div>
    );
  }
);

export default Truck3DViewer;
