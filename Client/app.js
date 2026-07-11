/**
 * Distributed Rate Limiter Playground
 * Client-Side Application Logic & Visualization Engine
 */

// Detect API base URL
const API_BASE = window.location.origin.includes('3000') ? '' : 'http://localhost:3000';

// Application State
const state = {
    algorithm: 'fixedWindow',
    clientId: '',
    
    // Sliders
    limit: 5,
    window: 60,
    tbCapacity: 10,
    tbRefillRate: 1,
    lbCapacity: 10,
    lbLeakRate: 1,

    // Simulation Stats
    allowedCount: 0,
    blockedCount: 0,

    // Autopilot state
    autopilotIntervalId: null,
    autopilotIntervalMs: 500,

    // Local simulation variables for smooth visualizations
    fixed: {
        currentCount: 0,
        limit: 5,
        resetTimeRemaining: 0,
        windowSize: 60,
        timerIntervalId: null
    },
    sliding: {
        requests: [] // Array of { timestamp: number, allowed: boolean }
    },
    tokenBucket: {
        tokens: 10,
        capacity: 10,
        refillRate: 1,
        lastUpdate: Date.now()
    },
    leakyBucket: {
        queue: 0,
        capacity: 10,
        leakRate: 1,
        lastUpdate: Date.now()
    }
};

// DOM Elements
const elements = {
    tabs: document.querySelectorAll('.tab-btn'),
    clientIdInput: document.getElementById('input-clientId'),
    
    // Parameter Range inputs & value bubbles
    rangeLimit: document.getElementById('range-limit'),
    valLimit: document.getElementById('val-limit'),
    rangeWindow: document.getElementById('range-window'),
    valWindow: document.getElementById('val-window'),
    
    rangeTbCapacity: document.getElementById('range-tb-capacity'),
    valTbCapacity: document.getElementById('val-tb-capacity'),
    rangeTbRefillRate: document.getElementById('range-tb-refillRate'),
    valTbRefillRate: document.getElementById('val-tb-refillRate'),
    
    rangeLbCapacity: document.getElementById('range-lb-capacity'),
    valLbCapacity: document.getElementById('val-lb-capacity'),
    rangeLbLeakRate: document.getElementById('range-lb-leakRate'),
    valLbLeakRate: document.getElementById('val-lb-leakRate'),
    
    // Simulator Buttons
    btnRequest: document.getElementById('btn-request'),
    btnBurst: document.getElementById('btn-burst'),
    btnAutopilot: document.getElementById('btn-autopilot'),
    btnReset: document.getElementById('btn-reset'),
    rangeAutoInterval: document.getElementById('range-auto-interval'),
    valAutoInterval: document.getElementById('val-auto-interval'),
    autopilotSettings: document.getElementById('autopilot-settings'),

    // Vis containers
    visContainers: {
        fixedWindow: document.getElementById('vis-fixedWindow'),
        slidingWindow: document.getElementById('vis-slidingWindow'),
        tokenBucket: document.getElementById('vis-tokenBucket'),
        leakyBucket: document.getElementById('vis-leakyBucket')
    },

    // Fixed window visualizer elements
    fixedGaugeFill: document.getElementById('fixed-gauge-fill'),
    fixedReqCount: document.getElementById('fixed-req-count'),
    fixedReqLimit: document.getElementById('fixed-req-limit'),
    fixedTimer: document.getElementById('fixed-timer'),
    fixedTimerProgress: document.getElementById('fixed-timer-progress'),

    // Sliding window visualizer elements
    slidingTimelineTrack: document.getElementById('sliding-timeline-track'),
    slidingNoReq: document.getElementById('sliding-no-req'),
    slidingWindowDuration: document.getElementById('sliding-window-duration'),

    // Token bucket visualizer elements
    tokenBucketInner: document.getElementById('token-bucket-inner'),
    tokenCountDisplay: document.getElementById('token-count-display'),
    tokenRefillDisplay: document.getElementById('token-refill-display'),
    tokenBucketCapacityLabel: document.getElementById('token-bucket-capacity-label'),

    // Leaky bucket visualizer elements
    leakyWaterFill: document.getElementById('leaky-water-fill'),
    leakyQueueDisplay: document.getElementById('leaky-queue-display'),
    leakyRateDisplay: document.getElementById('leaky-rate-display'),
    leakyBucketCapacityLabel: document.getElementById('leaky-bucket-capacity-label'),
    leakDrip: document.getElementById('leak-drip'),

    // Stats & Headers
    statAllowed: document.getElementById('stat-allowed'),
    statBlocked: document.getElementById('stat-blocked'),
    statRate: document.getElementById('stat-rate'),
    headerLimit: document.getElementById('header-limit'),
    headerRemaining: document.getElementById('header-remaining'),
    headerRetry: document.getElementById('header-retry'),

    // Log Console
    consoleBox: document.getElementById('console-box'),
    btnClearLogs: document.getElementById('btn-clear-logs'),
    statusIndicator: document.getElementById('status-indicator')
};

