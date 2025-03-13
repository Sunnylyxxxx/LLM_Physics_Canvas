from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import pybullet as p
import pybullet_data
import time

app = Flask(__name__)
CORS(app) 

# OpenAI API Key
OPENAI_API_KEY = "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"  # 你的 GPT-4 API Key
openai.api_key = OPENAI_API_KEY
client = openai.OpenAI(api_key=OPENAI_API_KEY)

def setup_simulation(gravity=-9.8, velocity=1.0):
    """Initializes PyBullet with user-defined gravity and velocity."""
    physicsClient = p.connect(p.DIRECT)
    p.setAdditionalSearchPath(pybullet_data.getDataPath())
    p.setGravity(0, 0, gravity)
    p.setTimeStep(1/240)
    plane_id = p.loadURDF("plane.urdf")
    ball_id = p.loadURDF("sphere_small.urdf", basePosition=[0, 0, 1])
    p.resetBaseVelocity(ball_id, linearVelocity=[velocity, 0, 0])
    return ball_id

def run_simulation(ball_id):
    """Runs the simulation and stores trajectory data."""
    x_data, y_data = [], []
    for i in range(200):  # Simulate 200 time steps
        p.stepSimulation()
        pos, _ = p.getBasePositionAndOrientation(ball_id)
        x_data.append(pos[0])
        y_data.append(pos[2])
        time.sleep(0.01)
    p.disconnect()
    return x_data, y_data

@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.json
    user_input = data.get("user_input")

    # 🔥 
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
             {"role": "system", "content": "Extract physics parameters (gravity, velocity, mass) as pure numbers. Gravity should always be negative number.Only output key:value pairs without any explanations."},
            {"role": "user", "content": user_input}
        ]
    )
    
    extracted_params = response.choices[0].message.content  
    print(extracted_params)  # Debugging

    # 
    physics_params = {}
    for line in extracted_params.split("\n"):
        if ":" in line:
            key, value = line.split(":")
            physics_params[key.strip()] = float(value.strip())

    #  PyBullet 
    ball_id = setup_simulation(
        gravity=physics_params.get("gravity", -9.8),
        velocity=physics_params.get("velocity", 1.0)
    )
    x_data, y_data = run_simulation(ball_id)

    return jsonify({
        "physics_params": physics_params,  # 
        "x_data": x_data,
        "y_data": y_data
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
