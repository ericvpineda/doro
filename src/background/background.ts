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
// - Note: must always get update user profile
const getUserProfile = async (params: any) => {
  let response = {};
  await request("GET", "", params.accessToken)
    .then((res) => res.json())
    .then((data) => {
      const profileUrl = data.images[0].url;
      response = { status: Status.SUCCESS, data: { profileUrl } };
      chrome.storage.local.set({ profileUrl: profileUrl });
    })
    .catch((err) => {
      response = {
        status: Status.FAILURE,
        error: {
          message: "Failure when getting user profile.",
          details: err,
        },
      };
    });
  return response;
};

// Used to currently playing track data
interface TrackData {
  id: string;
  track: string;
  artist: string;
  albumUrl: string;
  isPlaying: boolean;
  deviceId: string;
  volumePercent: number;
  progressMs: number;
  durationMs: number;
  isSaved: boolean;
}

// Helper method to get currenlty playing song
// - Note:
//  - Cant cache data since user could change song on different player
//  - TODO:
//    - add time scale bar to gui
//    - Limit length of album name and artist name (or add revolving style)
// - Question
//  -
const getCurrentlyPlaying = async (params: any) => {
  let response = {
    status: Status.NOT_SET,
    data: {},
    error: {},
  };
  let trackData: TrackData;
  const accessToken = params.accessToken;
  // Get track, artist, album image, isPlaying, and track id
  await request("GET", "/player", accessToken)
    .then((res) => res.json())
    .then((data) => {
      response.status = Status.SUCCESS;
      trackData = {
        track: data.item.name,
        artist: data.item.artists[0].name,
        albumUrl: data.item.album.images[0].url,
        isPlaying: data.is_playing,
        id: data.item.id,
        deviceId: data.device.id,
        volumePercent: data.device.volume_percent,
        isSaved: false,
        durationMs: data.item.duration_ms,
        progressMs: data.progress_ms
      };
      const query = new URLSearchParams({ ids: trackData.id });
      return request(
        "GET",
        "/tracks/contains?" + query.toString(),
        accessToken
      );
    })
    .then((res) => res.json())
    .then((data) => {
      trackData.isSaved = data[0];
      response.data = trackData;
    })
    .catch((err) => {
      response = {
        status: Status.FAILURE,
        data: {},
        error: { message: "Failure when getting track data.", details: err },
      };
    });
  return response;
};

// Helper method to respond to player requests
const trackCommand = async (params: any, method: string, path: string) => {
  let response = {};
  await request(method, path, params.accessToken)
    .then(() => {
      response = { status: Status.SUCCESS };
    })
    .catch((err) => {
      response = {
        status: Status.FAILURE,
        error: {
          message: "Failure when completing track command.",
          details: err,
        },
      };
    });
  return response;
};

// Listen for spotify playback actions events
// - Note:
//  - should condition check endtime instead of signedIn?
chrome.runtime.onMessage.addListener((req, sender, res) => {
  chrome.storage.local.get(["accessToken", "signedIn"], (result: any) => {
    if (result.signedIn && result.accessToken) {
      let query: any;
      switch (req.message) {
        case PlayerActions.PLAY:
          trackCommand(result, "PUT", "/player/play").then((response) => {
            res(response);
          });
          break;
        case PlayerActions.PAUSE:
          trackCommand(result, "PUT", "/player/pause").then((response) =>
            res(response)
          );
          break;
        case PlayerActions.NEXT:
          trackCommand(result, "POST", "/player/next").then((response) =>
            res(response)
          );
          break;
        case PlayerActions.PREVIOUS:
          trackCommand(result, "POST", "/player/previous").then((response) =>
            res(response)
          );
          break;
        case PlayerActions.GET_PROFILE:
          getUserProfile(result).then((response) => res(response));
          break;
        case PlayerActions.GET_CURRENTLY_PLAYING:
          getCurrentlyPlaying(result).then((response) => res(response));
          break;
        case PlayerActions.SAVE_TRACK:
          query = new URLSearchParams({ ids: req.query });
          trackCommand(result, "PUT", "/tracks?" + query.toString()).then(
            (response) => res(response)
          );
          break;
        case PlayerActions.REMOVE_SAVED_TRACK:
          query = new URLSearchParams({ ids: req.query });
          trackCommand(result, "DELETE", "/tracks?" + query.toString()).then(
            (response) => res(response)
          );
          break;
        case PlayerActions.SET_VOLUME:
          query = new URLSearchParams({
            volume_percent: req.query["volumePercent"],
            device_id: req.query["deviceId"],
          });
          trackCommand(
            result,
            "PUT",
            "/player/volume?" + query.toString()
          ).then((response) => res(response));
          break;
        case PlayerActions.SEEK_POSITION:
          query = new URLSearchParams({
            position_ms: req.query["positionMs"],
            device_id: req.query["deviceId"],
          });
          trackCommand(
            result,
            "PUT",
            "/player/seek?" + query.toString()
          ).then((response) => res(response));
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
  });
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
