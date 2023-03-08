import { PlayerActions, Status, SpotifyScope } from "../Utils/SpotifyUtils";

// REMOVE: Used to check if background script runs in console
// console.log("DEBUG: Running background script...");


// ----- User Authentication functions and objects -----

// Spotify scopes
const scopes = [
  SpotifyScope.userLibraryRead,
  SpotifyScope.userLibraryModify,
  SpotifyScope.userReadEmail,
  SpotifyScope.userReadCurrentlyPlaying,
  SpotifyScope.userReadPrivate,
  SpotifyScope.userModifyPlaybackState,
  SpotifyScope.userReadPlaybackState,
  SpotifyScope.userReadPlaybackPosition,
];

// Helper object for argument into authentication functions
const client = {
  id: encodeURIComponent("9b8675b2d72647fb9fdd3c06474cfde9"),
  scope: encodeURIComponent(scopes.join(" ")),
  uri: chrome.identity.getRedirectURL(),
  state: "",
  authCode: "",
  challenge: "",
  verifier: "",
  refreshToken: "",
  player: undefined,
};

// Build URL for request user authorization
const createAuthURL = (client: any): string => {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.append("response_type", "code");
  url.searchParams.append("code_challenge_method", "S256");
  url.searchParams.append("client_id", client.id);
  url.searchParams.append("scope", client.scope);
  url.searchParams.append("redirect_uri", client.uri);
  url.searchParams.append("state", client.state);
  url.searchParams.append("code_challenge", client.challenge);
  // url.searchParams.append("show_dialog", "true");
  return url.href;
};

// Exchange authorization code for access token
const requestAccessToken = async (client: any) => {
  const url = new URL("https://accounts.spotify.com/api/token");
  url.searchParams.append("grant_type", "authorization_code");
  url.searchParams.append("redirect_uri", client.uri);
  url.searchParams.append("client_id", client.id);
  url.searchParams.append("code", client.authCode);
  url.searchParams.append("code_verifier", client.verifier);
  const params = new URLSearchParams(url.search);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  // Post request to get access tokenx
  return await fetch(url.href, {
    method: "POST",
    headers,
    body: params.toString(),
  });
};

// Request to get refresh token
const requestRefreshToken = async (client: any) => {
  const url = new URL("https://accounts.spotify.com/api/token");
  url.searchParams.append("grant_type", "refresh_token");
  url.searchParams.append("refresh_token", client.refreshToken);
  url.searchParams.append("client_id", client.id);
  const params = new URLSearchParams(url.search);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  return await fetch(url.href, {
    method: "POST",
    headers,
    body: params.toString(),
  });
};

// Helper function to set user credentials
const setAccessTokenHandler = (data: any) => {
  chrome.storage.local.set({
    signedIn: true,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    accessToken: data.access_token,
    endTime: data.expires_in * 1000 + new Date().getTime(),
  });
};

// Sign user out of Spotify
const signOut = () => {
  chrome.storage.local.set({
    signedIn: false,
    refreshToken: "",
    expiresIn: "",
    accessToken: "",
    endTime: "",
  });
};

// Sets automatic refresh token call
const setRefreshTokenTimer = (data: any) => {
  const timeout = setInterval(() => {
    requestRefreshToken(client)
      .then((res) => res.json())
      .then((data) => setAccessTokenHandler(data))
      .catch(() => {
        signOut();
      });
  }, (data.expires_in - 60) * 1000);
  return () => clearInterval(timeout);
};

