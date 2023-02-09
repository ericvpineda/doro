const random = require("random-string-generator");
const clientID = encodeURIComponent("a1794c4b3ff54d829531b3941ecf5620");
const state = encodeURIComponent(random(43));
const scope = encodeURIComponent("user-read-private user-read-email");
const uri = chrome.identity.getRedirectURL();
const type = encodeURIComponent("code");
const dialog = encodeURIComponent("true");
const signedIn = false;

const createAuthURL = () => {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.append("client_id", clientID);
  url.searchParams.append("state", state);
  url.searchParams.append("scope", scope);
  url.searchParams.append("redirect_uri", uri);
  url.searchParams.append("response_type", type);
  url.searchParams.append("show_dialog", dialog);
  url.searchParams.append("code_challenge_method", "S256");
  return url;
};

const createToken = async (code: string, code_verifier: string) => {
  const url = new URL("https://accounts.spotify.com/api/token");
  url.searchParams.append("grant_type", "authorization_code");
  url.searchParams.append("code", code);
  url.searchParams.append("code_verifier", code_verifier);
  url.searchParams.append("redirect_uri", uri);
  url.searchParams.append("client_id", clientID);
  const params = new URLSearchParams(url.search);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  console.log(url.href)
  console.log(params.toString())

  const response = await fetch(url.href, {method: "POST", headers, body: params.toString()}).
    then((response) => response.json())
    .then((data) => console.log(data))
    .catch((e) => console.log(e));
};

console.log("Running: Background script...");

// Spotify Login Listener
chrome.runtime.onMessage.addListener((req, sender, res) => {
  if (req.message === "signin" && !signedIn) {
    const url = createAuthURL();
    url.searchParams.append("code_challenge", req.challenge[0]);

    chrome.identity.launchWebAuthFlow(
      { url: url.href, interactive: true },
      function (redirectURL) {
        if (chrome.runtime.lastError) {
          console.log("error: " + chrome.runtime.lastError.message);
          return;
        }
        const urlParams = new URLSearchParams(redirectURL);
        if (urlParams.has("error") || urlParams.get("state") !== state) {
          console.log("error: access_denied");
          return;
        }
        if (redirectURL == null) {
          console.log("error: redirect url is null");
          return;
        }
        const redirectParams = new URL(redirectURL)
        const code = redirectParams.searchParams.get("code")!;
        const code_verifier: string = req.challenge[1];
        
        // console.log("Redirect url:", redirectURL)
        // console.log("redirectParams:", redirectParams)
        // console.log("code_verifier: " + code_verifier);
        // console.log("code: " + code); 

        createToken(code, code_verifier);
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
