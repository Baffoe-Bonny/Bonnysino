// Game configuration
const multipliers = {
    1: 5,    2: 5.5,    3: 6,    4: 7,    5: 8,
    6: 10,   7: 12,   8: 15,   9: 20,   10: 25
};

// API base URL for local development
const API_BASE_URL = 'http://localhost:3000';

// API base URL - configure for Netlify deployment
const payouts = {
    1: 25,    2: 27.50,    3: 30,    4: 35,    5: 40,
    6: 50,    7: 60,     8: 75,    9: 100,   10: 125
};

let selectedNumbers = [];
let isSpinning = false;
const MAX_SELECTIONS = 2;

// Professional Beat Audio System
let audioContext;
let audioInitialized = false;
let beatInterval;
let isPlaying = false;

// Initialize audio after user interaction
function initializeAudio() {
    if (audioInitialized) return;
    
    // Initialize API URL when DOM is ready
    initializeApiUrl();
}

try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioInitialized = true;
    console.log('Audio initialized successfully');
} catch (error) {
    console.log('Audio initialization failed:', error);
}

// Play professional background beat
function startBackgroundMusic() {
    if (!audioInitialized || isPlaying) return;
    
    try {
        isPlaying = true;
        const tempo = 128; // Professional beat tempo
        const beatTime = 60000 / tempo; // Convert BPM to milliseconds
        
        // Create a simple, stable beat pattern
        beatInterval = setInterval(() => {
            if (!isPlaying) {
                clearInterval(beatInterval);
                return;
            }
            
            // Kick drum (every beat)
            playKick();
            
            // Hi-hat (off-beats)
            setTimeout(() => playHiHat(), beatTime * 0.5);
            
            // Snare (beats 2 and 4)
            if (Date.now() % (beatTime * 2) < beatTime) {
                setTimeout(() => playSnare(), beatTime);
            }
        }, beatTime);
        
    } catch (error) {
        console.log('Background music failed:', error);
        isPlaying = false;
    }
}

// Stop background music
function stopBackgroundMusic() {
    isPlaying = false;
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
}

// Play kick drum sound
function playKick() {
    if (!audioInitialized) return;
    
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.1);
        
    } catch (error) {
        console.log('Kick sound failed:', error);
    }
}

// Play hi-hat sound
function playHiHat() {
    if (!audioInitialized) return;
    
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.05, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.03);
        
    } catch (error) {
        console.log('Hi-hat sound failed:', error);
    }
}

// Play snare sound
function playSnare() {
    if (!audioInitialized) return;
    
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, audioContext.currentTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.Q.setValueAtTime(5, audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.05);
        
    } catch (error) {
        console.log('Snare sound failed:', error);
    }
}

// Play clean spin sound
function playSpinSound() {
    if (!audioInitialized) return;
    
    try {
        // Create a simple, clean spin sound
        const duration = 2.0;
        
        // Whoosh sound for spinning
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
        
    } catch (error) {
        console.log('Spin sound failed:', error);
    }
}

// Play ticking sound
function playTickingSound() {
    if (!audioInitialized) return;
    
    let tickCount = 0;
    const maxTicks = 20; // Number of ticks during spin
    
    const tickInterval = setInterval(() => {
        if (!isSpinning || tickCount >= maxTicks) {
            clearInterval(tickInterval);
            return;
        }
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            
        } catch (error) {
            console.log('Tick sound failed:', error);
        }
        
        tickCount++;
    }, 200); // Tick every 200ms
}

// Play clean win sound
function playWinSound() {
    if (!audioInitialized) return;
    
    try {
        // Simple ascending celebration sound
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.start();
                osc.stop(audioContext.currentTime + 0.3);
            }, index * 100);
        });
        
    } catch (error) {
        console.log('Win sound failed:', error);
    }
}

// Play clean lose sound
function playLoseSound() {
    if (!audioInitialized) return;
    
    try {
        // Simple descending sound
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.5);
        
    } catch (error) {
        console.log('Lose sound failed:', error);
    }
}

