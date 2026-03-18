document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const sizeInput = document.getElementById('grid-size');
    const btnGenerate = document.getElementById('btn-generate');
    const btnEvaluate = document.getElementById('btn-evaluate');
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

    btnEvaluate.addEventListener('click', () => {
        if (state !== 'READY') return;
        evaluatePolicy();
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
        
        btnEvaluate.classList.add('disabled');
        btnEvaluate.disabled = true;
        
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
                enableEvaluate();
            }
            updateStatus();
        } 
        else if (state === 'SELECT_OBS') {
            cell.classList.add('obstacle');
            cell.innerText = ''; // Clears text for visual purely gray cell
            obstacles.push({r, c});
            
            if (obstacles.length >= maxObstacles) {
                state = 'READY';
                enableEvaluate();
            }
            updateStatus();
        }
    }

    function enableEvaluate() {
        btnEvaluate.classList.remove('disabled');
        btnEvaluate.disabled = false;
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
            statusText.innerText = "設定完成！請點選右側的「Evaluate Policy」進行策略與價值推導。";
            statusText.style.color = "var(--success)";
        }
    }

    async function evaluatePolicy() {
        btnEvaluate.innerText = "Evaluating...";
        btnEvaluate.classList.add('disabled');
        btnEvaluate.disabled = true;

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({n, start: startCell, end: endCell, obstacles})
            });
            const data = await response.json();
            
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }
            
            renderResults(data.policy, data.values);
        } catch (e) {
            console.error(e);
            alert('目前無法連線到後端評估伺服器，請確認 app.py 正在運行中。');
        } finally {
            btnEvaluate.innerText = "Evaluate Policy";
            enableEvaluate();
        }
    }

    function renderResults(policy, values) {
        valueGrid.innerHTML = '';
        policyGrid.innerHTML = '';
        
        valueGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        policyGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        valueGrid.setAttribute('data-size', n);
        policyGrid.setAttribute('data-size', n);

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

                // --- Value Cell Setup ---
                const vCell = document.createElement('div');
                vCell.className = 'cell value-cell';
                if (isStart) vCell.classList.add('start');
                if (isEnd) vCell.classList.add('end');
                if (isObs) vCell.classList.add('obstacle');
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
                
                let p = policy[r][c];
                if (p === 'end') {
                    pCell.innerText = '🏁';
                    pCell.style.fontSize = '1.2rem';
                } else if (p === 'obstacle') {
                    pCell.innerText = '';
                } else {
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
