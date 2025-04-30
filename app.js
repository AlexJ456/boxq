let currentPhase = 'inhale';
let phaseDurations = {
    inhale: 4,
    hold: 4,
    exhale: 4,
    wait: 4
};

let totalTime = 0;
let exerciseTimeout;
let duration = 4;
let endTimeLimit = null;
let isRunning = false;

const homePage = document.getElementById('home');
const exercisePage = document.getElementById('exercise');
const dot = document.getElementById('dot');
const phaseTimer = document.getElementById('phaseTimer');
const phaseName = document.getElementById('phaseName');
const totalTimeEl = document.getElementById('totalTime');
const durationSlider = document.getElementById('durationSlider');
const durationValue = document.getElementById('durationValue');

// Phase order
const phases = ['inhale', 'hold', 'exhale', 'wait'];
const phasePositions = [
    // Coordinates for each phase [x, y]
    [0, 0],   // Inhale (bottom left)
    [100, 0], // Hold (top right)
    [100, 100], // Exhale (bottom right)
    [0, 100]    // Wait (bottom left)
];

function updateUI() {
    phaseName.textContent = capitalize(currentPhase);
    durationValue.textContent = duration;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function animateDot(fromX, fromY, toX, toY, duration) {
    const startTime = performance.now();
    const distanceX = toX - fromX;
    const distanceY = toY - fromY;
    
    function animate(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        const x = fromX + distanceX * progress;
        const y = fromY + distanceY * progress;
        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            dot.classList.add('pulse');
            setTimeout(() => dot.classList.remove('pulse'), 300);
        }
    }
    requestAnimationFrame(animate);
}

function getCurrentPhaseIndex() {
    return phases.indexOf(currentPhase);
}

function getNextPhase() {
    const currentIndex = getCurrentPhaseIndex();
    return phases[(currentIndex + 1) % phases.length];
}

function updateTimers(phaseDuration) {
    let remaining = phaseDuration || phaseDurations[currentPhase];
    phaseTimer.textContent = `0:${remaining.toString().padStart(2, '0')}`;
    
    const interval = setInterval(() => {
        remaining--;
        if (remaining < 0) {
            clearInterval(interval);
            return;
        }
        phaseTimer.textContent = `0:${remaining.toString().padStart(2, '0')}`;
    }, 1000);
}

function calculateTotalTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function transitionToNextPhase() {
    const currentIndex = getCurrentPhaseIndex();
    const nextPhase = phases[(currentIndex + 1) % phases.length];
    const currentDuration = phaseDurations[currentPhase];
    const now = Date.now();

    // Calculate positions
    const [fromX, fromY] = phasePositions[currentIndex];
    const [toX, toY] = phasePositions[nextPhase === 'inhale' ? 0 : currentIndex + 1];
    
    // Update UI
    currentPhase = nextPhase;
    updateUI();
    updateTimers();

    // Animate
    animateDot(fromX, fromY, toX, toY, currentDuration * 1000);

    // Check if we should end
    if (endTimeLimit && now >= endTimeLimit) {
        if (currentPhase === 'exhale') {
            stopExercise();
            return;
        }
    }

    // Schedule next phase
    exerciseTimeout = setTimeout(() => transitionToNextPhase(), 
        currentDuration * 1000);
}

function startTotalTimeCounter() {
    totalTime = 0;
    totalTimeEl.textContent = calculateTotalTime(totalTime);
    
    const interval = setInterval(() => {
        totalTime++;
        totalTimeEl.textContent = calculateTotalTime(totalTime);
    }, 1000);
    
    return interval;
}

function startExercise(timeLimit) {
    // Set phase duration
    duration = parseInt(durationSlider.value);
    Object.keys(phaseDurations).forEach(key => {
        phaseDurations[key] = duration;
    });

    endTimeLimit = timeLimit ? Date.now() + timeLimit * 1000 : null;
    
    // Reset everything
    currentPhase = 'inhale';
    updateUI();
    updateTimers();
    
    // Position dot at starting point
    dot.style.left = '0%';
    dot.style.top = '100%';
    
    // Switch pages
    homePage.classList.remove('active');
    exercisePage.classList.add('active');
    
    // Start total time counter
    startTotalTimeCounter();
    
    // Start exercise loop
    isRunning = true;
    exerciseTimeout = setTimeout(() => transitionToNextPhase(), 
        phaseDurations.inhale * 1000);
}

function stopExercise() {
    isRunning = false;
    clearTimeout(exerciseTimeout);
    homePage.classList.add('active');
    exercisePage.classList.remove('active');
}

// Initialize
updateUI();

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
        stopExercise();
    }
});
