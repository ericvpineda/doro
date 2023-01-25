const minuteElem = document.getElementById("minutes");
const secondElem = document.getElementById("seconds");
const progressRing = document.getElementById("timer-outer");
const timerUI = document.getElementById("timer-ui")
const timerControl = document.getElementById("timer-control")

const startBtn = document.getElementById("start");
const timerInput = document.getElementById("timer-input")
const hourElem = document.getElementById("hours");
const minElem = document.getElementById("minutes");
const descriptElem = document.getElementById("description");

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


// -- Event Listeners --  

timerControl.addEventListener("click", (event) => {
    toggleUI()
})


// Note:
// - edge cases: 
//  - both min and hours 0
startBtn.addEventListener("click", (event) => {
    event.preventDefault()

    let hours = hourElem.value || 0  
    let minutes = minElem.value || 0
    let description = descriptElem || "Working..."

    // Steps
    // - update chrome storage local with hours and minutes (to update every interval)
    // - increment setInterval to update timer gui
    //  - set hours, minute, sec, and description 
    chrome.storage.sync.set({
        hours,
        minutes,
        description
    })
    toggleUI()
})




// -- Main Code -- 

incrementRing()
toggleUI()