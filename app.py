from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# Helper function 處理轉移機率與邊界
def get_transition(n, obstacles, end, r, c, action):
    nr, nc = r, c
    if action == 'up': nr -= 1
    elif action == 'down': nr += 1
    elif action == 'left': nc -= 1
    elif action == 'right': nc += 1
    
    # Boundary Check -> 撞牆則彈回原位
    if nr < 0 or nr >= n or nc < 0 or nc >= n:
        return r, c, -1
        
    # Obstacle Check -> 撞倒障礙物則彈回原位
    if {'r': nr, 'c': nc} in obstacles:
        return r, c, -1
        
    # Terminal (End) Check -> 抵達終點
    if {'r': nr, 'c': nc} == end:
        return nr, nc, 10
        
    # Normal step
    return nr, nc, -1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """ HW1-2: 隨機策略評估 (Policy Evaluation of Random Policy) """
    data = request.json
    n = data.get('n', 5)
    start = data.get('start')
    end = data.get('end')
    obstacles = data.get('obstacles', [])
    
    if not start or not end:
        return jsonify({'error': 'Missing start or end state'}), 400
    
    # 產生稍微改良過的隨機政策 (帶有終點引力) 免得全部陷入死局 -10
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
                if r > 0 and {'r': r-1, 'c': c} == end:
                    row_policy.append('up')
                elif r < n-1 and {'r': r+1, 'c': c} == end:
                    row_policy.append('down')
                elif c > 0 and {'r': r, 'c': c-1} == end:
                    row_policy.append('left')
                elif c < n-1 and {'r': r, 'c': c+1} == end:
                    row_policy.append('right')
                else:
                    row_policy.append(random.choice(actions))
        policy.append(row_policy)
        
    V = [[0.0 for _ in range(n)] for _ in range(n)]
    gamma = 0.9
    theta = 1e-4

    iterations = 0
    max_iterations = 5000
    while iterations < max_iterations:
        delta = 0
        for r in range(n):
            for c in range(n):
                cell = {'r': r, 'c': c}
                if cell == end or cell in obstacles:
                    continue
                    
                v = V[r][c]
                action = policy[r][c]
                nr, nc, reward = get_transition(n, obstacles, end, r, c, action)
                
                new_v = reward + gamma * V[nr][nc]
                V[r][c] = new_v
                delta = max(delta, abs(v - new_v))
                
        if delta < theta:
            break
        iterations += 1
            
    for r in range(n):
        for c in range(n):
            V[r][c] = round(V[r][c], 2)
            
    return jsonify({
        'policy': policy,
        'values': V,
        'iterations': iterations,
        'type': 'random'
    })


@app.route('/api/value_iteration', methods=['POST'])
def value_iteration():
    """ HW1-3: 價值迭代算法推導最佳政策 (Value Iteration) """
    data = request.json
    n = data.get('n', 5)
    start = data.get('start')
    end = data.get('end')
    obstacles = data.get('obstacles', [])
    
    if not start or not end:
        return jsonify({'error': 'Missing start or end state'}), 400
        
    V = [[0.0 for _ in range(n)] for _ in range(n)]
    gamma = 0.9
    theta = 1e-4
    actions = ['up', 'down', 'left', 'right']

    # 執行 Value Iteration 求出最佳 V*(s)
    iterations = 0
    max_iterations = 5000
    while iterations < max_iterations:
        delta = 0
        for r in range(n):
            for c in range(n):
                cell = {'r': r, 'c': c}
                if cell == end or cell in obstacles:
                    continue
                    
                v = V[r][c]
                max_v = float('-inf')
                
                for action in actions:
                    nr, nc, reward = get_transition(n, obstacles, end, r, c, action)
                    expected = reward + gamma * V[nr][nc]
                    if expected > max_v:
                        max_v = expected
                        
                V[r][c] = max_v
                delta = max(delta, abs(v - max_v))
                
        if delta < theta:
            break
        iterations += 1
        
    # 推導 Optimal Policy \pi^*(s)
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
                max_v = float('-inf')
                best_action = 'up'
                for action in actions:
                    nr, nc, reward = get_transition(n, obstacles, end, r, c, action)
                    expected = reward + gamma * V[nr][nc]
                    if expected > max_v:
                        max_v = expected
                        best_action = action
                row_policy.append(best_action)
        policy.append(row_policy)
        
    for r in range(n):
        for c in range(n):
            V[r][c] = round(V[r][c], 2)
            
    return jsonify({
        'policy': policy,
        'values': V,
        'iterations': iterations,
        'type': 'optimal'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