// Launch user auth flow
const userSignIn = async (params: any) => {
  if (params.signedIn === undefined || !params.signedIn) {
    const [challenge, verifier] = params.data.challenge;
    client.challenge = challenge;
    client.state = params.data.state;

    // Prompt user authorization
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: createAuthURL(client), interactive: true },
        (res) => {
          if (chrome.runtime.lastError) {
            resolve({
              status: Status.ERROR,
              message: chrome.runtime.lastError.message!,
            });
            return;
          }
          // Check if response url is valid
          if (res === null || res === undefined) {
            resolve({
              status: Status.ERROR,
              message: "User access denied.",
            });
            return;
          }
          // Note: URL allows get param after query variable
          const url = new URL(res!);
          if (
            url.searchParams.has("error") ||
            url.searchParams.get("state") !== client.state
          ) {
            resolve({
              status: Status.ERROR,
              message: "User access denied.",
            });
            return;
          }

          client.authCode = url.searchParams.get("code")!;
          client.verifier = verifier;
          requestAccessToken(client)
            .then((res) => res.json())
            .then((data) => {
              setAccessTokenHandler(data);
              setRefreshTokenTimer(data);
              resolve({
                status: Status.SUCCESS,
                error: "",
              });
            })
            .catch((err) => {
              signOut();
              return resolve({
                status: Status.ERROR,
                message: err.message,
              });
            });
        }
      );
    });
  } else {
    return new Promise((resolve, reject) => {
      return resolve({
        status: Status.FAILURE,
        message: "User already logged in.",
      });
    });
  }
};

// ----- Playback Actions -----

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
  let response = {}; // Used as return object from async fxn
  await request("GET", "", params.accessToken)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else if (res.status === 403) {
        throw { status: Status.FAILURE, message: "Bad OAuth request." };
      } else {
        throw { status: Status.FAILURE };
      }
    })
    .then((data) => {
      const profileUrl = (data.images.length > 0 && data.images[0].url) || "";
      response = { status: Status.SUCCESS, data: { profileUrl } };
    })
    .catch((err) => {
      response = {
        status: err.status || Status.ERROR,
        error: {
          message: err.message || "Error occured when getting user profile.",
        },
      };
    });
  return response;
};

// Used to currently playing item data
interface ItemData {
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
  type: string;
}

// Helper method to get currenlty playing song
const getCurrentlyPlaying = async (params: any) => {
  let response = {
    status: Status.NOT_SET,
    data: {},
    error: {},
  };
  let itemData: ItemData;
  const accessToken = params.accessToken;
  // Get track, artist, album image, isPlaying, and track id
  const query = new URLSearchParams({ additional_types: "episode" });
  await request("GET", "/player?" + query.toString(), accessToken)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else if (res.status === 204) {
        throw {
          status: Status.FAILURE,
          message: "Web player not open in browser.",
        };
      } else {
        throw { status: Status.ERROR };
      }
    })
    .then((data) => {
      response.status = Status.SUCCESS;
      // Case: Currently playing item is track
      if (data.currently_playing_type === "track") {
        itemData = {
          track: data.item.name,
          artist: data.item.artists[0].name,
          albumUrl: data.item.album.images[0].url,
          isPlaying: data.is_playing,
          id: data.item.id,
          deviceId: data.device.id,
          volumePercent: data.device.volume_percent,
          isSaved: false,
          durationMs: data.item.duration_ms,
          progressMs: data.progress_ms,
          type: "tracks",
        };
        // Case: Currently playing item is episode (audio and/or video)
      } else if (data.currently_playing_type === "episode") {
        itemData = {
          track: data.item.name,
          artist: data.item.show.publisher,
          albumUrl: data.item.images[0].url,
          isPlaying: data.is_playing,
          id: data.item.id,
          deviceId: data.device.id,
          volumePercent: data.device.volume_percent,
          isSaved: false,
          durationMs: data.item.duration_ms,
          progressMs: data.progress_ms,
          // Note: Current types are ["episode", "mixed", "Ad"]
          type: data.item.type === "episode" ? "episodes" : "audiobooks",
        };
      } else if (data.currently_playing_type === "ad") {
        itemData = {
          track: "ad",
          artist: "",
          albumUrl: "",
          id: "",
          isPlaying: data.is_playing,
          deviceId: data.device.id,
          volumePercent: data.device.volume_percent,
          isSaved: false,
          durationMs: 15 * 1000, // Will get re-queried in intervals of 5 seconds
          progressMs: data.progress_ms,
          type: "ad",
        };
        // Note: need "loophole" so ad status path does not get queried futher
        throw {
          status: Status.SUCCESS,
          data: itemData,
          message: "Ad is playing.",
        };
      } else {
        throw { message: "Unknown item type." };
      }
      // Assign item data to responses
      response.data = itemData;

      // Get saved item data
      const query = new URLSearchParams({ ids: itemData.id });
      return request(
        "GET",
        `/${itemData.type}/contains?` + query.toString(),
        accessToken
      );
    })
    .then((res) => res.json())
    .then((saveData) => {
      // Assigned is saved data to item
      itemData.isSaved = saveData[0];
      response.data = itemData;
    })
    .catch((err) => {
      response = {
        status: err.status || Status.ERROR,
        data: err.data || {},
        error: {
          message: err.message || "Error occured when getting track data.",
        },
      };
    });
  return response;
};

