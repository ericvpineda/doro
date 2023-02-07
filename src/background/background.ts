const random = require("random-string-generator");

// Spotify Login Listener
const client_id = encodeURIComponent("9b8675b2d72647fb9fdd3c06474cfde9");
const state = encodeURIComponent(random(43));
const scope = encodeURIComponent("user-read-private user-read-email");
const redirect_uri = encodeURIComponent(
  "http://fmgfhpilgipjjbkogcbigkdbiocnhfke.chromiumapp.org"
);
const authorization_uri = "https://accounts.spotify.com/authorize?"
const response_type = encodeURIComponent("code");
// code_challenge_method: 'S256',
// code_challenge: state
const url = authorization_uri + `
    client_id=${client_id},
    scope=${scope},
    redirect_uri=${redirect_uri},
    response_type=${response_type},
    state=${state},
  `
console.log(url)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  sendResponse("Received request")
});

// chrome.identity.launchWebAuthFlow({ url, interactive: true}, function(res) {
//     console.log(res);
// })

// Alarm Functions
chrome.alarms.create({
  periodInMinutes: 1 / 60,
});

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
        // this.registration.showNotification("Doro -- Timer is done!", {
        //     body: `${setTime.hours} hour and ${setTime.minutes} minute completed.`
        // })
      }
    }
  );
});
