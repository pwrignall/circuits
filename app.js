// Available exercises list
const availableExercises = [
    "High Knees",
    "Push-ups",
    "Mountain Climbers",
    "Squats",
    "Jumping Jacks",
    "Burpees",
    "Plank",
    "Lunges",
    "Tricep Dips",
    "Bicycle Crunches",
    "Jump Squats",
    "Shoulder Taps",
    "Side Plank (Right)",
    "Side Plank (Left)",
    "Russian Twists",
    "Leg Raises",
    "Lateral Lunges",
    "Dumbbell Rows",
    "Superman",
    "Glute Bridges",
    "Calf Raises",
    "Wall Sit",
    "Bear Crawl",
    "Inchworm",
    "Hip Thrusts"
];

// DOM elements for setup screen
const setupScreen = document.getElementById('setup-screen');
const workoutScreen = document.getElementById('workout-screen');
const exerciseList = document.getElementById('exercise-list');
const selectedCount = document.getElementById('selected-count');
const selectAllBtn = document.getElementById('select-all');
const deselectAllBtn = document.getElementById('deselect-all');
const randomizeBtn = document.getElementById('randomize');
const startWorkoutBtn = document.getElementById('start-workout-btn');
const exerciseTimeInput = document.getElementById('exercise-time');
const restTimeInput = document.getElementById('rest-time');

// DOM elements for workout screen
const timerElement = document.getElementById('timer');
const currentExerciseElement = document.getElementById('current-exercise');
const nextExerciseElement = document.getElementById('next-exercise');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const backToSetupBtn = document.getElementById('back-to-setup-btn');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');

// App state
let workout = {
    exerciseTime: 40,
    restTime: 20,
    exercises: []
};
let currentExerciseIndex = 0;
let isResting = false;
let timeRemaining = 0;
let totalTime = 0;
let elapsedTime = 0;
let isPaused = false;
let timerId = null;
let selectedExercises = [];

// Prevent screen from timing out on mobile devices
function keepScreenAwake() {
    if (navigator.wakeLock) {
        let wakeLock = null;
        
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock activated');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Screen wake lock released');
                });
            } catch (err) {
                console.error(`Wake lock error: ${err.message}`);
            }
        };
        
        requestWakeLock();
        
        // Reacquire wake lock if page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !wakeLock) {
                requestWakeLock();
            }
        });
    }
}

// Populate exercise selection list
function populateExerciseList() {
    exerciseList.innerHTML = '';
    
    availableExercises.forEach((exercise, index) => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `exercise-${index}`;
        checkbox.value = exercise;
        checkbox.checked = false;
        checkbox.addEventListener('change', updateSelectedCount);
        
        const label = document.createElement('label');
        label.htmlFor = `exercise-${index}`;
        label.textContent = exercise;
        
        exerciseItem.appendChild(checkbox);
        exerciseItem.appendChild(label);
        exerciseList.appendChild(exerciseItem);
    });
    
    // Randomly select 10 exercises by default
    randomizeExercises();
}

// Update selected exercise count
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#exercise-list input[type="checkbox"]:checked');
    selectedCount.textContent = checkboxes.length;
    
    // Enable/disable start button based on selection
    startWorkoutBtn.disabled = checkboxes.length === 0;
    
    // Update selected exercises array
    selectedExercises = Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Select all exercises
