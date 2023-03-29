// REMOVE: Used to check if background script runs in console
// console.log("DEBUG: Running background script...");

// -- Alarm Functions --

// Create alarm interval
chrome.alarms.create({
  periodInMinutes: 1 / 60,
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(
    ["hours", "minutes", "seconds", "isRunning", "setTime"],
    (res) => {
      const isRunning = res.isRunning || false;
      const hour = res.hours || 0;
      const min = res.minutes || 0;
      const sec = res.seconds || 0;

      if (!isRunning) {
        return;
      }
      if (min == 0 && sec == 0 && hour > 0) {
        chrome.storage.local.set({
          hours: hour - 1,
          minutes: 59,
          seconds: 59,
        });
      } else if (sec == 0 && min > 0) {
        chrome.storage.local.set({
          minutes: min - 1,
          seconds: 59,
        });
      } else if (sec > 0) {
        chrome.storage.local.set({ seconds: sec - 1 });
      } else {
        chrome.storage.local.set({
          isRunning: false,
        });
        // Optional: Show timer done notification on user desktop
        let message;
        if (res.setTime.hours > 0 && res.setTime.minutes > 0) {
          message = `${res.setTime.hours} hour(s) and ${res.setTime.minutes} minute(s) timer complete.`;
        } else if (res.setTime.hours > 0) {
          message = `${res.setTime.hours} hour(s) timer complete.`
        } else {
          message = `${res.setTime.minutes} minute(s) timer complete.`
        }
        chrome.notifications.create({
          title: "Doro - Pomodoro with Spotify Player",
          message,
          type: "basic",
          iconUrl: "./img/doro_logo.png",
        });
      }
    }
  );
});