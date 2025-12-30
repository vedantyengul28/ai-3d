import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import './Avatar3D.css';

// Comprehensive teacher animation: head nodding, mouth movement, idle motion
function TeacherAnimation({ groupRef, isSpeaking }) {
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    t.current += delta;

    // Reset base pose (important)
    groupRef.current.rotation.set(0, 0, 0);

    if (isSpeaking) {
      // VERY slow, calm movements
      groupRef.current.rotation.x = Math.sin(t.current * 1.2) * 0.02;
      groupRef.current.rotation.y = Math.sin(t.current * 0.8) * 0.015;
    }
  });

  return null;
}


function AvatarModel({ modelPath, onModelLoad, isSpeaking }) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef(null);

  useEffect(() => {
    // Notify parent that model has loaded
    if (onModelLoad && scene) {
      onModelLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Configure avatar as half-body teacher: face camera directly, position upper body in view
  // Move model up to hide legs, scale for teacher framing
  return (
    <group ref={groupRef}>
      <primitive 
        object={scene} 
        scale={1.4}
        position={[0, 0 , 0]} // Move up to show upper body, hide legs below view
        rotation={[0, 0, 0]} // Face camera directly (0 rotation) for eye contact
      />
      <TeacherAnimation groupRef={groupRef} isSpeaking={isSpeaking} />
    </group>
  );
}

function Avatar3D({ avatarType, onAvatarChange }) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const maleModelPath = '/models/male-avatar.glb';
  const femaleModelPath = '/models/female-avatar (2).glb';
  const checkIntervalRef = useRef(null);

  // Reset model loaded state when avatar type changes
  useEffect(() => {
    setModelLoaded(false);
  }, [avatarType]);

  // Monitor speech synthesis to detect when avatar should be speaking
  useEffect(() => {
    // Check speechSynthesis speaking state periodically
    checkIntervalRef.current = setInterval(() => {
      const isCurrentlySpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
      setIsSpeaking(isCurrentlySpeaking);
    }, 100); // Check every 100ms for responsive animation

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const handleModelLoad = () => {
    setModelLoaded(true);
  };

  return (
    <div className="avatar-container">
      <div className="avatar-selector">
        <button
          className={`avatar-button ${avatarType === 'male' ? 'active' : ''}`}
          onClick={() => onAvatarChange('male')}
        >
          Male
        </button>
        <button
          className={`avatar-button ${avatarType === 'female' ? 'active' : ''}`}
          onClick={() => onAvatarChange('female')}
        >
          Female
        </button>
      </div>
      <div className="avatar-canvas-container">
        {/* Teacher framing: camera positioned close to face, centered on upper body */}
        <Canvas camera={{ position: [0, 1.8, 3.5], fov: 20 }}>
          {/* Natural lighting for virtual instructor */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={1.0} />
          <directionalLight position={[-2, 3, 3]} intensity={0.5} />
          <Suspense fallback={<Html center><div className="avatar-loading">Loading avatar...</div></Html>}>
            <AvatarModel
              modelPath={avatarType === 'male' ? maleModelPath : femaleModelPath}
              onModelLoad={handleModelLoad}
              isSpeaking={isSpeaking}
            />
            <Environment preset="studio" />
          </Suspense>
          {/* Limited orbit controls for teacher framing - keep avatar facing camera */}
          {/* <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={3}
            maxDistance={6}
            minPolarAngle={Math.PI / 3} 
            maxPolarAngle={Math.PI / 2}
            target={[0, 2.3, 0]} 
          /> */}
          {/* <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            target={[0, 2.3, 0]}
          /> */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            target={[0, 2.3, 0]}
          />
        </Canvas>
        {!modelLoaded && (
          <div className="avatar-placeholder">
            <p>3D Avatar Viewer</p>
            <small>Loading avatar model...</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Avatar3D;