/* --- Initialize Event Listeners --- */
function init() {
    // Tab switching
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.algo);
        });
    });

    // Client ID Input
    elements.clientIdInput.addEventListener('input', (e) => {
        state.clientId = e.target.value.trim();
    });

    // Slider inputs setup
    setupSlider(elements.rangeLimit, elements.valLimit, 'limit');
    setupSlider(elements.rangeWindow, elements.valWindow, 'window');
    setupSlider(elements.rangeTbCapacity, elements.valTbCapacity, 'tbCapacity', () => {
        state.tokenBucket.capacity = state.tbCapacity;
        elements.tokenBucketCapacityLabel.textContent = state.tbCapacity;
        rebuildTokenVisuals();
    });
    setupSlider(elements.rangeTbRefillRate, elements.valTbRefillRate, 'tbRefillRate', () => {
        state.tokenBucket.refillRate = state.tbRefillRate;
        elements.tokenRefillDisplay.textContent = state.tbRefillRate + '/s';
    });
    setupSlider(elements.rangeLbCapacity, elements.valLbCapacity, 'lbCapacity', () => {
        state.leakyBucket.capacity = state.lbCapacity;
        elements.leakyBucketCapacityLabel.textContent = state.lbCapacity;
    });
    setupSlider(elements.rangeLbLeakRate, elements.valLbLeakRate, 'lbLeakRate', () => {
        state.leakyBucket.leakRate = state.lbLeakRate;
        elements.leakyRateDisplay.textContent = state.lbLeakRate + '/s';
    });

    // Autopilot Interval slider
    elements.rangeAutoInterval.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        elements.valAutoInterval.textContent = val;
        state.autopilotIntervalMs = val;
        
        // If autopilot is currently running, restart it with the new interval
        if (state.autopilotIntervalId) {
            stopAutopilot();
            startAutopilot();
        }
    });

    // Simulator Buttons
    elements.btnRequest.addEventListener('click', () => sendSimulateRequest());
    elements.btnBurst.addEventListener('click', () => sendBurstRequests(5));
    elements.btnAutopilot.addEventListener('click', toggleAutopilot);
    elements.btnReset.addEventListener('click', resetRateLimiter);
    elements.btnClearLogs.addEventListener('click', clearLogs);

    // Initial setups
    rebuildTokenVisuals();
    startAnimationLoops();
    logConsole('SYSTEM', 'Ready for action. Click "Send Request" to trigger requests.');
}

// Helpers for syncing Sliders
function setupSlider(sliderEl, bubbleEl, stateField, callback) {
    sliderEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        bubbleEl.textContent = val;
        state[stateField] = val;
        if (callback) callback();
    });
}

// Switch between algorithms
function switchTab(algoName) {
    state.algorithm = algoName;
    
    // Stop Autopilot on tab change to prevent confusing visualizations
    if (state.autopilotIntervalId) {
        stopAutopilot();
    }

    // Update active tab class
    elements.tabs.forEach(tab => {
        if (tab.dataset.algo === algoName) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        }
    });

    // Hide all parameters except current algorithm parameters
    document.querySelectorAll('.algo-param').forEach(paramGroup => {
        paramGroup.style.display = 'none';
    });
    
    // Show selected parameters
    if (algoName === 'fixedWindow' || algoName === 'slidingWindow') {
        document.querySelectorAll('.fixedWindow, .slidingWindow').forEach(el => el.style.display = 'block');
    } else {
        document.querySelector('.' + algoName).style.display = 'block';
    }

    // Toggle active visualizer panel
    Object.keys(elements.visContainers).forEach(key => {
        if (key === algoName) {
            elements.visContainers[key].classList.add('active');
        } else {
            elements.visContainers[key].classList.remove('active');
        }
    });

    // Reset some visuals immediately
    if (algoName === 'slidingWindow') {
        elements.slidingWindowDuration.textContent = state.window;
    } else if (algoName === 'tokenBucket') {
        elements.tokenBucketCapacityLabel.textContent = state.tbCapacity;
        rebuildTokenVisuals();
    } else if (algoName === 'leakyBucket') {
        elements.leakyBucketCapacityLabel.textContent = state.lbCapacity;
    }

    logConsole('SYSTEM', `Switched algorithm to ${algoName}.`);
}

