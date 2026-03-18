document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const sizeInput = document.getElementById('grid-size');
    const btnGenerate = document.getElementById('btn-generate');
    const btnEvalRandom = document.getElementById('btn-eval-random');
    const btnValIter = document.getElementById('btn-val-iter');
    const statusText = document.getElementById('status-text');
    
    const setupSection = document.getElementById('setup-section');
    const gridTitle = document.getElementById('grid-title');
    const mainGrid = document.getElementById('main-grid');
    
    const resultsSection = document.getElementById('results-section');
    const valueGrid = document.getElementById('value-grid');
    const policyGrid = document.getElementById('policy-grid');

    // --- State Variables ---
    let state = 'INIT'; // INIT, SELECT_START, SELECT_END, SELECT_OBS, READY
    let n = 5;
    let startCell = null;
    let endCell = null;
    let obstacles = [];
    let maxObstacles = 0;

    // --- Listeners ---
    btnGenerate.addEventListener('click', () => {
        let val = parseInt(sizeInput.value);
        if (isNaN(val) || val < 5 || val > 9) {
            alert('系統限制: 請輸入 5 到 9 之間的整數。');
            return;
        }
        n = val;
        maxObstacles = n - 2;
        initGrid();
    });

    btnEvalRandom.addEventListener('click', () => {
        if (state !== 'READY') return;
        runAlgorithm('/api/evaluate', "Evaluating...", btnEvalRandom);
    });

    btnValIter.addEventListener('click', () => {
        if (state !== 'READY') return;
        runAlgorithm('/api/value_iteration', "Optimizing...", btnValIter);
    });

    // --- Logic ---
    function initGrid() {
        startCell = null;
        endCell = null;
        obstacles = [];
        
        mainGrid.innerHTML = '';
        mainGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        mainGrid.setAttribute('data-size', n);
        
        // Hide results initially
        resultsSection.style.display = 'none';
        
        let counter = 1;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell interactive';
                cell.innerText = counter++;
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                cell.addEventListener('click', () => handleCellClick(cell, r, c));
                mainGrid.appendChild(cell);
            }
        }
        
        gridTitle.innerText = `設定 ${n} x ${n} 的環境:`;
        setupSection.style.display = 'flex';
        
        disableAlgorithmButtons();
        
        state = 'SELECT_START';
        updateStatus();
    }

    function handleCellClick(cell, r, c) {
        // Ignore clicks if the cell is already assigned a role
        if (cell.classList.contains('start') || cell.classList.contains('end') || cell.classList.contains('obstacle')) {
            return;
        }

        if (state === 'SELECT_START') {
            cell.classList.add('start');
            startCell = {r, c};
            state = 'SELECT_END';
            updateStatus();
        } 
        else if (state === 'SELECT_END') {
            cell.classList.add('end');
            endCell = {r, c};
            
            // Check if we need to set obstacles (n-2)
            if (maxObstacles > 0) {
                state = 'SELECT_OBS';
            } else {
                state = 'READY';
                enableAlgorithmButtons();
            }
            updateStatus();
        } 
        else if (state === 'SELECT_OBS') {
            cell.classList.add('obstacle');
            cell.innerText = ''; // Clears text for visual purely gray cell
            obstacles.push({r, c});
            
            if (obstacles.length >= maxObstacles) {
                state = 'READY';
                enableAlgorithmButtons();
            }
            updateStatus();
        }
    }

    function enableAlgorithmButtons() {
        btnEvalRandom.classList.remove('disabled');
        btnEvalRandom.disabled = false;
        btnValIter.classList.remove('disabled');
        btnValIter.disabled = false;
    }

    function disableAlgorithmButtons() {
        btnEvalRandom.classList.add('disabled');
        btnEvalRandom.disabled = true;
        btnValIter.classList.add('disabled');
        btnValIter.disabled = true;
    }

    function updateStatus() {
        if (state === 'SELECT_START') {
            statusText.innerHTML = "Step 2: 點擊設定一個 <strong style='color:var(--success)'>起點(Start)</strong> (將顯示綠色)。";
            statusText.style.color = "var(--text-primary)";
        } else if (state === 'SELECT_END') {
            statusText.innerHTML = "Step 3: 點擊設定一個 <strong style='color:var(--danger)'>終點(End)</strong> (將顯示紅色)。";
            statusText.style.color = "var(--text-primary)";
        } else if (state === 'SELECT_OBS') {
            let left = maxObstacles - obstacles.length;
            statusText.innerHTML = `Step 4: 點擊設定剩餘 <strong>${left}</strong> 個 <strong style='color:var(--text-secondary)'>障礙物</strong>(灰色)。`;
            statusText.style.color = "var(--text-primary)";
        } else if (state === 'READY') {
            statusText.innerHTML = "設定完成！請點擊上方按鈕執行 <strong>隨機策略評估(HW1-2)</strong> 或 <strong>價值迭代算法(HW1-3)</strong>。";
            statusText.style.color = "var(--success)";
        }
    }

    async function runAlgorithm(url, loadingText, buttonEl) {
        let originalText = buttonEl.innerText;
        buttonEl.innerText = loadingText;
        disableAlgorithmButtons();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({n, start: startCell, end: endCell, obstacles})
            });
            const data = await response.json();
            
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }
            
            renderResults(data);
        } catch (e) {
            console.error(e);
            alert('後端連線失敗，請確定 Flask (app.py) 正在執行中。');
        } finally {
            buttonEl.innerText = originalText;
            enableAlgorithmButtons();
        }
    }

    function traceOptimalPath(policy) {
        let path = [];
        let curr = {r: startCell.r, c: startCell.c};
        let visited = new Set();
        
        while (true) {
            let key = `${curr.r},${curr.c}`;
            if (visited.has(key)) break; // prevent infinite loops in evaluation
            visited.add(key);
            
            path.push(curr);
            
            if (curr.r === endCell.r && curr.c === endCell.c) {
                break;
            }
            
            let action = policy[curr.r][curr.c];
            if (action === 'obstacle' || action === 'end') break;
            
            let nr = curr.r, nc = curr.c;
            if (action === 'up') nr -= 1;
            else if (action === 'down') nr += 1;
            else if (action === 'left') nc -= 1;
            else if (action === 'right') nc += 1;
            
            // bounds/obstacle check
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) break;
            if (obstacles.some(o => o.r === nr && o.c === nc)) break;
            
            curr = {r: nr, c: nc};
        }
        return path;
    }

    function renderResults(data) {
        const policy = data.policy;
        const values = data.values;
        const isOptimal = data.type === 'optimal';
        
        valueGrid.innerHTML = '';
        policyGrid.innerHTML = '';
        
        valueGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        policyGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        valueGrid.setAttribute('data-size', n);
        policyGrid.setAttribute('data-size', n);

        // Update Title dynamically
        document.getElementById('result-val-title').innerHTML = 
            `Value Matrix <span class="subtitle ${isOptimal? 'highlight-text':''}">${isOptimal ? 'Optimal V*(s)' : 'Random V(s)'}</span>`;
        document.getElementById('result-pol-title').innerHTML = 
            `Policy Matrix <span class="subtitle ${isOptimal? 'highlight-text':''}">${isOptimal ? 'Optimal Policy π*' : 'Random Policy'}</span>`;

        let optimalPath = [];
        if (isOptimal) {
            optimalPath = traceOptimalPath(policy);
        }

        const arrowMap = {
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→'
        };

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const isStart = startCell && startCell.r === r && startCell.c === c;
                const isEnd = endCell && endCell.r === r && endCell.c === c;
                const isObs = obstacles.some(o => o.r === r && o.c === c);
                const inPath = optimalPath.some(p => p.r === r && p.c === c);

                // --- Value Cell Setup ---
                const vCell = document.createElement('div');
                vCell.className = 'cell value-cell';
                if (isStart) vCell.classList.add('start');
                if (isEnd) vCell.classList.add('end');
                if (isObs) vCell.classList.add('obstacle');
                if (inPath && !isStart && !isEnd) vCell.classList.add('path-highlight');
                if (!isObs) {
                    vCell.innerText = values[r][c];
                }
                valueGrid.appendChild(vCell);

                // --- Policy Cell Setup ---
                const pCell = document.createElement('div');
                pCell.className = 'cell policy-cell';
                if (isStart) pCell.classList.add('start');
                if (isEnd) pCell.classList.add('end');
                if (isObs) pCell.classList.add('obstacle');
                if (inPath && !isStart && !isEnd) pCell.classList.add('path-highlight');
                
                let p = policy[r][c];
                if (p === 'end') {
                    pCell.innerText = '🏁';
                    pCell.style.fontSize = '1.2rem';
                } else if (p === 'obstacle') {
                    pCell.innerText = '';
                } else {
                    if (isOptimal && inPath && !isStart && !isEnd) {
                        pCell.style.color = '#fbbf24'; // pop yellow arrow for path
                    }
                    pCell.innerText = arrowMap[p] || '';
                }
                policyGrid.appendChild(pCell);
            }
        }
        
        resultsSection.style.display = 'flex';
        // Auto scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});
