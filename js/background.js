
chrome.alarms.create({
    periodInMinutes: 1 / 60
})

chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get(["hours", "minutes", "seconds", "isRunning", "setTime"], (res) => {
        const isRunning = res.isRunning || false; 
        const hour = res.hours || 0; 
        const min = res.minutes || 0;
        const sec = res.seconds || 0; 
        const setTime = res.setTime;

        if (!isRunning) {
            return 
        }

        if (min == 0 && sec == 0 && hour > 0) {
            chrome.storage.local.set({
                hours: hour-1,
                minutes: 59,
                seconds: 59
            })
        } else if (sec == 0 && min > 0) {
            chrome.storage.local.set({
                minutes: min-1,
                seconds: 59
            })
        } else if (sec > 0) {
            chrome.storage.local.set({seconds: sec-1})
        } else {
            chrome.storage.local.set({
                isRunning: false
            })
            this.registration.showNotification("Doro -- Timer is done!", {
                body: `${setTime.hours} hour and ${setTime.minutes} minute completed.`
            })
        }
    })
})