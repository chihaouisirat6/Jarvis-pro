// ==================== CONFIG ====================
const CONFIG = {
    geminiKey: localStorage.getItem('jarvis_api_key') || 'AIzaSyDzYZUEB7lKF8ssXoXPRKbasruajEC8Y08',
    agent: 'voice',
    agents: {
        voice: { name: 'VOICE', color: '#00ff88', prompt: 'مساعد صوتي ذكي' },
        vision: { name: 'VISION', color: '#00ffff', prompt: 'تحليل الصور والرؤية' },
        search: { name: 'SEARCH', color: '#ffff00', prompt: 'بحث ويب متقدم' },
        code: { name: 'CODE', color: '#ff00ff', prompt: 'مبرمج محترف' },
        auto: { name: 'AUTO', color: '#ff8800', prompt: 'أتمتة ذكية' }
    }
};

let recognition = null;
let isRecording = false;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    
    // Boot animation
    setTimeout(() => {
        document.getElementById('boot').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        speak('جارفيس جاهز');
    }, 3500);
});

// ==================== PARTICLES ====================
function initParticles() {
    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2
        });
    }

    function animate() {
        ctx.fillStyle = 'rgba(0, 5, 16, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // Connect
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    ctx.strokeStyle = `rgba(0, 255, 136, ${0.2 * (1 - dist/100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// ==================== VOICE ====================
function toggleMic() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('المتصفح لا يدعم الصوت');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        document.getElementById('mic').classList.add('recording');
        document.getElementById('status').textContent = 'أستمع...';
    };

    recognition.onend = () => {
        isRecording = false;
        document.getElementById('mic').classList.remove('recording');
        document.getElementById('status').textContent = 'اضغط 🎤 للبدء';
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        addMsg('أنت', text);
        process(text);
    };

    recognition.start();
}

function stopRecording() {
    if (recognition) recognition.stop();
}

function speak(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.9;
    speechSynthesis.speak(u);
}

// ==================== AI ====================
async function process(text) {
    const lower = text.toLowerCase();

    // Commands
    if (lower.includes('انستغرام') || lower.includes('instagram')) {
        openInstagram(); return;
    }
    if (lower.includes('يوتيوب') || lower.includes('youtube')) {
        openYouTube(); return;
    }
    if (lower.includes('واتساب') || lower.includes('whatsapp')) {
        openWhatsApp(); return;
    }
    if (lower.includes('كاميرا') || lower.includes('camera')) {
        openCamera(); return;
    }
    if (lower.includes('فلاش') || lower.includes('flash')) {
        toggleFlash(); return;
    }
    if (lower.includes('مكان') || lower.includes('location')) {
        getLocation(); return;
    }
    if (lower.includes('وقت') || lower.includes('time')) {
        const now = new Date().toLocaleTimeString('ar-SA');
        speak('الساعة ' + now);
        addMsg('JARVIS', '🕐 ' + now);
        return;
    }

    // AI
    document.getElementById('status').textContent = 'أفكر...';
    const reply = await askAI(text);
    document.getElementById('status').textContent = 'اضغط 🎤 للبدء';
    
    addMsg('JARVIS', reply);
    speak(reply);
}

async function askAI(message) {
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.geminiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `أنت JARVIS. ${CONFIG.agents[CONFIG.agent].prompt}. أجب بالعربية بإيجاز.\n\nالمستخدم: ${message}`
                        }]
                    }]
                })
            }
        );
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return 'خطأ في الاتصال. تأكد من API Key.';
    }
}

function send() {
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('أنت', text);
    process(text);
}

// ==================== APPS (Capacitor Bridge) ====================
function openInstagram() {
    window.location.href = 'intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end';
    speak('أفتح انستغرام');
    addMsg('JARVIS', '📷 أفتح Instagram...');
}

function openYouTube() {
    window.location.href = 'intent://youtube.com/#Intent;package=com.google.android.youtube;scheme=https;end';
    speak('أفتح يوتيوب');
    addMsg('JARVIS', '▶️ أفتح YouTube...');
}

function openWhatsApp() {
    window.location.href = 'intent://api.whatsapp.com/#Intent;package=com.whatsapp;scheme=https;end';
    speak('أفتح واتساب');
    addMsg('JARVIS', '💬 أفتح WhatsApp...');
}

function openCamera() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.click();
    speak('أفتح الكاميرا');
}

function toggleFlash() {
    if (window.Capacitor) {
        // سنعرفه لاحقاً
    }
    speak('الفلاش يحتاج صلاحيات إضافية');
    addMsg('JARVIS', '🔦 يحتاج Capacitor Plugin');
}

function getLocation() {
    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;
            speak(`موقعك: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            addMsg('JARVIS', `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => speak('لم أستطع الحصول على الموقع')
    );
}

// ==================== AGENTS ====================
function setAgent(id) {
    CONFIG.agent = id;
    document.querySelectorAll('.agent').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.agent')[Object.keys(CONFIG.agents).indexOf(id)].classList.add('active');
    
    const agent = CONFIG.agents[id];
    document.querySelector('.core').style.background = `radial-gradient(circle, ${agent.color}99, transparent)`;
    document.querySelectorAll('.eye').forEach(eye => {
        eye.style.background = agent.color;
        eye.style.boxShadow = `0 0 10px ${agent.color}`;
    });
    
    speak(`وكيل ${agent.name} نشط`);
    addMsg('JARVIS', `✅ وكيل ${agent.name}: ${agent.prompt}`);
}

// ==================== HELPERS ====================
function addMsg(sender, text) {
    const chat = document.getElementById('chat');
    const div = document.createElement('div');
    div.className = `msg ${sender === 'أنت' ? 'user' : 'jarvis'}`;
    div.textContent = `${sender}: ${text}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}