// Auto-play workaround - attempt to start music on page load
function attemptAutoPlay() {
    // Create a user interaction event listener
    const startMusicOnInteraction = () => {
        if (!audioInitialized) {
            initializeAudio();
        }
        startBackgroundMusic();
        
        // Remove the listener after first interaction
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
        document.removeEventListener('touchstart', startMusicOnInteraction);
    };
    
    // Add listeners for various user interactions
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
    
    // Also try to start immediately (may work in some browsers)
    setTimeout(() => {
        if (!audioInitialized) {
            initializeAudio();
            startBackgroundMusic();
        }
    }, 1000);
}

// Initialize the wheel
function initializeWheel() {
    const wheelContainer = document.getElementById('wheelContainer');
    const wheelNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    wheelNumbers.forEach((num, index) => {
        const angle = (index * 36) - 90; // 360/10 = 36 degrees per number, start from top
        const radius = 170; // Distance from center - increased for better visibility
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'wheel-number';
        numberDiv.dataset.number = num;
        numberDiv.style.left = `calc(50% + ${x}px - 30px)`;
        numberDiv.style.top = `calc(50% + ${y}px - 30px)`;
        
        numberDiv.innerHTML = `
            <div class="text-lg font-bold">${num}</div>
            <div class="text-xs text-yellow-400">x${multipliers[num]}</div>
        `;
        
        numberDiv.addEventListener('click', () => selectNumber(num));
        wheelContainer.appendChild(numberDiv);
    });
}

// Select a number
function selectNumber(num) {
    if (isSpinning) return;
    
    // Initialize audio on first user interaction
    if (!audioInitialized) {
        initializeAudio();
        startBackgroundMusic();
    }
    
    const selectedElement = document.querySelector(`[data-number="${num}"]`);
    const index = selectedNumbers.indexOf(num);
    
    if (index > -1) {
        // Deselect if already selected
        selectedNumbers.splice(index, 1);
        selectedElement.classList.remove('selected');
    } else if (selectedNumbers.length < MAX_SELECTIONS) {
        // Select if under limit
        selectedNumbers.push(num);
        selectedElement.classList.add('selected');
    } else {
        // Replace oldest selection if at limit
        const oldNumber = selectedNumbers.shift();
        const oldElement = document.querySelector(`[data-number="${oldNumber}"]`);
        oldElement.classList.remove('selected');
        
        selectedNumbers.push(num);
        selectedElement.classList.add('selected');
    }
    
    updateSelectedNumberDisplay();
}

// Update selected number display
function updateSelectedNumberDisplay() {
    const display = document.getElementById('selectedNumber');
    if (selectedNumbers.length > 0) {
        let html = '<div class="flex justify-center gap-4">';
        selectedNumbers.forEach(num => {
            html += `
                <div class="text-center">
                    <div class="text-3xl font-bold text-yellow-400">${num}</div>
                    <div class="text-sm text-yellow-300">x${multipliers[num]}</div>
                </div>
            `;
        });
        html += '</div>';
        html += `<div class="text-sm text-gray-300 mt-2">${selectedNumbers.length}/${MAX_SELECTIONS} selected</div>`;
        display.innerHTML = html;
    } else {
        display.innerHTML = '<div class="text-xl text-gray-400">Select up to 2 numbers</div>';
    }
}