function selectAll() {
    const checkboxes = document.querySelectorAll('#exercise-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectedCount();
}

// Deselect all exercises
function deselectAll() {
    const checkboxes = document.querySelectorAll('#exercise-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedCount();
}

// Randomly select 10 exercises
function randomizeExercises() {
    // First, uncheck all
    deselectAll();
    
    // Get 10 random unique indices
    const randomIndices = [];
    while (randomIndices.length < 10 && randomIndices.length < availableExercises.length) {
        const randomIndex = Math.floor(Math.random() * availableExercises.length);
        if (!randomIndices.includes(randomIndex)) {
            randomIndices.push(randomIndex);
        }
    }
    
    // Check the randomly selected exercises
    randomIndices.forEach(index => {
        const checkbox = document.getElementById(`exercise-${index}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    updateSelectedCount();
}

// Start the workout
function startWorkout() {
    // Validate settings
    const exerciseTime = parseInt(exerciseTimeInput.value, 10);
    const restTime = parseInt(restTimeInput.value, 10);
    
    if (isNaN(exerciseTime) || exerciseTime < 10 || isNaN(restTime) || restTime < 5) {
        alert('Please enter valid exercise and rest times');
        return;
    }
    
    if (selectedExercises.length === 0) {
        alert('Please select at least one exercise');
        return;
    }
    
    // Configure workout
    workout = {
        exerciseTime: exerciseTime,
        restTime: restTime,
        exercises: selectedExercises
    };
    
    // Calculate total workout time
    totalTime = (workout.exerciseTime + workout.restTime) * workout.exercises.length - workout.restTime;
    
    // Switch to workout screen
    setupScreen.classList.add('hidden');
    workoutScreen.classList.remove('hidden');
    
    // Start workout
    resetWorkout();
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update the timer display
function updateTimerDisplay() {
    timerElement.textContent = formatTime(timeRemaining);
}

// Update the progress bar
function updateProgress() {
    const progressPercentage = (elapsedTime / totalTime) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

// Update exercise display
function updateExerciseDisplay() {
    const currentExercise = workout.exercises[currentExerciseIndex];
    const nextExercise = currentExerciseIndex < workout.exercises.length - 1 
        ? workout.exercises[currentExerciseIndex + 1] 
        : 'Done!';
    
    if (isResting) {
        currentExerciseElement.textContent = 'REST';
        nextExerciseElement.textContent = currentExercise;
        statusMessage.textContent = `Rest period: Get ready for ${currentExercise}`;
    } else {
        currentExerciseElement.textContent = currentExercise;
        nextExerciseElement.textContent = nextExercise;
        statusMessage.textContent = `Exercise ${currentExerciseIndex + 1} of ${workout.exercises.length}`;
    }
}

// Start the timer
function startTimer() {
    if (timerId) clearInterval(timerId);
    
    timerId = setInterval(() => {
        if (isPaused) return;
        
        if (timeRemaining > 0) {
            timeRemaining--;
            elapsedTime++;
            updateTimerDisplay();
            updateProgress();
        } else {
            if (isResting) {
                // Rest period is over, start exercise
                isResting = false;
                timeRemaining = workout.exerciseTime;
                updateExerciseDisplay();
            } else {
                // Exercise is done
                currentExerciseIndex++;
                
                if (currentExerciseIndex >= workout.exercises.length) {
                    // Workout complete
                    clearInterval(timerId);
                    currentExerciseElement.textContent = 'Workout Complete!';
                    nextExerciseElement.textContent = '';
                    statusMessage.textContent = 'Great job! You finished the circuit.';
                    pauseButton.disabled = true;
                    return;
                }
                
                // Start rest period
                isResting = true;
                timeRemaining = workout.restTime;
                updateExerciseDisplay();
            }
        }
    }, 1000);
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseButton.textContent = 'Resume';
        pauseButton.classList.add('paused');
        statusMessage.textContent = 'Paused';
    } else {
        pauseButton.textContent = 'Pause';
        pauseButton.classList.remove('paused');
        updateExerciseDisplay();
    }
}

// Reset the workout
function resetWorkout() {
    if (timerId) clearInterval(timerId);
    
    currentExerciseIndex = 0;
    isResting = false;
    timeRemaining = workout.exerciseTime;
    elapsedTime = 0;
    isPaused = false;
    
    pauseButton.textContent = 'Pause';
    pauseButton.classList.remove('paused');
    pauseButton.disabled = false;
    
    updateTimerDisplay();
    updateExerciseDisplay();
    updateProgress();
    
    startTimer();
}

// Return to setup screen
function backToSetup() {
    if (timerId) clearInterval(timerId);
    
    workoutScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
}

// Event listeners for setup screen
selectAllBtn.addEventListener('click', selectAll);
deselectAllBtn.addEventListener('click', deselectAll);
randomizeBtn.addEventListener('click', randomizeExercises);
startWorkoutBtn.addEventListener('click', startWorkout);

// Event listeners for workout screen
pauseButton.addEventListener('click', togglePause);
resetButton.addEventListener('click', resetWorkout);
backToSetupBtn.addEventListener('click', backToSetup);

// Initialize the app
function initApp() {
    keepScreenAwake();
    populateExerciseList();
    startWorkoutBtn.disabled = true;
}

// Start the app
window.addEventListener('DOMContentLoaded', initApp);