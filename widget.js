(function() {
    // Prevent double initialization
    if (window.RemoteAssistWidgetLoaded) return;
    window.RemoteAssistWidgetLoaded = true;

    // --- 1. CSS Injection ---
    const styles = `
        /* Widget Container */
        #ra-widget-root {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647; /* Max z-index to stay on top */
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }

        /* Floating Button */
        #ra-floating-btn {
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: #6366f1;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        #ra-floating-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
        }

        /* Panel UI */
        #ra-panel {
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.2);
            overflow: hidden;
            display: none;
            flex-direction: column;
            transform-origin: bottom right;
            animation: ra-pop-in 0.2s ease-out;
        }
        @keyframes ra-pop-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .ra-header {
            background: #f8fafc;
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ra-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
        }
        .ra-close-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #64748b;
        }

        .ra-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .ra-btn {
            width: 100%;
            padding: 10px 14px;
            border-radius: 6px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        .ra-btn-primary { background: #6366f1; color: white; }
        .ra-btn-primary:hover { background: #4f46e5; }
        .ra-btn-accent { background: #10b981; color: white; }
        .ra-btn-accent:hover { background: #059669; }
        .ra-btn-danger { background: #ef4444; color: white; }
        .ra-btn-danger:hover { background: #dc2626; }
        .ra-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

        .ra-id-display {
            background: #f1f5f9;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            display: none;
            border: 1px dashed #cbd5e1;
        }
        .ra-id-display.active { display: block; }
        .ra-id-code {
            font-size: 28px;
            font-family: monospace;
            font-weight: bold;
            color: #6366f1;
            letter-spacing: 2px;
        }
        .ra-status {
            font-size: 13px;
            color: #64748b;
            text-align: center;
            margin-top: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .ra-status-dot {
            width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1;
        }
        .ra-status-dot.online { background: #f59e0b; }
        .ra-status-dot.connected { background: #10b981; }

        /* Overlays (Co-browsing) */
        #ra-customer-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 2147483645;
        }
        #ra-agent-cursor {
            position: fixed; width: 20px; height: 20px;
            border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.4);
            border-radius: 50%; pointer-events: none; z-index: 2147483646;
            display: none; transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            transition: left 0.1s ease-out, top 0.1s ease-out;
        }
        #ra-agent-cursor::after {
            content: "Agent"; position: absolute; top: 25px; left: 50%;
            transform: translateX(-50%); background: #ef4444; color: white;
            padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;
        }

        #ra-control-banner {
            position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.95); color: white;
            padding: 8px 24px; border-radius: 24px; font-size: 14px; font-weight: 600;
            z-index: 2147483646; display: none; backdrop-filter: blur(4px);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            pointer-events: none;
        }

        .ra-click-ripple {
            position: fixed; width: 40px; height: 40px;
            background: rgba(239, 68, 68, 0.4); border-radius: 50%;
            pointer-events: none; z-index: 2147483646;
            transform: translate(-50%, -50%) scale(0);
            animation: ra-ripple-out 0.6s ease-out forwards;
        }
        @keyframes ra-ripple-out {
            from { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            to   { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
    `;

    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);

    // --- 2. HTML Injection ---
    const widgetHtml = `
        <div id="ra-panel">
            <div class="ra-header">
                <h3>Customer Support</h3>
                <button class="ra-close-btn" id="ra-close-btn">&times;</button>
            </div>
            <div class="ra-body">
                <div class="ra-id-display" id="ra-id-container">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Your Support ID</div>
                    <div class="ra-id-code" id="ra-id-code">...</div>
                </div>
                
                <div class="ra-status">
                    <span class="ra-status-dot" id="ra-status-dot"></span>
                    <span id="ra-status-text">Disconnected</span>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; margin-top: 8px;">
                    <button class="ra-btn ra-btn-primary" id="ra-start-btn">Request Assistance</button>
                    <button class="ra-btn ra-btn-accent" id="ra-share-btn" style="display:none;">Share Screen</button>
                    <button class="ra-btn ra-btn-danger" id="ra-stop-btn" style="display:none;">End Session</button>
                </div>
            </div>
        </div>
        <button id="ra-floating-btn" title="Get Support">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>
        </button>
    `;

    const root = document.createElement('div');
    root.id = 'ra-widget-root';
    root.innerHTML = widgetHtml;
    document.body.appendChild(root);

    // Dynamic co-browsing overlays appended to body directly
    const overlays = `
        <canvas id="ra-customer-canvas" width="${window.innerWidth}" height="${window.innerHeight}"></canvas>
        <div id="ra-agent-cursor"></div>
        <div id="ra-control-banner">🚨 REMOTE CONTROL ACTIVE — Agent is assisting you</div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlays);

    // --- 3. UI Interactions & State ---
    const panel = document.getElementById('ra-panel');
    const floatBtn = document.getElementById('ra-floating-btn');
    const closeBtn = document.getElementById('ra-close-btn');
    const startBtn = document.getElementById('ra-start-btn');
    const shareBtn = document.getElementById('ra-share-btn');
    const stopBtn = document.getElementById('ra-stop-btn');
    const idContainer = document.getElementById('ra-id-container');
    const idCode = document.getElementById('ra-id-code');
    const statusText = document.getElementById('ra-status-text');
    const statusDot = document.getElementById('ra-status-dot');
    
    floatBtn.onclick = () => {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        floatBtn.style.display = 'none';
    };
    closeBtn.onclick = () => {
        panel.style.display = 'none';
        floatBtn.style.display = 'flex';
    };

    // --- 4. WebRTC Application Logic ---
    let peer = null;
    let conn = null;
    let screenStream = null;
    let currentSessionId = null;
    let agentPeerId = null;

    // Check capabilities
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    const canShare = !isMobile && !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);

    function setStatus(text, stClass) {
        statusText.textContent = text;
        statusDot.className = 'ra-status-dot ' + (stClass || '');
    }

    function initPeerLogic() {
        if (!canShare) {
            alert('Screen sharing is not supported on this device/browser.');
            return;
        }

        startBtn.disabled = true;
        startBtn.textContent = 'Connecting...';

        try {
            // Generate 6 digit numeric ID
            const numericId = Math.floor(100000 + Math.random() * 900000).toString();
            currentSessionId = numericId;

            peer = new Peer(numericId, { debug: 2 });

            peer.on('open', (id) => {
                idCode.textContent = id;
                idContainer.classList.add('active');
                setStatus('Waiting for Agent', 'online');
                startBtn.style.display = 'none';
                shareBtn.style.display = 'block';
                stopBtn.style.display = 'block';
            });

            peer.on('connection', (connection) => {
                conn = connection;
                setupDataChannel();
            });

            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                alert('Connection error: ' + err.type);
                startBtn.disabled = false;
                startBtn.textContent = 'Request Assistance';
            });
        } catch (err) {
            console.error('Peer init failed', err);
            startBtn.disabled = false;
            startBtn.textContent = 'Request Assistance';
        }
    }

    function getMachineInfo() {
        return {
            os: navigator.platform,
            browser: navigator.userAgent.includes('Edg') ? 'Edge' : navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
            platform: navigator.platform,
            screen_res: window.screen.width + 'x' + window.screen.height,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    function setupDataChannel() {
        conn.on('open', () => {
            setStatus('Connected to Agent', 'connected');
            
            // Send footprint
            conn.send({
                type: 'device-info',
                machine: getMachineInfo(),
                deviceLabel: navigator.platform + ' Device',
                sessionId: currentSessionId,
                connectedAt: new Date().toISOString()
            });
        });

        conn.on('data', (data) => {
            if (data.type === 'agent-peer-id') {
                agentPeerId = data.peerId;
            } else if (data.type === 'control-mode') {
                document.getElementById('ra-control-banner').style.display = data.active ? 'block' : 'none';
                document.getElementById('ra-agent-cursor').style.display = data.active ? 'block' : 'none';
            } else if (data.type === 'pointer') {
                simulatePointer(data.x, data.y);
            } else if (data.type === 'pointer-leave') {
                document.getElementById('ra-agent-cursor').style.display = 'none';
            } else if (data.type === 'mousedown') {
                simulateMouseEvent(data, 'mousedown');
            } else if (data.type === 'mouseup') {
                simulateMouseEvent(data, 'mouseup');
            } else if (data.type === 'scroll') {
                window.scrollBy({ left: data.deltaX, top: data.deltaY, behavior: 'auto' });
            } else if (data.type === 'keydown') {
                simulateKeyboard(data);
            } else if (data.type === 'remote-click') {
                // Legacy
                simulateMouseEvent({x: data.x, y: data.y, button: 0}, 'mousedown');
                simulateMouseEvent({x: data.x, y: data.y, button: 0}, 'mouseup');
            } else if (data.type === 'ink') {
                renderRemoteInk(data.x, data.y);
            } else if (data.type === 'end-path') {
                currentPathStarted = false;
            } else if (data.type === 'clear-annotations') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        conn.on('close', () => {
            setStatus('Agent disconnected');
        });
    }

    async function handleShareScreen() {
        if (!agentPeerId) {
            alert('Please wait for an agent to connect using your Support ID first.');
            return;
        }

        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' }, audio: false
            });

            // Call the agent
            const call = peer.call(agentPeerId, screenStream);
            
            // Notify agent
            if (conn && conn.open) conn.send({ type: 'screen-ready' });

            shareBtn.disabled = true;
            shareBtn.textContent = 'Sharing...';

            screenStream.getVideoTracks()[0].onended = () => {
                shareBtn.disabled = false;
                shareBtn.textContent = 'Share Screen';
            };
        } catch (err) {
            console.error('Share failed', err);
        }
    }

    function endSession() {
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        if (conn) conn.close();
        if (peer) peer.destroy();
        idContainer.classList.remove('active');
        shareBtn.style.display = 'none';
        stopBtn.style.display = 'none';
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        startBtn.textContent = 'Request Assistance';
        setStatus('Disconnected', '');
    }

    // --- 5. Co-Browsing Simulation logic ---
    const cursorEl = document.getElementById('ra-agent-cursor');
    const canvas = document.getElementById('ra-customer-canvas');
    const ctx = canvas.getContext('2d');
    let currentPathStarted = false;
    let clearTimer = null;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    function renderRemoteInk(xPct, yPct) {
        const x = (xPct / 100) * canvas.width;
        const y = (yPct / 100) * canvas.height;
        if (!currentPathStarted) {
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444'; // Red for visibility
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.moveTo(x, y);
            currentPathStarted = true;
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        clearTimeout(clearTimer);
        clearTimer = setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 3500);
    }

    function simulatePointer(xPct, yPct) {
        const doc = document.documentElement;
        const x = (xPct / 100) * doc.clientWidth;
        const y = (yPct / 100) * doc.clientHeight;
        if (cursorEl) {
            cursorEl.style.left = x + 'px';
            cursorEl.style.top = y + 'px';
            cursorEl.style.display = 'block';
        }
        const elements = document.elementsFromPoint(x, y);
        const target = elements.find(el => !el.closest('#ra-widget-root') && el.id !== 'ra-agent-cursor');
        if (target) target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
    }

    function simulateMouseEvent(data, type) {
        const doc = document.documentElement;
        const x = (data.x / 100) * doc.clientWidth;
        const y = (data.y / 100) * doc.clientHeight;
        
        const elements = document.elementsFromPoint(x, y);
        const element = elements.find(el => !el.closest('#ra-widget-root') && el.id !== 'ra-agent-cursor' && el.id !== 'ra-customer-canvas');
        if (!element) return;

        if (type === 'mousedown') {
            // Show ripple
            const ripple = document.createElement('div');
            ripple.className = 'ra-click-ripple';
            ripple.style.left = x + 'px'; ripple.style.top = y + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);

            if (element.focus) element.focus();
        }

        element.dispatchEvent(new MouseEvent(type, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, button: data.button || 0,
            buttons: type === 'mousedown' ? 1 : 0
        }));

        if (type === 'mouseup') {
            element.dispatchEvent(new MouseEvent('click', {
                bubbles: true, cancelable: true, view: window,
                clientX: x, clientY: y, button: data.button || 0
            }));
            if (typeof element.click === 'function') element.click();
        }
    }

    function simulateKeyboard(data) {
        const element = document.activeElement || document.body;
        if (element && element.focus) element.focus();

        const params = { key: data.key, code: data.code, ctrlKey: data.ctrlKey, shiftKey: data.shiftKey, altKey: data.altKey, metaKey: data.metaKey, bubbles: true, cancelable: true };
        element.dispatchEvent(new KeyboardEvent('keydown', params));

        const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
        
        if (isInput) {
            if (data.key.length === 1 && !data.ctrlKey && !data.metaKey) {
                if (!document.execCommand('insertText', false, data.key)) {
                    try {
                        const start = element.selectionStart; const end = element.selectionEnd; const val = element.value;
                        element.value = val.slice(0, start) + data.key + val.slice(end);
                        element.selectionStart = element.selectionEnd = start + 1;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    } catch(e) { element.value += data.key; element.dispatchEvent(new Event('input', { bubbles: true })); }
                }
            } else if (data.key === 'Backspace') {
                if (!document.execCommand('delete', false)) {
                    try {
                        const start = element.selectionStart; const end = element.selectionEnd; const val = element.value;
                        if (start === end) {
                            element.value = val.slice(0, start - 1) + val.slice(end);
                            element.selectionStart = element.selectionEnd = Math.max(0, start - 1);
                        } else {
                            element.value = val.slice(0, start) + val.slice(end);
                            element.selectionStart = element.selectionEnd = start;
                        }
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    } catch(e) { element.value = element.value.slice(0, -1); element.dispatchEvent(new Event('input', { bubbles: true })); }
                }
            } else if (data.key === 'Enter') {
                element.dispatchEvent(new Event('change', { bubbles: true }));
                if (element.form) { try { element.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } catch(e){} }
            }
        }
        element.dispatchEvent(new KeyboardEvent('keyup', params));
    }

    // Load dependencies and wire buttons
    function loadPeerJS(callback) {
        if (typeof Peer !== 'undefined') { callback(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    loadPeerJS(() => {
        startBtn.onclick = initPeerLogic;
        shareBtn.onclick = handleShareScreen;
        stopBtn.onclick = endSession;
    });
})();