// Spin the wheel
async function spinWheel() {
    if (isSpinning || selectedNumbers.length === 0) {
        if (selectedNumbers.length === 0) {
            showMessage('Please select at least one number!', 'error');
        }
        return;
    }
    
    // Check if user is logged in
    if (!currentUser) {
        showMessage('Please login to play!', 'error');
        showLoginPrompt();
        return;
    }
    
    const stake = parseFloat(document.getElementById('stakeInput').value);
    if (stake < 1 || stake > 1000 || isNaN(stake)) {
        showMessage('Please enter a valid stake amount (1-1000 GHC)', 'error');
        return;
    }
    
    // Check if user has sufficient balance
    if (currentUser.balance < stake) {
        showMessage(`Insufficient balance! You have ${currentUser.balance} GHC, but need ${stake} GHC.`, 'error');
        return;
    }
    
    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    spinButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>SPINNING...';
    
    // Hide previous result
    document.getElementById('resultDisplay').classList.add('hidden');
    
    // Call backend API
    try {
        const response = await fetch(`${API_BASE_URL}/spin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedNumbers: selectedNumbers,
                stake: stake,
                userId: currentUser.id
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error === 'Insufficient balance') {
                showMessage(`Insufficient balance! You have ${errorData.currentBalance} GHC, but need ${errorData.requiredStake} GHC.`, 'error');
                // Reset UI on insufficient balance
                isSpinning = false;
                spinButton.disabled = false;
                spinButton.innerHTML = '<i class="fas fa-dice mr-2"></i>SPIN TO WIN';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gameResult = await response.json();
        
        // Update user balance in localStorage and UI
        if (gameResult.newBalance !== undefined) {
            currentUser.balance = gameResult.newBalance;
            localStorage.setItem('bonnysino_user', JSON.stringify(currentUser));
            updateBalanceDisplay();
        }
        
        // Play spin sound
        if (audioInitialized) {
            playSpinSound();
            
            // Start ticking sound after spin sound
            setTimeout(() => {
                if (audioInitialized) {
                    playTickingSound();
                }
            }, 500);
        }
        
        // Animate wheel spinning with backend result
        const wheelContainer = document.getElementById('wheelContainer');
        // Calculate rotation so the winning number lands at the top (pointer position)
        // Numbers are positioned starting from top (12 o'clock) and going clockwise
        // To land number X at the top, we need to rotate: -(X-1) * 36 degrees
        const targetRotation = 720 - (gameResult.winningNumber - 1) * 36;
        wheelContainer.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheelContainer.style.transform = `rotate(${targetRotation}deg)`;
        
        // Show result after animation
        setTimeout(() => {
            // Stop ticking sound (ticking stops automatically when isSpinning = false)
            
            showResultPopup(gameResult.winningNumber, stake, gameResult.result, gameResult.payout);
            isSpinning = false;
            spinButton.disabled = false;
            spinButton.innerHTML = '<i class="fas fa-dice mr-2"></i>SPIN TO WIN';
            
            // Reset wheel position
            setTimeout(() => {
                wheelContainer.style.transition = 'none';
                wheelContainer.style.transform = 'rotate(0deg)';
            }, 100);
        }, 4000);
        
    } catch (error) {
        console.error('Error calling backend API:', error);
        showMessage('Failed to connect to game server. Please try again.', 'error');
        
        // Reset UI on error
        isSpinning = false;
        spinButton.disabled = false;
        spinButton.innerHTML = '<i class="fas fa-dice mr-2"></i>SPIN TO WIN';
    }
}

// Show result popup
function showResultPopup(winningNumber, stake, result, payout) {
    const popup = document.getElementById('resultPopup');
    const popupContent = document.getElementById('popupContent');
    const selectedDisplay = document.getElementById('selectedNumbersDisplay');
    const winningDisplay = document.getElementById('winningNumberDisplay');
    const resultDetails = document.getElementById('resultDetails');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    
    // Display selected numbers
    selectedDisplay.textContent = selectedNumbers.join(', ');
    
    // Display winning number
    winningDisplay.textContent = winningNumber;
    
    // Use backend result directly
    const isWin = result === 'win';
    
    if (isWin) {
        // Play win sound
        if (audioInitialized) {
            playWinSound();
        }
        
        resultIcon.className = 'fas fa-trophy text-6xl text-yellow-400 mb-4';
        resultTitle.textContent = '🎉 WINNER! 🎉';
        resultTitle.className = 'text-3xl font-bold text-green-400 mb-2';
        
        resultDetails.innerHTML = `
            <p class="text-green-400 font-bold text-xl mb-2">You Won!</p>
            <p class="text-yellow-300">Stake: ${stake} GHC</p>
            <p class="text-yellow-300">Winning Number: ${winningNumber}</p>
            <p class="text-green-400 font-bold text-2xl">Total Win: ${payout.toFixed(2)} GHC</p>
        `;
        
        // Celebration effect
        celebrateWin();
    } else {
        // Play lose sound
        if (audioInitialized) {
            playLoseSound();
        }
        
        resultIcon.className = 'fas fa-times-circle text-6xl text-red-400 mb-4';
        resultTitle.textContent = 'BETTER LUCK NEXT TIME';
        resultTitle.className = 'text-3xl font-bold text-red-400 mb-2';
        
        resultDetails.innerHTML = `
            <p class="text-red-400 font-bold text-xl mb-2">You Lost!</p>
            <p class="text-yellow-300">Winning Number: ${winningNumber}</p>
            <p class="text-yellow-300">You lost your stake of ${stake} GHC</p>
            <p class="text-gray-400 text-sm">Try again - your luck might change!</p>
        `;
    }
    
    // Show popup with animation
    popup.classList.remove('hidden');
    setTimeout(() => {
        popupContent.style.transform = 'scale(1)';
    }, 100);
}

// Close result popup
function closeResultPopup() {
    const popup = document.getElementById('resultPopup');
    const popupContent = document.getElementById('popupContent');
    
    popupContent.style.transform = 'scale(0)';
    setTimeout(() => {
        popup.classList.add('hidden');
        
        // Clear selected numbers for fresh game
        clearSelections();
    }, 300);
}

// Clear all selections
function clearSelections() {
    selectedNumbers = [];
    
    // Remove visual selection from all wheel numbers
    document.querySelectorAll('.wheel-number').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Update display to show no selection
    updateSelectedNumberDisplay();
}

// Show result (legacy function for fallback)
function showResult(result, stake) {
    const resultDisplay = document.getElementById('resultDisplay');
    const resultText = resultDisplay.querySelector('p');
    
    const isWin = selectedNumbers.includes(result);
    
    if (isWin) {
        const winningNumber = selectedNumbers.find(num => num === result);
        const winnings = stake * multipliers[winningNumber];
        resultText.innerHTML = `
            <div class="text-2xl mb-2">🎉 WINNER! 🎉</div>
            <div>Number ${result} - You won ${winnings.toFixed(2)} GHC!</div>
            <div class="text-sm mt-2">Stake: ${stake} GHC × ${multipliers[winningNumber]} = ${winnings.toFixed(2)} GHC</div>
        `;
        resultText.className = 'text-green-400 font-bold';
        
        // Celebration effect
        celebrateWin();
    } else {
        resultText.innerHTML = `
            <div class="text-xl mb-2">Number ${result}</div>
            <div>Better luck next time!</div>
            <div class="text-sm mt-2">You selected: ${selectedNumbers.join(', ')}</div>
        `;
        resultText.className = 'text-red-400 font-bold';
    }
    
    resultDisplay.classList.remove('hidden');
}

// Show message
function showMessage(message, type) {
    const resultDisplay = document.getElementById('resultDisplay');
    const resultText = resultDisplay.querySelector('p');
    
    resultText.textContent = message;
    resultText.className = type === 'error' ? 'text-red-400 font-bold' : 'text-yellow-400 font-bold';
    resultDisplay.classList.remove('hidden');
    
    setTimeout(() => {
        resultDisplay.classList.add('hidden');
    }, 3000);
}

// Celebration effect
function celebrateWin() {
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createConfetti();
        }, i * 50);
    }
}

// Create confetti piece
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.opacity = '1';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.transition = 'all 2s ease-out';
    confetti.style.zIndex = '9999';
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.style.top = '100%';
        confetti.style.opacity = '0';
        confetti.style.transform = `rotate(${Math.random() * 720}deg)`;
    }, 10);
    
    setTimeout(() => {
        document.body.removeChild(confetti);
    }, 2000);
}

// Authentication System
let currentUser = null;

// Check if user is logged in on page load
function checkAuthStatus() {
    const savedUser = localStorage.getItem('bonnysino_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserInfo();
        hideLoginPrompt();
    } else {
        showLoginPrompt();
    }
}

// Show user info bar
function showUserInfo() {
    const userInfoBar = document.getElementById('userInfoBar');
    const userDisplay = document.getElementById('userDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    
    userInfoBar.classList.remove('hidden');
    userDisplay.textContent = currentUser.username;
    updateBalanceDisplay();
}

// Update balance display
function updateBalanceDisplay() {
    const balanceDisplay = document.getElementById('balanceDisplay');
    const gameBalanceDisplay = document.getElementById('gameBalanceDisplay');
    
    if (currentUser) {
        const balance = currentUser.balance || 0;
        if (balanceDisplay) {
            balanceDisplay.textContent = balance;
        }
        if (gameBalanceDisplay) {
            gameBalanceDisplay.textContent = `${balance} GHC`;
        }
    }
}

// Hide user info bar
function hideUserInfo() {
    const userInfoBar = document.getElementById('userInfoBar');
    userInfoBar.classList.add('hidden');
}

// Show login prompt
function showLoginPrompt() {
    setTimeout(() => {
        const loginModal = document.getElementById('loginModal');
        loginModal.classList.remove('hidden');
    }, 1000);
}

// Hide login prompt
function hideLoginPrompt() {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.add('hidden');
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('bonnysino_user', JSON.stringify(currentUser));
            showUserInfo();
            hideLoginPrompt();
            showMessage('Login successful!', 'success');
            return true;
        } else {
            showMessage(data.error || 'Login failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Failed to connect to server', 'error');
        return false;
    }
}

// Register function
async function register(username, momoNumber, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, momoNumber, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            // Switch to login modal
            document.getElementById('registerModal').classList.add('hidden');
            document.getElementById('loginModal').classList.remove('hidden');
            return true;
        } else {
            showMessage(data.error || 'Registration failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('Failed to connect to server', 'error');
        return false;
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('bonnysino_user');
    hideUserInfo();
    showLoginPrompt();
    showMessage('Logged out successfully', 'success');
}

// Paystack payment functions
function initializePaystackPayment(amount, email, userId) {
    const handler = PaystackPop.setup({
        key: 'pk_test_44c5b335a08c29cd8e74d58346b52615d139d210', // User's actual test public key
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: 'GHS',
        ref: 'BONNYSINO_' + Math.floor(Math.random() * 1000000000 + 1), // Generate unique reference
        callback: function(response) {
            // Payment successful - verify with backend
            verifyPayment(response.reference, userId);
        },
        onClose: function() {
            // Payment modal closed
            closePaymentProcessingModal();
            showMessage('Payment cancelled', 'error');
        }
    });
    
    handler.openIframe();
}

// Verify payment with backend
async function verifyPayment(reference, userId) {
    try {
        // Test mode - skip Paystack verification and add test amount
        if (reference === 'test_mode') {
            const testAmount = 100; // Test 100 GHC
            
            // Update user balance directly
            currentUser.balance += testAmount;
            localStorage.setItem('bonnysino_user', JSON.stringify(currentUser));
            updateBalanceDisplay();
            
            closePaymentProcessingModal();
            closeDepositModal();
            showMessage(`Test payment successful! ${testAmount} GHC added to your balance.`, 'success');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference, userId })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Update user balance in localStorage and UI
            currentUser.balance = result.newBalance;
            localStorage.setItem('bonnysino_user', JSON.stringify(currentUser));
            updateBalanceDisplay();
            
            closePaymentProcessingModal();
            closeDepositModal();
            showMessage(`Payment successful! ${result.amount} GHC added to your balance.`, 'success');
        } else {
            closePaymentProcessingModal();
            showMessage(result.error || 'Payment verification failed', 'error');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        closePaymentProcessingModal();
        showMessage('Failed to verify payment. Please contact support.', 'error');
    }
}

// Show payment processing modal
function showPaymentProcessingModal() {
    document.getElementById('paymentProcessingModal').classList.remove('hidden');
}

// Close payment processing modal
function closePaymentProcessingModal() {
    document.getElementById('paymentProcessingModal').classList.add('hidden');
}

// Show deposit modal
function showDepositModal() {
    if (!currentUser) {
        showMessage('Please login to make a deposit', 'error');
        return;
    }
    document.getElementById('depositModal').classList.remove('hidden');
}

// Close deposit modal
function closeDepositModal() {
    document.getElementById('depositModal').classList.add('hidden');
    document.getElementById('depositForm').reset();
}

// Withdrawal functions
function showWithdrawModal() {
    if (!currentUser) {
        showMessage('Please login to make a withdrawal', 'error');
        return;
    }
    
    // Update balance display in withdrawal modal
    const withdrawBalanceDisplay = document.getElementById('withdrawBalanceDisplay');
    if (withdrawBalanceDisplay) {
        withdrawBalanceDisplay.textContent = `${currentUser.balance || 0} GHC`;
    }
    
    // Set max amount for withdrawal input
    const withdrawAmount = document.getElementById('withdrawAmount');
    if (withdrawAmount) {
        withdrawAmount.max = currentUser.balance || 0;
    }
    
    // Pre-fill MoMo number if user has one
    const withdrawMomoNumber = document.getElementById('withdrawMomoNumber');
    if (withdrawMomoNumber && currentUser.momoNumber) {
        withdrawMomoNumber.value = currentUser.momoNumber;
    }
    
    document.getElementById('withdrawModal').classList.remove('hidden');
}

// Close withdrawal modal
function closeWithdrawModal() {
    document.getElementById('withdrawModal').classList.add('hidden');
    document.getElementById('withdrawForm').reset();
}

// Process withdrawal
async function processWithdrawal(amount, momoNumber, notes) {
    try {
        const response = await fetch(`${API_BASE_URL}/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.id,
                amount: amount,
                momoNumber: momoNumber,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Update user balance in localStorage and UI
            currentUser.balance = result.newBalance;
            localStorage.setItem('bonnysino_user', JSON.stringify(currentUser));
            updateBalanceDisplay();
            
            closeWithdrawModal();
            showMessage(`Withdrawal request of ${amount} GHC submitted successfully! Processing within 24 hours.`, 'success');
        } else {
            showMessage(result.error || 'Withdrawal failed', 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showMessage('Failed to process withdrawal. Please try again.', 'error');
    }
}

// Show message function
function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeWheel();
    
    // Attempt auto-play for background music
    attemptAutoPlay();
    
    // Check authentication status
    checkAuthStatus();
    
    document.getElementById('spinButton').addEventListener('click', spinWheel);
    
    document.getElementById('stakeInput').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (value < 1) e.target.value = 1;
        if (value > 1000) e.target.value = 1000;
    });
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isSpinning) {
            spinWheel();
        }
        if (e.key >= '1' && e.key <= '0') {
            const num = e.key === '0' ? 10 : parseInt(e.key);
            selectNumber(num);
        }
    });
    
    // Authentication event listeners
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        await login(username, password);
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const momoNumber = document.getElementById('registerMomoNumber').value;
        const password = document.getElementById('registerPassword').value;
        
        await register(username, momoNumber, password);
    });
    
    // Modal switching
    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('registerModal').classList.remove('hidden');
    });
    
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
    });
    
    // Close modals
    document.getElementById('closeLoginModal').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('hidden');
    });
    
    document.getElementById('closeRegisterModal').addEventListener('click', () => {
        document.getElementById('registerModal').classList.add('hidden');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Deposit functionality
    document.getElementById('depositBtn').addEventListener('click', showDepositModal);
    
    // Withdrawal functionality
    document.getElementById('withdrawBtn').addEventListener('click', showWithdrawModal);
    
    document.getElementById('withdrawForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showMessage('Please login to make a withdrawal', 'error');
            return;
        }
        
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const momoNumber = document.getElementById('withdrawMomoNumber').value;
        const notes = document.getElementById('withdrawNotes').value;
        
        if (amount <= 0) {
            showMessage('Please enter a valid amount', 'error');
            return;
        }
        
        if (amount > currentUser.balance) {
            showMessage('Insufficient balance', 'error');
            return;
        }
        
        if (!momoNumber || momoNumber.length < 10) {
            showMessage('Please enter a valid MoMo number', 'error');
            return;
        }
        
        processWithdrawal(amount, momoNumber, notes);
    });
    
    document.getElementById('depositForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showMessage('Please login to make a deposit', 'error');
            return;
        }
        
        const amount = parseFloat(document.getElementById('depositAmount').value);
        
        if (amount < 1 || amount > 10000) {
            showMessage('Please enter an amount between 1 and 10,000 GHC', 'error');
            return;
        }
        
        // Use a dummy email for demo - in production, you'd collect user's email
        const email = `${currentUser.username}@bonnysino.com`;
        
        // Show processing modal and initiate payment
        showPaymentProcessingModal();
        initializePaystackPayment(amount, email, currentUser.id);
    });
    
    // Close deposit modal
    document.getElementById('closeDepositModal').addEventListener('click', closeDepositModal);
    
    // Close withdrawal modal
    document.getElementById('closeWithdrawModal').addEventListener('click', closeWithdrawModal);
});

// Create gold particles
function createGoldParticles() {
    const container = document.getElementById('goldParticles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// Add some ambient animations
setInterval(() => {
    const coins = document.querySelectorAll('.coin-bg');
    coins.forEach(coin => {
        coin.style.opacity = Math.random() * 0.2 + 0.05;
    });
}, 2000);

// Initialize gold particles when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createGoldParticles();
});
