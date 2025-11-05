class MiaoTranslator {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isListening = false;
        this.currentEmotion = '中性';
        
        // 情绪关键词映射
        this.emotionKeywords = {
            '兴奋': ['太好了', '棒', '厉害', '哇', '惊喜', '开心', '高兴', '激动'],
            '可爱风': ['小', '萌', '可爱', '乖', '甜', '软', '温柔'],
            '不满': ['不行', '讨厌', '烦', '气', '怒', '不爽', '哼', '差'],
            '撒娇': ['嘛', '啦', '呀', '人家', '想要', '求求', '拜托'],
            '悲伤': ['难过', '伤心', '哭', '痛苦', '失望', '沮丧'],
            '惊讶': ['什么', '天哪', '不会吧', '真的吗', '怎么可能']
        };
        
        // 情绪模板
        this.emotionTemplates = {
            '兴奋': [
                "哇，{text}！太棒了喵！",
                "哎呀呀，{text}，本喵好激动！",
                "喵呜~{text}，开心死了！"
            ],
            '可爱风': [
                "喵~{text}呢~",
                "人家觉得{text}好可爱呀~",
                "软软的{text}，好想抱抱~"
            ],
            '不满': [
                "哼！{text}，本喵不开心了！",
                "讨厌啦，{text}，气死喵了！",
                "铲屎官，{text}这样不行的说！"
            ],
            '撒娇': [
                "嘛~{text}嘛~人家想要~",
                "喵呜呜，{text}，求求你啦~",
                "人家就是想{text}嘛，拜托拜托~"
            ]
        };
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
        this.bindEvents();
        this.loadVoices();
    }
    
    initElements() {
        // 语音识别相关元素
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        this.listeningIndicator = document.getElementById('listeningIndicator');
        this.transcript = document.getElementById('transcript');
        
        // 情绪分析相关元素
        this.detectedEmotion = document.getElementById('detectedEmotion');
        this.confidenceBar = document.getElementById('confidenceBar');
        this.confidenceValue = document.getElementById('confidenceValue');
        
        // 语音合成相关元素
        this.textToSpeak = document.getElementById('textToSpeak');
        this.speakBtn = document.getElementById('speakBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // 设置相关元素
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchRange = document.getElementById('pitchRange');
        this.pitchValue = document.getElementById('pitchValue');
        
        // 模板卡片
        this.templateCards = document.querySelectorAll('.template-card');
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'zh-CN';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('正在监听...', true);
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                this.transcript.innerHTML = finalTranscript + '<span class="interim">' + interimTranscript + '</span>';
                
                if (finalTranscript) {
                    this.analyzeEmotion(finalTranscript);
                    this.textToSpeak.value = finalTranscript;
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.updateStatus('识别出错: ' + event.error, false);
                this.resetRecognitionButtons();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateStatus('识别已停止', false);
                this.resetRecognitionButtons();
            };
        } else {
            this.updateStatus('您的浏览器不支持语音识别功能', false);
            this.startBtn.disabled = true;
        }
    }
    
    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        } else {
            this.speakBtn.disabled = true;
            alert('您的浏览器不支持语音合成功能');
        }
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        this.voiceSelect.innerHTML = '';
        
        // 优先显示中文语音
        const chineseVoices = this.voices.filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('CN')
        );
        
        if (chineseVoices.length > 0) {
            chineseVoices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });
        } else {
            // 如果没有中文语音，显示所有可用语音
            this.voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });
        }
    }
    
    bindEvents() {
        // 语音识别事件
        this.startBtn.addEventListener('click', () => this.startRecognition());
        this.stopBtn.addEventListener('click', () => this.stopRecognition());
        
        // 语音合成事件
        this.speakBtn.addEventListener('click', () => this.startSpeaking());
        this.pauseBtn.addEventListener('click', () => this.pauseSpeaking());
        this.resumeBtn.addEventListener('click', () => this.resumeSpeaking());
        this.cancelBtn.addEventListener('click', () => this.cancelSpeaking());
        
        // 设置变更事件
        this.speedRange.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value + 'x';
        });
        
        this.pitchRange.addEventListener('input', (e) => {
            this.pitchValue.textContent = e.target.value;
        });
        
        // 情绪模板点击事件
        this.templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const emotion = card.dataset.emotion;
                const example = card.querySelector('.template-example').textContent;
                this.textToSpeak.value = example;
                this.currentEmotion = emotion;
                this.updateEmotionDisplay(emotion, 95);
            });
        });
    }
    
    startRecognition() {
        if (this.recognition && !this.isListening) {
            this.transcript.textContent = '';
            this.recognition.start();
        }
    }
    
    stopRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    resetRecognitionButtons() {
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
    }
    
    updateStatus(message, isListening) {
        this.statusText.textContent = message;
        this.listeningIndicator.classList.toggle('active', isListening);
    }
    
    analyzeEmotion(text) {
        let maxScore = 0;
        let detectedEmotion = '中性';
        
        // 简单的关键词匹配情绪分析
        for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 1;
                }
            });
            
            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emotion;
            }
        }
        
        const confidence = Math.min(maxScore * 20 + 30, 95); // 基础置信度30%，每个关键词+20%
        this.currentEmotion = detectedEmotion;
        this.updateEmotionDisplay(detectedEmotion, confidence);
    }
    
    updateEmotionDisplay(emotion, confidence) {
        this.detectedEmotion.textContent = emotion;
        this.confidenceBar.style.width = confidence + '%';
        this.confidenceValue.textContent = confidence + '%';
        
        // 根据情绪设置不同颜色
        const emotionColors = {
            '兴奋': '#ff6b6b',
            '可爱风': '#ff9ff3',
            '不满': '#ffa726',
            '撒娇': '#66bb6a',
            '悲伤': '#42a5f5',
            '惊讶': '#ab47bc',
            '中性': '#78909c'
        };
        
        this.confidenceBar.style.backgroundColor = emotionColors[emotion] || emotionColors['中性'];
    }
    
    startSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        
        let textToSpeak = this.textToSpeak.value.trim();
        if (!textToSpeak) {
            alert('请输入要朗读的文字');
            return;
        }
        
        // 应用情绪模板
        textToSpeak = this.applyEmotionTemplate(textToSpeak, this.currentEmotion);
        
        this.currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // 设置语音参数
        const selectedVoiceIndex = this.voiceSelect.value;
        if (selectedVoiceIndex && this.voices[selectedVoiceIndex]) {
            this.currentUtterance.voice = this.voices[selectedVoiceIndex];
        }
        
        this.currentUtterance.rate = parseFloat(this.speedRange.value);
        this.currentUtterance.pitch = parseFloat(this.pitchRange.value);
        
        // 根据情绪调整语音参数
        this.applyEmotionToVoice(this.currentUtterance, this.currentEmotion);
        
        this.currentUtterance.onstart = () => {
            this.updateSynthesisButtons(true);
        };
        
        this.currentUtterance.onend = () => {
            this.updateSynthesisButtons(false);
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('语音合成错误:', event.error);
            this.updateSynthesisButtons(false);
        };
        
        this.synthesis.speak(this.currentUtterance);
    }
    
    applyEmotionTemplate(text, emotion) {
        if (this.emotionTemplates[emotion] && Math.random() > 0.3) {
            const templates = this.emotionTemplates[emotion];
            const template = templates[Math.floor(Math.random() * templates.length)];
            return template.replace('{text}', text);
        }
        return text;
    }
    
    applyEmotionToVoice(utterance, emotion) {
        // 根据情绪调整语音参数
        const emotionSettings = {
            '兴奋': { rateMultiplier: 1.2, pitchMultiplier: 1.3 },
            '可爱风': { rateMultiplier: 0.9, pitchMultiplier: 1.4 },
            '不满': { rateMultiplier: 1.1, pitchMultiplier: 0.8 },
            '撒娇': { rateMultiplier: 0.8, pitchMultiplier: 1.2 },
            '悲伤': { rateMultiplier: 0.7, pitchMultiplier: 0.9 },
            '惊讶': { rateMultiplier: 1.3, pitchMultiplier: 1.1 }
        };
        
        if (emotionSettings[emotion]) {
            const settings = emotionSettings[emotion];
            utterance.rate *= settings.rateMultiplier;
            utterance.pitch *= settings.pitchMultiplier;
            
            // 确保参数在合理范围内
            utterance.rate = Math.max(0.1, Math.min(10, utterance.rate));
            utterance.pitch = Math.max(0, Math.min(2, utterance.pitch));
        }
    }
    
    pauseSpeaking() {
        if (this.synthesis.speaking && !this.synthesis.paused) {
            this.synthesis.pause();
            this.pauseBtn.disabled = true;
            this.resumeBtn.disabled = false;
        }
    }
    
    resumeSpeaking() {
        if (this.synthesis.paused) {
            this.synthesis.resume();
            this.pauseBtn.disabled = false;
            this.resumeBtn.disabled = true;
        }
    }
    
    cancelSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            this.updateSynthesisButtons(false);
        }
    }
    
    updateSynthesisButtons(isSpeaking) {
        this.speakBtn.disabled = isSpeaking;
        this.pauseBtn.disabled = !isSpeaking;
        this.resumeBtn.disabled = true;
        this.cancelBtn.disabled = !isSpeaking;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MiaoTranslator();
});

// 添加一些实用功能
document.addEventListener('keydown', (e) => {
    // 按空格键快速开始/停止录音
    if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (!startBtn.disabled) {
            startBtn.click();
        } else if (!stopBtn.disabled) {
            stopBtn.click();
        }
    }
});

// 添加语音可视化效果
function createVoiceVisualizer() {
    const indicator = document.getElementById('listeningIndicator');
    if (!indicator) return;
    
    // 创建音频可视化波形
    for (let i = 0; i < 5; i++) {
        const bar = document.createElement('div');
        bar.className = 'voice-bar';
        bar.style.animationDelay = `${i * 0.1}s`;
        indicator.appendChild(bar);
    }
}

// 页面加载完成后创建可视化效果
document.addEventListener('DOMContentLoaded', createVoiceVisualizer);
