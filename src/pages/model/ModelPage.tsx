import { useEffect, useRef, useState } from "react";
import { useAppData } from "../../app/data/useAppData";
import * as THREE from "three";

export function ModelPage() {
  const { data } = useAppData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScan = data.scans.find(s => s.id === data.selectedT2);

  useEffect(() => {
    if (!canvasRef.current || !selectedScan) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Load point cloud data
    loadPointCloud(selectedScan.id);

    async function loadPointCloud(scanId: string) {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/scans/${scanId}/points`);
        if (!response.ok) {
          throw new Error(`Failed to load points: ${response.statusText}`);
        }
        
        const data = await response.json();
        const points = data.points;
        
        if (!points || points.length === 0) {
          throw new Error("No points found in scan");
        }

        // Create geometry from points
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        
        // Find bounds for centering
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        for (let i = 0; i < points.length; i++) {
          const [x, y, z] = points[i];
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
          
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Center the point cloud
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        geometry.translate(-centerX, -centerY, -centerZ);
        
        // Create material and points
        const material = new THREE.PointsMaterial({ 
          color: 0x888888, 
          size: 0.01,
          sizeAttenuation: true 
        });
        const pointCloud = new THREE.Points(geometry, material);
        scene.add(pointCloud);
        
        // Adjust camera to fit the point cloud
        const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        camera.position.set(0, 0, size * 1.5);
        camera.lookAt(0, 0, 0);
        
      } catch (err) {
        console.error("Error loading point cloud:", err);
        setError(err instanceof Error ? err.message : "Failed to load point cloud");
        
        // Fallback: add a simple cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
      } finally {
        setLoading(false);
      }
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      if (sceneRef.current) {
        // Dispose of geometries and materials
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [selectedScan]);

  if (!selectedScan) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-2xl font-semibold">3D Model</div>
          <div className="text-sm muted">Select a t₂ scan on the Scans page to view its 3D model.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold">3D Model</div>
        <div className="text-sm muted">
          Viewing {selectedScan.name}
          {loading && " (Loading...)"}
          {error && ` (Error: ${error})`}
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-96 border border-app" />
    </div>
  );
}