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
  return await fetch(url.href, { method, headers});
};

// Helper method to get get user profile
const getUserProfile = async (params: any) => {
  let response = {};
  if (params.profileUrl !== "") {
    response = {
      status: Status.SUCCESS,
      data: { profileUrl: params.profileUrl },
    };
  } else {
    await request("GET", "", params.accessToken)
      .then((res) => res.json())
      .then((data) => {
        const profileUrl = data.images[0].url;
        response = { status: Status.SUCCESS, data: { profileUrl } };
        chrome.storage.local.set({ profileUrl: profileUrl });
      })
      .catch((err) => {
        response = { status: Status.FAILURE, error: err };
      });
  }
  return response;
};

// Helper method to get currenlty playing song
// - Note: 
//  - Cant cache data since user could change song on different player
//  - TODO: 
//    - add time scale bar to gui
//    - Limit length of album name and artist name (or add revolving style)
const getCurrentlyPlaying = async (params: any) => {
  let response = {};
  await request("GET", "/player/currently-playing", params.accessToken)
    .then((res) => res.json())
    .then((data) => {
      response = {
        status: Status.SUCCESS,
        data: {
          track: data.item.name,
          artist: data.item.artists[0].name,
          albumUrl: data.item.album.images[0].url,
          isPlaying: data.is_playing,
          id: data.item.id
          // duration: data.item.duration_ms,
        },
      };
    })
    .catch((err) => {
      response = { status: Status.FAILURE, error: err };
    });
  return response;
};

// Helper method to respond to player requests
const trackCommand = async (params: any, method: string, path: string) => {
  let response = {};
  await request(method, path, params.accessToken)
    .then(() => { response = { status: Status.SUCCESS }; })
    .catch((err) => {
      response = { status: Status.FAILURE, error: err };
    });
  return response;
}

// Listen for spotify playback actions events
// - Note:
//  - should condition check endtime instead of signedIn?
chrome.runtime.onMessage.addListener((req, sender, res) => {
  chrome.storage.local.get(
    ["accessToken", "profileUrl", "signedIn"],
    (result: any) => {
      if (result.signedIn && result.accessToken) {
        let query: any;
        switch (req.message) {
          case PlayerActions.PLAY:
            trackCommand(result, "PUT", "/player/play").then((response) => {res(response)})
            break;
          case PlayerActions.PAUSE:
            trackCommand(result, "PUT", "/player/pause").then((response) => res(response));
            break;
          case PlayerActions.NEXT:
            trackCommand(result, "POST", "/player/next").then((response) => res(response));
            break;
          case PlayerActions.PREVIOUS:
            trackCommand(result, "POST", "/player/previous").then((response) => res(response));
            break;
          case PlayerActions.GET_PROFILE:
            getUserProfile(result).then((response) => res(response));
            break;
          case PlayerActions.GET_CURRENTLY_PLAYING:
            getCurrentlyPlaying(result).then((response) => res(response));
            break;
          case PlayerActions.SAVE_TRACK:
            query = new URLSearchParams({"ids": req.query});
            trackCommand(result, "PUT", "/tracks?"+ query.toString()).then((response) => res(response));
            break;
          case PlayerActions.REMOVE_SAVED_TRACK: 
            query = new URLSearchParams({"ids": req.query});
            trackCommand(result, "DELETE", "/tracks?"+ query.toString()).then((response) => res(response));
            break
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