/* --- API Requests & Actions --- */

// Send simulated request to server
async function sendSimulateRequest(silent = false) {
    try {
        const payload = {
            algorithm: state.algorithm,
            clientId: state.clientId,
            limit: state.limit,
            window: state.window,
            capacity: state.algorithm === 'tokenBucket' ? state.tbCapacity : state.lbCapacity,
            refillRate: state.tbRefillRate,
            leakRate: state.lbLeakRate
        };

        const res = await fetch(`${API_BASE}/api/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        // Update stats
        if (data.allowed) {
            state.allowedCount++;
            flashStatus('green', 'Allowed');
        } else {
            state.blockedCount++;
            flashStatus('red', 'Blocked');
        }
        updateStatsUI();

        // Update headers in UI
        elements.headerLimit.textContent = res.headers.get('X-RateLimit-Limit') || '-';
        elements.headerRemaining.textContent = res.headers.get('X-RateLimit-Remaining') || '-';
        elements.headerRetry.textContent = res.headers.get('Retry-After') || '0';

        // Process response for algorithm specific visualizers
        processResponseVisuals(data);

        // Print Transaction Console line
        const timestamp = new Date().toLocaleTimeString();
        const clientTag = state.clientId ? `[Client: ${state.clientId}]` : '[Client: IP]';
        const msg = `${clientTag} ${state.algorithm} request -> ${data.allowed ? 'ALLOWED (200 OK)' : 'BLOCKED (429 Too Many Requests)'} | count: ${data.count} | remaining: ${data.remaining} | retry-after: ${data.retryAfter}s`;
        
        logConsole(data.allowed ? 'SUCCESS' : 'ERROR', msg);
        
        return data.allowed;
    } catch (err) {
        console.error("Fetch error:", err);
        logConsole('INFO', `[ERROR] Connection failed: Is the server running?`);
        flashStatus('red', 'Offline');
        return false;
    }
}

// Send burst requests
async function sendBurstRequests(count = 5) {
    logConsole('SYSTEM', `Triggering a burst of ${count} requests...`);
    const requests = [];
    for (let i = 0; i < count; i++) {
        // Send requests with small offset (e.g. 20ms) so they hit the server concurrently but sequentially
        requests.push(new Promise(resolve => {
            setTimeout(async () => {
                const res = await sendSimulateRequest();
                resolve(res);
            }, i * 20);
        }));
    }
    await Promise.all(requests);
}

// Autopilot toggler
function toggleAutopilot() {
    if (state.autopilotIntervalId) {
        stopAutopilot();
    } else {
        startAutopilot();
    }
}

function startAutopilot() {
    elements.autopilotSettings.style.display = 'block';
    elements.btnAutopilot.innerHTML = '<span class="btn-icon">⏹</span> Stop Auto-Pilot';
    elements.btnAutopilot.classList.add('active');
    
    state.autopilotIntervalId = setInterval(() => {
        sendSimulateRequest();
    }, state.autopilotIntervalMs);
    
    logConsole('SYSTEM', `Auto-Pilot started. Sending request every ${state.autopilotIntervalMs}ms.`);
}

function stopAutopilot() {
    clearInterval(state.autopilotIntervalId);
    state.autopilotIntervalId = null;
    elements.autopilotSettings.style.display = 'none';
    elements.btnAutopilot.innerHTML = '<span class="btn-icon">🤖</span> Start Auto-Pilot';
    elements.btnAutopilot.classList.remove('active');
    logConsole('SYSTEM', 'Auto-Pilot stopped.');
}

// Reset rate limiter Redis database
async function resetRateLimiter() {
    try {
        logConsole('SYSTEM', 'Resetting rate limiter state in Redis...');
        const res = await fetch(`${API_BASE}/api/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        
        if (data.success) {
            // Reset local states
            state.allowedCount = 0;
            state.blockedCount = 0;
            updateStatsUI();

            // Reset visual states
            // Fixed
            state.fixed.currentCount = 0;
            state.fixed.resetTimeRemaining = 0;
            updateFixedWindowUI();

            // Sliding
            state.sliding.requests = [];
            elements.slidingNoReq.style.display = 'block';
            elements.slidingTimelineTrack.querySelectorAll('.timeline-dot').forEach(el => el.remove());

            // Token Bucket
            state.tokenBucket.tokens = state.tbCapacity;
            rebuildTokenVisuals();

            // Leaky Bucket
            state.leakyBucket.queue = 0;
            updateLeakyWaterUI();

            logConsole('SYSTEM', 'Success: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        logConsole('INFO', 'Failed to reset rate limiter server state.');
    }
}

/* --- Logging & UI Utilities --- */

function logConsole(type, message) {
    const time = new Date().toISOString().substring(11, 19);
    const line = document.createElement('div');
    line.className = 'log-line';
    
    if (type === 'SYSTEM') {
        line.classList.add('system-line');
        line.textContent = `[${time}] 🛠 [SYS] ${message}`;
    } else if (type === 'SUCCESS') {
        line.classList.add('success-line');
        line.textContent = `[${time}] 🟢 [OK ] ${message}`;
    } else if (type === 'ERROR') {
        line.classList.add('error-line');
        line.textContent = `[${time}] 🔴 [429] ${message}`;
    } else if (type === 'INFO') {
        line.classList.add('info-line');
        line.textContent = `[${time}] ⚠️ [WRN] ${message}`;
    }

    elements.consoleBox.appendChild(line);
    elements.consoleBox.scrollTop = elements.consoleBox.scrollHeight;
}

function clearLogs() {
    elements.consoleBox.innerHTML = '';
    logConsole('SYSTEM', 'Console cleared.');
}

function flashStatus(color, text) {
    const dot = elements.statusIndicator.querySelector('.status-dot');
    dot.className = `status-dot ${color}`;
    elements.statusIndicator.childNodes[2].nodeValue = ` ${text}`;
    
    // Reset status color to green "Ready" after a delay if not offline
    if (text !== 'Offline' && text !== 'Ready') {
        setTimeout(() => {
            if (elements.statusIndicator.childNodes[2].nodeValue.trim() !== 'Offline') {
                dot.className = 'status-dot green';
                elements.statusIndicator.childNodes[2].nodeValue = ' Ready';
            }
        }, 1200);
    }
}

function updateStatsUI() {
    elements.statAllowed.textContent = state.allowedCount;
    elements.statBlocked.textContent = state.blockedCount;
    
    const total = state.allowedCount + state.blockedCount;
    if (total === 0) {
        elements.statRate.textContent = '0%';
    } else {
        const rate = Math.round((state.allowedCount / total) * 100);
        elements.statRate.textContent = `${rate}%`;
    }
}

/* --- Visualizers Updates (Real-time integration) --- */

function processResponseVisuals(data) {
    const now = Date.now();

    if (state.algorithm === 'fixedWindow') {
        // Sync fixed window counts
        state.fixed.currentCount = data.count;
        state.fixed.limit = state.limit;
        state.fixed.windowSize = state.window;
        state.fixed.resetTimeRemaining = data.retryAfter;

        // Set up countdown
        if (state.fixed.timerIntervalId) clearInterval(state.fixed.timerIntervalId);
        state.fixed.timerIntervalId = setInterval(() => {
            state.fixed.resetTimeRemaining = Math.max(0, state.fixed.resetTimeRemaining - 1);
            updateFixedWindowUI();
            
            if (state.fixed.resetTimeRemaining <= 0) {
                clearInterval(state.fixed.timerIntervalId);
                // When timer reaches zero, the server's window resets, so we set count to zero
                state.fixed.currentCount = 0;
                updateFixedWindowUI();
            }
        }, 1000);

        updateFixedWindowUI();
    }
    
    else if (state.algorithm === 'slidingWindow') {
        // Log this request timestamp
        state.sliding.requests.push({
            timestamp: now,
            allowed: data.allowed
        });
        elements.slidingNoReq.style.display = 'none';

        // Add visual bubble to timeline track
        createSlidingDot(data.allowed);
    }
    
    else if (state.algorithm === 'tokenBucket') {
        // Sync remaining tokens from server response
        state.tokenBucket.tokens = data.remaining;
        state.tokenBucket.capacity = state.tbCapacity;
        state.tokenBucket.refillRate = state.tbRefillRate;
        state.tokenBucket.lastUpdate = now;
        
        // Show particles flash if consumed
        if (data.allowed) {
            triggerTokenConsumptionAnimation();
        }
        updateTokenBucketUI();
    }
    
    else if (state.algorithm === 'leakyBucket') {
        // Sync queue size (requests inside the bucket)
        // If allowed, queue is updated. If blocked, queue is capacity.
        state.leakyBucket.queue = data.allowed ? (state.lbCapacity - data.remaining) : state.lbCapacity;
        state.leakyBucket.capacity = state.lbCapacity;
        state.leakyBucket.leakRate = state.lbLeakRate;
        state.leakyBucket.lastUpdate = now;

        updateLeakyWaterUI();
    }
}

// 1. Fixed Window UI update
function updateFixedWindowUI() {
    const percentage = Math.min(100, (state.fixed.currentCount / state.fixed.limit) * 100);
    const strokeDashoffset = 251.2 - (251.2 * percentage) / 100;
    
    // Update gauge text
    elements.fixedReqCount.textContent = state.fixed.currentCount;
    elements.fixedReqLimit.textContent = `/ ${state.fixed.limit}`;
    
    // Update gauge stroke
    elements.fixedGaugeFill.style.strokeDashoffset = strokeDashoffset;
    
    // Toggle warning colors
    elements.fixedGaugeFill.className.baseVal = "gauge-fill";
    if (state.fixed.currentCount >= state.fixed.limit) {
        elements.fixedGaugeFill.classList.add('error');
    } else if (state.fixed.currentCount >= state.fixed.limit * 0.7) {
        elements.fixedGaugeFill.classList.add('warning');
    }

    // Update countdown timer text and line
    elements.fixedTimer.textContent = `${state.fixed.resetTimeRemaining}s`;
    
    const progressWidth = (state.fixed.resetTimeRemaining / state.fixed.windowSize) * 100;
    elements.fixedTimerProgress.style.width = `${progressWidth}%`;
}

// 2. Sliding Window timeline bubble generator
function createSlidingDot(allowed) {
    const dot = document.createElement('span');
    dot.className = `timeline-dot ${allowed ? 'green' : 'red'}`;
    dot.style.right = '0px'; // starts at right
    
    // Save reference to track position
    const birthTime = Date.now();
    
    // Set vertical position randomly slightly offset to avoid complete overlaps
    const randomOffset = 30 + Math.random() * 50; 
    dot.style.top = `${randomOffset}px`;

    elements.slidingTimelineTrack.appendChild(dot);

    // Track lifetime and move dot left
    const animateInterval = setInterval(() => {
        const elapsed = (Date.now() - birthTime) / 1000; // in seconds
        const windowSize = state.window;
        
        if (elapsed >= windowSize) {
            // Delete dot from track and array
            dot.remove();
            clearInterval(animateInterval);
        } else {
            // Calculate percentage from right to left
            const percent = (elapsed / windowSize) * 100;
            dot.style.left = `calc(${100 - percent}% - 8px)`;
        }
    }, 50);
}

// 3. Token Bucket particle rebuild
function rebuildTokenVisuals() {
    elements.tokenBucketInner.innerHTML = '';
    const currentTokens = Math.floor(state.tokenBucket.tokens);
    for (let i = 0; i < currentTokens; i++) {
        const particle = document.createElement('div');
        particle.className = 'token-particle';
        // Give random animation delays to make wiggles look organic
        particle.style.animationDelay = `${Math.random() * 2}s`;
        elements.tokenBucketInner.appendChild(particle);
    }
}

function triggerTokenConsumptionAnimation() {
    const particles = elements.tokenBucketInner.querySelectorAll('.token-particle:not(.consume-animate)');
    if (particles.length > 0) {
        // Take the last particle (representing consuming a token) and apply exit animation
        const particle = particles[particles.length - 1];
        particle.classList.add('consume-animate');
        setTimeout(() => {
            particle.remove();
        }, 300);
    }
}

function updateTokenBucketUI() {
    elements.tokenCountDisplay.textContent = state.tokenBucket.tokens.toFixed(1);
    elements.tokenRefillDisplay.textContent = `${state.tokenBucket.refillRate}/s`;
    
    // Check if particles length matches Math.floor(tokens)
    const targetParticleCount = Math.floor(state.tokenBucket.tokens);
    const currentParticleCount = elements.tokenBucketInner.querySelectorAll('.token-particle:not(.consume-animate)').length;
    
    if (targetParticleCount > currentParticleCount) {
        // Add refilled particles
        for (let i = 0; i < (targetParticleCount - currentParticleCount); i++) {
            const particle = document.createElement('div');
            particle.className = 'token-particle';
            particle.style.animationDelay = `${Math.random() * 2}s`;
            elements.tokenBucketInner.appendChild(particle);
        }
    } else if (targetParticleCount < currentParticleCount) {
        // Remove particles
        const particles = elements.tokenBucketInner.querySelectorAll('.token-particle:not(.consume-animate)');
        for (let i = 0; i < (currentParticleCount - targetParticleCount); i++) {
            if (particles[i]) particles[i].remove();
        }
    }
}

// 4. Leaky Bucket water updates
function updateLeakyWaterUI() {
    elements.leakyQueueDisplay.textContent = Math.ceil(state.leakyBucket.queue);
    elements.leakyRateDisplay.textContent = `${state.leakyBucket.leakRate}/s`;
    
    const percentage = (state.leakyBucket.queue / state.leakyBucket.capacity) * 100;
    elements.leakyWaterFill.style.height = `${Math.min(100, percentage)}%`;

    // Trigger drip animation if queue is greater than zero
    if (state.leakyBucket.queue > 0) {
        elements.leakDrip.classList.add('dripping');
        // adjust drop speed based on leak rate
        const speed = 1 / state.leakyBucket.leakRate;
        elements.leakDrip.style.animationDuration = `${speed}s`;
    } else {
        elements.leakDrip.classList.remove('dripping');
    }

    // Flash water color red if overflowing
    if (state.leakyBucket.queue >= state.leakyBucket.capacity) {
        elements.leakyWaterFill.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.7) 0%, rgba(239, 68, 68, 0.4) 100%)';
    } else {
        elements.leakyWaterFill.style.background = 'linear-gradient(180deg, rgba(129, 140, 248, 0.6) 0%, rgba(56, 189, 248, 0.4) 100%)';
    }
}

/* --- Real-Time Background Refilling / Leaking Loop --- */

function startAnimationLoops() {
    let lastTick = Date.now();

    function tick() {
        const now = Date.now();
        const delta = (now - lastTick) / 1000; // time elapsed in seconds
        lastTick = now;

        // 1. Refill Token Bucket locally
        if (state.algorithm === 'tokenBucket') {
            state.tokenBucket.tokens = Math.min(
                state.tokenBucket.capacity,
                state.tokenBucket.tokens + state.tokenBucket.refillRate * delta
            );
            updateTokenBucketUI();
        }

        // 2. Leak Leaky Bucket queue locally
        if (state.algorithm === 'leakyBucket') {
            state.leakyBucket.queue = Math.max(
                0,
                state.leakyBucket.queue - state.leakyBucket.leakRate * delta
            );
            updateLeakyWaterUI();
        }

        // 3. Keep sliding window dots moving accurately
        // We filter out sliding window requests that fell out of window
        const windowSize = state.window;
        state.sliding.requests = state.sliding.requests.filter(req => {
            return (now - req.timestamp) / 1000 < windowSize;
        });
        
        if (state.sliding.requests.length === 0 && state.algorithm === 'slidingWindow') {
            elements.slidingNoReq.style.display = 'block';
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// Run setup when DOM is ready
document.addEventListener('DOMContentLoaded', init);
