const random = require("random-string-generator");


// Spotify Login Listener
const clientID = encodeURIComponent("a1794c4b3ff54d829531b3941ecf5620");
const state = encodeURIComponent(random(43));
const verfier = encodeURIComponent(random(43));
const scope = encodeURIComponent("user-read-private user-read-email");
const uri = chrome.identity.getRedirectURL();
const authURI = "https://accounts.spotify.com/authorize?";
const type = encodeURIComponent("code");
const dialog = encodeURIComponent("true");

// code_challenge_method: 'S256',
// code_challenge: state

const url = new URL(authURI);
url.searchParams.append("response_type", type);
url.searchParams.append("client_id", clientID);
url.searchParams.append("scope", scope);
url.searchParams.append("redirect_uri", uri);
url.searchParams.append("state", state);
url.searchParams.append("show_dialog", dialog);

// TODO: add sha256 hash and pcke extension 
// url.searchParams.append("code_challenge_method", "S256");
// url.searchParams.append("code_challenge", state);

const signedIn = false;

console.log("Running: Background script...")
console.log(url.href)
console.log(chrome.identity.getRedirectURL())

chrome.runtime.onMessage.addListener((req, sender, res) => {
  console.log("Message received")
  if (req.message === "signin" && !signedIn) {
    console.log("Passes conditional")
    chrome.identity.launchWebAuthFlow(
      { url: url.href, interactive: true },
      function (redirectURL) {
        if (chrome.runtime.lastError) {
          console.log("error: " + chrome.runtime.lastError.message);
          return;
        }
        const urlParams = new URLSearchParams(redirectURL)
        if (urlParams.has("error") || urlParams.get("state") !== state) {
          console.log("error: access_denied");
          return;
        }
        console.log(redirectURL)
      }
    );
  }
});

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
