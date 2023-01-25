const minuteElem = document.getElementById("minutes");
const secondElem = document.getElementById("seconds");
const progressRing = document.getElementById("timer-outer");
const timerUI = document.getElementById("timer-ui")
const timerControl = document.getElementById("timer-control")
const hourElem = document.getElementById("hours")
const minElem = document.getElementById("minutes")
const secElem = document.getElementById("seconds")
const taskElem = document.getElementById("task")
const editBtn = document.getElementById("edit-btn")

const startBtn = document.getElementById("start");
const timerInput = document.getElementById("timer-input")
const hoursInput = document.getElementById("hours-input");
const minsInput = document.getElementById("minutes-input");
const descriptInput = document.getElementById("description");

let showTimerUI = false; 


// -- Helper functions --  

// Increment ring for timer gui 
function incrementRing() {
    if (progressRing) {
        progressRing.style.background = `conic-gradient(
            #212529 100deg,
            lightgreen 100deg
        )`
    }
}

// Toggle between showing timer vs input timer settings 
function toggleUI() {
    if (showTimerUI) {
        timerInput.style.display = "none";
        timerUI.style.display = "";
    } else {
        timerInput.style.display = "";
        timerUI.style.display = "none";
    }
    showTimerUI = !showTimerUI;
}

function updateTime() {
    chrome.storage.local.get(["hours", "minutes", "seconds", "isRunning"], (res) => {
        if (res.isRunning) {
            hourElem.textContent = res.hours >= 10 ? res.hours : "0" + res.hours
            minElem.textContent = res.minutes >= 10 ? res.minutes : "0" + res.minutes
            secElem.textContent = res.seconds >= 10 ? res.seconds : "0" + res.seconds
        }
    })
}


// -- Event Listeners --  

editBtn.addEventListener("click", (event) => {
    toggleUI()
})

timerControl.addEventListener("click", (event) => {
    chrome.storage.local.get(["isRunning"], (res) => {
        chrome.storage.local.set({
            isRunning: !res.isRunning 
        })

        timerControl.textContent = res.isRunning ? "Pause" : "Start"
    })

    timerControl
})

// Note:
// - edge cases: 
//  - both min and hours 0
startBtn.addEventListener("click", (event) => {
    event.preventDefault()

    const hours = hoursInput.value || 0;
    const minutes = minsInput.value || 0;
    const seconds = 0;

    taskElem.textContent = descriptInput.value || "Working..."
    
    // Note: timer unique to eqch browser 
    chrome.storage.local.set({
        hours,
        minutes,
        seconds, 
        isRunning: true,
        setTime: {
            hours,
            minutes,
            seconds
        }
    })
    toggleUI()
})


// -- Main Code -- 

incrementRing()
toggleUI()
updateTime()
setInterval(updateTime, 1000)