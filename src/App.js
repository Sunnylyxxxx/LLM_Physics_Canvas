import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";

function Ball({ trajectory }) {
  const meshRef = useRef();
  let frameIndex = 0;

  useFrame(() => {
    if (trajectory.length > 0 && frameIndex < trajectory.length) {
      const [x, y] = trajectory[frameIndex];
      if (meshRef.current) {
        meshRef.current.position.set(x, y, 0);
      }
      frameIndex++;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [trajectory, setTrajectory] = useState([]);
  const [physicsParams, setPhysicsParams] = useState({}); // 

  const handleSimulate = async () => {
    const response = await fetch("http://127.0.0.1:5000/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: userInput }),
    });
    
    const data = await response.json();

    // 
    setPhysicsParams(data.physics_params); 

    // 
    const transformedData = data.x_data.map((x, index) => [x, data.y_data[index]]);
    setTrajectory(transformedData);
  };

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      {/* parameter */}
      <div style={{ width: "40%", padding: "20px", backgroundColor: "#f0f0f0", overflow: "auto" }}>
        <h2>Extracted Physics Parameters</h2>
        {Object.keys(physicsParams).length > 0 ? (
          <ul>
            {Object.entries(physicsParams).map(([key, value]) => (
              <li key={key}><strong>{key}:</strong> {value}</li>
            ))}
          </ul>
        ) : (
          <p>No parameters extracted yet.</p>
        )}
      </div>

      {/* 2d simulation */}
      <div style={{ width: "60%", position: "relative" }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Ball trajectory={trajectory} />
        </Canvas>

        {/* input */}
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "white", padding: "10px", borderRadius: "5px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Describe your simulation..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ padding: "10px", width: "300px" }}
          />
          <button onClick={handleSimulate} style={{ padding: "10px", cursor: "pointer" }}>
            Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
