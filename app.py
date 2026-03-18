from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    n = data.get('n', 5)
    start = data.get('start')
    end = data.get('end')
    obstacles = data.get('obstacles', [])
    
    # Validation
    if not start or not end:
        return jsonify({'error': 'Missing start or end state'}), 400
    
    # Initialize policy: pick one random action for each non-obstacle, non-end cell
    actions = ['up', 'down', 'left', 'right']
    policy = []
    for r in range(n):
        row_policy = []
        for c in range(n):
            cell = {'r': r, 'c': c}
            if cell == end:
                row_policy.append('end')
            elif cell in obstacles:
                row_policy.append('obstacle')
            else:
                row_policy.append(random.choice(actions))
        policy.append(row_policy)
        
    # Initialize Value Matrix
    V = [[0.0 for _ in range(n)] for _ in range(n)]
    
    # Hyperparameters for Policy Evaluation
    gamma = 0.9
    theta = 1e-4

    def get_transition(r, c, action):
        nr, nc = r, c
        if action == 'up': nr -= 1
        elif action == 'down': nr += 1
        elif action == 'left': nc -= 1
        elif action == 'right': nc += 1
        
        # Boundary (Wall) Check -> Bounce back
        if nr < 0 or nr >= n or nc < 0 or nc >= n:
            return r, c, -1
            
        # Obstacle Check -> Bounce back
        if {'r': nr, 'c': nc} in obstacles:
            return r, c, -1
            
        # Terminal (End) Check -> Absorbing state with reward +10
        if {'r': nr, 'c': nc} == end:
            return nr, nc, 10
            
        # Normal step
        return nr, nc, -1

    # Policy Evaluation loop
    iterations = 0
    max_iterations = 5000  # Prevent infinite loop
    while iterations < max_iterations:
        delta = 0
        for r in range(n):
            for c in range(n):
                cell = {'r': r, 'c': c}
                # Do not update absorbing states or obstacles
                if cell == end or cell in obstacles:
                    continue
                    
                v = V[r][c]
                action = policy[r][c]
                nr, nc, reward = get_transition(r, c, action)
                
                # new value = reward + gamma * next_state_value
                new_v = reward + gamma * V[nr][nc]
                V[r][c] = new_v
                delta = max(delta, abs(v - new_v))
                
        if delta < theta:
            break
        iterations += 1
            
    # Round values for display clarity
    for r in range(n):
        for c in range(n):
            V[r][c] = round(V[r][c], 2)
            
    return jsonify({
        'policy': policy,
        'values': V,
        'iterations': iterations
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