// Helper method to respond to player requests
const trackCommand = async (
  params: any,
  method: string,
  path: string,
  query: { [key: string]: string } = {}
) => {
  let response = {};
  // Allows for episode type audio
  path = path + "?" + new URLSearchParams(query).toString();
  await request(method, path, params.accessToken)
    .then((res) => {
      // Note: Will return 204 for track command success 
      if (res.status === 200 || res.status === 204) {
        response = { status: Status.SUCCESS };
      } else if (res.status === 403) {
        // Note: User is does not have premium account error
        response = { status: Status.FAILURE };
      } else {
        throw {status: Status.ERROR}
      }
    })
    .catch((err) => {
      response = {
        status: err.status || Status.ERROR,
        error: {
          message: err.message || "Error when completing track command.",
        },
      };
    });
  return response;
};

// Listen for spotify playback actions events
chrome.runtime.onMessage.addListener((req, sender, res) => {
  chrome.storage.local.get(["accessToken", "signedIn"], (result: any) => {
    let query: any;
    switch (req.message) {
      case PlayerActions.PLAY:
        query = { additional_types: "episode" };
        trackCommand(result, "PUT", "/player/play", query).then((response) => {
          res(response);
        });
        break;
      case PlayerActions.PAUSE:
        query = { additional_types: "episode" };
        trackCommand(result, "PUT", "/player/pause", query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.NEXT:
        query = { additional_types: "episode" };
        trackCommand(result, "POST", "/player/next", query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.PREVIOUS:
        query = { additional_types: "episode" };
        trackCommand(result, "POST", "/player/previous", query).then(
          (response) => res(response)
        );
        break;
      case PlayerActions.SAVE_TRACK:
        query = { ids: req.query, additional_types: "episode" };
        trackCommand(result, "PUT", "/" + req.type, query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.REMOVE_SAVED_TRACK:
        query = { ids: req.query, additional_types: "episode" };
        trackCommand(result, "DELETE", "/" + req.type, query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.SET_VOLUME:
        query = {
          volume_percent: req.query["volumePercent"],
          device_id: req.query["deviceId"],
          additional_types: "episode",
        };
        trackCommand(result, "PUT", "/player/volume", query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.SEEK_POSITION:
        query = {
          position_ms: req.query["positionMs"],
          device_id: req.query["deviceId"],
          additional_types: "episode",
        };
        trackCommand(result, "PUT", "/player/seek", query).then((response) =>
          res(response)
        );
        break;
      case PlayerActions.SIGNOUT:
        signOut();
        res({ status: Status.SUCCESS });
        break;
      case PlayerActions.SIGNIN:
        result.data = req.data;
        userSignIn(result).then((response) => res(response));
        break;
      case PlayerActions.GET_PROFILE:
        getUserProfile(result).then((response) => res(response));
        break;
      case PlayerActions.GET_CURRENTLY_PLAYING:
        getCurrentlyPlaying(result).then((response) => res(response));
        break;
      default:
        res({
          status: Status.ERROR,
          error: "Unknown error occurred.",
        });
        break;
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
        const message =
          res.setTime.hours === 0
            ? `${res.setTime.minutes} minute timer complete.`
            : `${res.setTime.hours} hour and ${res.setTime.minutes} minute timer complete.`;
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
