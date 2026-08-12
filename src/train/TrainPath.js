import * as THREE from 'three';

class TrainPath {
  constructor() {
    // Define control points for the full journey
    // These form a cinematic S-curve through the world
    this._points = [
      new THREE.Vector3(0, 0, 0),       // t=0.00 - Hero/Station
      new THREE.Vector3(0, 0, -8),      // t - Leaving station
      new THREE.Vector3(3, 0, -18),     // Departure curve
      new THREE.Vector3(8, 0, -28),     // Open countryside
      new THREE.Vector3(12, 0, -40),    // Towards bridge
      new THREE.Vector3(12, 4, -52),    // Bridge (elevated)
      new THREE.Vector3(12, 4, -62),    // Bridge midpoint
      new THREE.Vector3(10, 1, -74),    // Bridge end
      new THREE.Vector3(8, 0, -84),     // Tunnel approach
      new THREE.Vector3(5, 0, -92),     // Entering tunnel
      new THREE.Vector3(2, 0, -102),    // Tunnel inside
      new THREE.Vector3(0, 0, -112),    // Tunnel exit
      new THREE.Vector3(-5, 0, -122),   // World reveal
      new THREE.Vector3(-15, 0, -130),  // World area
      new THREE.Vector3(-20, 0, -138),  // Station map
      new THREE.Vector3(-25, 0, -145),  // Station focus
      new THREE.Vector3(-20, 0, -155),  // Achievement
      new THREE.Vector3(-10, 0, -160),  // Parent
      new THREE.Vector3(0, 0, -165),    // Final
    ];
    
    this._curve = new THREE.CatmullRomCurve3(this._points, false, 'catmullrom', 0.5);
    
    // Map story chapters to normalized t values (0-1)
    this._stationT = {
      hero: 0.0,
      departure: 0.12,
      bridge: 0.28,
      tunnelApproach: 0.40,
      tunnelInside: 0.48,
      worldReveal: 0.57,
      stationMap: 0.65,
      stationFocus: 0.75,
      achievement: 0.87,
      parent: 0.93,
      final: 0.98,
    };
  }
  
  getPointAt(t) {
    return this._curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1));
  }
  
  getTangentAt(t) {
    return this._curve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1));
  }
  
  getStationT(name) {
    return this._stationT[name] ?? 0;
  }
  
  getLength() {
    return this._curve.getLength();
  }
  
  getCurve() {
    return this._curve;
  }
  
  // Create visual rail mesh along the path
  createRailMesh(scene) {
    try {
      const group = new THREE.Group();
      const railMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.6,
        roughness: 0.4
      });

      const createOffsetCurve = (offset) => {
        const points = this._curve.getSpacedPoints(200);
        const offsetPoints = points.map((p, i) => {
          const tangent = this._curve.getTangentAt(i / 200);
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
          return p.clone().add(right.multiplyScalar(offset));
        });
        return new THREE.CatmullRomCurve3(offsetPoints);
      };

      const railGeom = (curve) => new THREE.TubeGeometry(curve, 200, 0.08, 6, false);
      
      const leftRail = new THREE.Mesh(railGeom(createOffsetCurve(-0.85)), railMaterial);
      const rightRail = new THREE.Mesh(railGeom(createOffsetCurve(0.85)), railMaterial);
      
      group.add(leftRail);
      group.add(rightRail);
      
      // Create sleepers (wooden ties)
      const sleeperGeom = new THREE.BoxGeometry(2.5, 0.1, 0.3);
      const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
      
      const points = this._curve.getSpacedPoints(200);
      for (let i = 0; i < points.length; i += 3) {
        const pt = points[i];
        const tangent = this._curve.getTangentAt(i / points.length);
        
        const sleeper = new THREE.Mesh(sleeperGeom, sleeperMat);
        sleeper.position.copy(pt);
        sleeper.position.y -= 0.05;
        
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
        sleeper.quaternion.copy(targetQuat);
        
        group.add(sleeper);
      }
      
      if (scene) {
        scene.add(group);
      }
      return group;
    } catch (err) {
      console.warn("Failed to create rail mesh", err);
      return null;
    }
  }
  
  // Debug: show the curve as a line
  createDebugLine(scene) {
    try {
      const points = this._curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const line = new THREE.Line(geometry, material);
      
      if (scene) scene.add(line);
      return line;
    } catch (err) {
      console.warn("Failed to create debug line", err);
      return null;
    }
  }
}

export default new TrainPath();
