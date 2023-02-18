import { PlayerActions, Status } from "../Utils/SpotifyUtils";

// DEBUG: Used to check if background script runs in console
console.log("Running: Background script...");

// Playback Actions

// Helper function for calling playback actions
const request = async (method: string, path: string, accessToken: string) => {
  const url = new URL("https://api.spotify.com/v1/me" + path);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  return await fetch(url.href, { method, headers });
};

// Helper method to get get user profile
const getUserProfile = async (params: any) => {
  let response = {};
  if (params.profileUrl !== "") {
    response = { status: Status.SUCCESS, data: params.profileUrl }
  } else {
    await request("GET", "", params.accessToken)
    .then((res) => res.json())
    .then((data) => {
      const profileUrl = data.images[0].url;
      response = { status: Status.SUCCESS, data: profileUrl };
      chrome.storage.local.set({"profileUrl": profileUrl});
    })
    .catch((err) => {
      response = { status: Status.FAILURE, error: err };
    });
  }
  return response;
};

// Listen for spotify playback actions events
chrome.runtime.onMessage.addListener((req, sender, res) => {
  chrome.storage.local.get(
    ["accessToken", "profileUrl", "signedIn"],
    (result: any) => {
      if (result.signedIn && result.accessToken) {
        const accessToken = result.accessToken;
        switch (req.message) {
          case PlayerActions.PLAY:
            break;
          case PlayerActions.PAUSE:
            break;
          case PlayerActions.NEXT:
            break;
          case PlayerActions.PREVIOUS:
            break;
          case PlayerActions.GETPROFILE:
            getUserProfile(result).then((response) => res(response));
            break;
          default:
            res({
              status: Status.ERROR,
              error: "Unknown error occurred.",
            });
            break;
        }
      } else {
        res({
          status: Status.ERROR,
          error: "User is not authenticated.",
        });
      }
    }
  );
  return true;
});

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
        // this.registration.showNotification("Doro -- Timer is done!", {
        //     body: `${setTime.hours} hour and ${setTime.minutes} minute completed.`
        // })
      }
    }
  );
});
