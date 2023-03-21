import { waitFor } from "@testing-library/react";
import { PlayerActions, Status } from "../src/Utils/SpotifyUtils";
import { ChromeData } from "../src/Utils/ChromeUtils";
import { generateChallenge, random } from "../src/Utils/AuthUtils";
import "@testing-library/jest-dom";

// Test Points
// - PlayerActions
//  - play, pause, next, previous, save track, remove track, set volume, seek position
//  - get currently playing
//  - sign in, sign out
// - clock alarm function
// - Note:
//  - need to mock spotify API calls to prevent multiple calls to API
//  - unable to get correct jest mock calls in Proimise then() statements
//   - solution: break up mock for chrome listener and user command

describe("Test background script", () => {
  const refresh_token_stub =
    "s4apH8Z4yj4NFazCzYU6dhKxXZTUnxEq6BKHmAwACPREAzAnKk";
  const expires_in_stub = 3600;
  const access_token_stub =
    "btu6egGeVdQM8nEANiDdDtCc7f68bzAHwiCntsVeJJdMPHqqqB";
  const backgroundScriptPath = "../src/background/background";

  beforeEach(() => {

    // Stub chrome api
    global.chrome.storage.data = {};
    global.chrome.storage.local.set = (inputs) => {
      for (const [key, value] of Object.entries(inputs)) {
        chrome.storage.data[key] = value;
      }
    };
    global.chrome.storage.local["get"] = (keys, callback) => {
      const map = {};
      for (let key of keys) {
        map[key] = chrome.storage.data[key];
      }
      return callback(map);
    };
  });

  afterEach(() => {
    jest.resetModules(); // Reset module imports
    jest.clearAllMocks();
  });

  // ----- SIGNIN TESTS -----

  // Note: Cannot simply check mockRes call since return value relies launchWebAuthFlow
  it("user sends request to sign in with valid credientials, chrome listener returns correct response", async () => {
    // Stub user request
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock chrome listener
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow = jest.fn();

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to sign in with valid credientials, returns success", async () => {
    // Stub user request
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Mock fetch request to Spotify API
    const updated_refresh_token_stub = "asdfhaweoksadfas"
    const updated_access_token_stub = "asdflkhasgdosdfDS"
    global.fetch = jest.fn()
      .mockImplementationOnce(
        (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            json: () =>
              new Promise((resolve, reject) =>
                resolve({
                  id: "stub-client-id",
                  refreshToken: refresh_token_stub, // Fake token
                  expiresIn: 0, // Stub to initiate set refresh token timer 
                  accessToken: access_token_stub, // Fake token
                })
              ),
          })
        )
      ).mockImplementation( // Mock focuses refresh token to occur
        (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            json: () =>
              new Promise((resolve, reject) =>
                resolve({
                  id: "client-id",
                  refresh_token: updated_refresh_token_stub, // Fake token
                  expires_in: expires_in_stub, // Stub to initiate set refresh token timer 
                  access_token: updated_access_token_stub, // Fake token
                })
              ),
          })
        )
      )

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });

    // Get result values from chrome storage
    let result;
    chrome.storage.local.get(
      [
        ChromeData.signedIn,
        ChromeData.refreshToken,
        ChromeData.expiresIn,
        ChromeData.accessToken,
        ChromeData.endTime,
      ],
      (res) => {
        result = {
          signedIn: res.signedIn,
          refreshToken: res.refreshToken,
          expiresIn: res.expiresIn,
          accessToken: res.accessToken,
          endTime: res.endTime,
        };
      }
    );

    // Wait for async get() call from chrome storage
    await waitFor(() => {
      expect(result.signedIn).toBe(true);
      expect(result.refreshToken).toBe(updated_refresh_token_stub);
      expect(result.expiresIn).toBe(expires_in_stub); // Original time should be assigned
      expect(result.accessToken).toBe(updated_access_token_stub);
      expect(result.endTime).not.toBeNull;
      expect(mockRes).toHaveBeenCalledWith({ status: Status.SUCCESS });
    });
  });

  it("user sends request to sign, chrome runtime error occurs, returns error", async () => {
    // Stub user request to signin
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock launchWebAuthFlow when user signs in
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub Chrome runtime error when user calls launchWebAuthFlow
    const message = "User did not approve access.";
    global.chrome.runtime.lastError = { message };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow functionality
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      error: { message },
    });

    // Used to set chrome runtime lastError as undefined
    delete global.chrome.runtime.lastError;
  });

  it("user sends request to sign, spotify API returns null response, returns error", async () => {
    // Stub user request to signin
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock launchWebAuthFlow functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = null;

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "User access denied.",
      },
    });
  });

  it("user sends request to sign, spotify API returns response with error param, returns error", async () => {
    // Stub user request to sign in
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock chrome addlistener call
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "error",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "User access denied.",
      },
    });
  });

  it("user sends request to sign, spotify API returns response with non-matching state param, returns error", async () => {
    // Stub user request to sign in
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock chrome addlistener call
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "error",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", "non-matching state");

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "User access denied.",
      },
    });
  });

  it("user sends request to sign, requesting access token call throws error, returns error", async () => {
    // Stub user sign in
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
    };

    // Mock user addlistener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Stub callback response data
    const stubQueryUrl = new URL("https://my-domain.com/callback?");
    stubQueryUrl.searchParams.append(
      "code",
      "gMGgmDs2YHPmPLaAJCUrHVqqaJPmHEX4QVQibeZViG6AMXta69"
    );
    stubQueryUrl.searchParams.append("state", stubState);

    // Mock launchWebAuthFlow
    global.chrome.identity.launchWebAuthFlow.mockImplementation(
      (obj, callback) => {
        callback(stubQueryUrl);
      }
    );

    // Mock fetch request to Spotify API
    const message = "Error fetching Spotify API";
    global.fetch = jest.fn(
      (url, obj) => new Promise((resolve, reject) => reject({ message }))
    );

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message,
      },
    });
  });

  it("user sends request to sign, but user already signed in, returns error", async () => {
    // Stub user request
    const stubState = encodeURIComponent(random(43));
    const stubReq = {
      message: PlayerActions.SIGNIN,
      data: {
        state: stubState,
        challenge: generateChallenge(),
      },
      signedIn: true,
    };

    // Mock addListener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    const signIn = require(backgroundScriptPath).signIn;
    await expect(signIn(stubReq)).resolves.toStrictEqual({
      status: Status.FAILURE,
      error: {
        message: "User already logged in.",
      },
    });
  });

  // ----- SIGNOUT TESTS -----

  // Note: Test does not need addListener path since does not use any async functions
  it("user sends request to sign out, chrome storage is cleared", async () => {
    // Set user status
    global.chrome.storage.local.set({
      signedIn: true,
    });

    // Stub user request
    const stubReq = {
      message: PlayerActions.SIGNOUT,
    };

    // Mock addListener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    await require(backgroundScriptPath);

    // Get result values from chrome storage
    let result;
    chrome.storage.local.get(
      [
        ChromeData.signedIn,
        ChromeData.refreshToken,
        ChromeData.expiresIn,
        ChromeData.accessToken,
        ChromeData.endTime,
      ],
      (res) => {
        result = {
          signedIn: res.signedIn,
          refreshToken: res.refreshToken,
          expiresIn: res.expiresIn,
          accessToken: res.accessToken,
          endTime: res.endTime,
        };
      }
    );

    // Wait for async get() call from chrome storage
    await waitFor(() => {
      expect(result.signedIn).toBe(false);
      expect(result.refreshToken).toBe("");
      expect(result.expiresIn).toBe("");
      expect(result.accessToken).toBe("");
      expect(result.endTime).toBe("");
      expect(mockRes).toHaveBeenCalledWith({ status: Status.SUCCESS });
    });
  });

  // ----- GET PROFILE TESTS -----
  it("user sends request to get profile, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_PROFILE,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  })

  it("user sends request to get profile, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_PROFILE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    const sampleProfileUrl = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=580&q=80"
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 200, // Stub success status
            json: () => new Promise((resolve, reject) => {
              resolve({
                images: [
                  {url: sampleProfileUrl}
                ]
              })
            })
          })
        )
    );

    const getUserProfile = require(backgroundScriptPath).getUserProfile;
    await expect(
      getUserProfile(stubReq)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        profileUrl: sampleProfileUrl
      }
    });
  })
  
  it("user sends request to get empty profile url, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_PROFILE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    const sampleProfileUrl = ""
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 200, // Stub success status
            json: () => new Promise((resolve, reject) => {
              resolve({
                images: [
                  {url: sampleProfileUrl}
                ]
              })
            })
          })
        )
    );

    const getUserProfile = require(backgroundScriptPath).getUserProfile;
    await expect(
      getUserProfile(stubReq)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        profileUrl: sampleProfileUrl
      }
    });
  })

  it("user sends request to get profile, bad OAuth request, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_PROFILE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const getUserProfile = require(backgroundScriptPath).getUserProfile;
    await expect(
      getUserProfile(stubReq)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
      error: {
        message: "Error occured when getting user profile."
      }
    });
  })

  it("user sends request to get profile, recieves unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_PROFILE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const getUserProfile = require(backgroundScriptPath).getUserProfile;
    await expect(
      getUserProfile(stubReq)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error occured when getting user profile."
      }
    });
  })

  // ----- GET CURRENTLY PLAYING TESTS -----

  it("user sends request to get currently playing track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to get currently playing track of type track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    const testTrackData = {
      currentlyPlayingType: "track",
      trackName: "Test track",
      artistName: "Test artist name",
      albumUrl:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      isPlaying: true,
      trackId: "150602439532405",
      deviceId: "23459849763234",
      volumePercent: "0",
      durationMs: "1000",
      progressMs: "0",
      isSaved: true,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve({
                    currently_playing_type: testTrackData.currentlyPlayingType,
                    is_playing: testTrackData.isPlaying,
                    device: {
                      id: testTrackData.deviceId,
                      volume_percent: testTrackData.volumePercent,
                    },
                    progress_ms: testTrackData.progressMs,
                    item: {
                      name: testTrackData.trackName,
                      artists: [{ name: testTrackData.artistName }],
                      album: { images: [{ url: testTrackData.albumUrl }] },
                      id: testTrackData.trackId,
                      duration_ms: testTrackData.durationMs,
                    },
                  })
                ),
            })
          )
      )
      .mockImplementation(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve([testTrackData.isSaved])
                ),
            })
          )
      );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        track: testTrackData.trackName,
        artist: testTrackData.artistName,
        albumUrl: testTrackData.albumUrl,
        isPlaying: testTrackData.isPlaying,
        isSaved: testTrackData.isSaved,
        id: testTrackData.trackId,
        deviceId: testTrackData.deviceId,
        volumePercent: testTrackData.volumePercent,
        durationMs: testTrackData.durationMs,
        progressMs: testTrackData.progressMs,
        type: "tracks",
      },
      error: {},
    });
  });

  it("user sends request to get currently playing track of type episode, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    const testEpisodeData = {
      currentlyPlayingType: "episode",
      trackName: "Test track",
      artistName: "Test artist name",
      albumUrl:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      isPlaying: true,
      trackId: "150602439532405",
      deviceId: "23459849763234",
      volumePercent: "0",
      durationMs: "1000",
      progressMs: "0",
      isSaved: true,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve({
                    currently_playing_type:
                      testEpisodeData.currentlyPlayingType,
                    is_playing: testEpisodeData.isPlaying,
                    device: {
                      id: testEpisodeData.deviceId,
                      volume_percent: testEpisodeData.volumePercent,
                    },
                    progress_ms: testEpisodeData.progressMs,
                    item: {
                      name: testEpisodeData.trackName,
                      show: {
                        publisher: testEpisodeData.artistName,
                      },
                      images: [{ url: testEpisodeData.albumUrl }],
                      id: testEpisodeData.trackId,
                      duration_ms: testEpisodeData.durationMs,
                      type: testEpisodeData.currentlyPlayingType,
                    },
                  })
                ),
            })
          )
      )
      .mockImplementation(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve([testEpisodeData.isSaved])
                ),
            })
          )
      );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        track: testEpisodeData.trackName,
        artist: testEpisodeData.artistName,
        albumUrl: testEpisodeData.albumUrl,
        isPlaying: testEpisodeData.isPlaying,
        id: testEpisodeData.trackId,
        deviceId: testEpisodeData.deviceId,
        volumePercent: testEpisodeData.volumePercent,
        isSaved: testEpisodeData.isSaved,
        durationMs: testEpisodeData.durationMs,
        progressMs: testEpisodeData.progressMs,
        type: "episodes",
      },
      error: {},
    });
  });
  it("user sends request to get currently playing track of type audiobook, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    const testEpisodeData = {
      currentlyPlayingType: "episode",
      trackName: "Test track",
      artistName: "Test artist name",
      albumUrl:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80",
      isPlaying: true,
      trackId: "150602439532405",
      deviceId: "23459849763234",
      volumePercent: "0",
      durationMs: "1000",
      progressMs: "0",
      isSaved: true,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve({
                    currently_playing_type:
                      testEpisodeData.currentlyPlayingType,
                    is_playing: testEpisodeData.isPlaying,
                    device: {
                      id: testEpisodeData.deviceId,
                      volume_percent: testEpisodeData.volumePercent,
                    },
                    progress_ms: testEpisodeData.progressMs,
                    item: {
                      name: testEpisodeData.trackName,
                      show: {
                        publisher: testEpisodeData.artistName,
                      },
                      images: [{ url: testEpisodeData.albumUrl }],
                      id: testEpisodeData.trackId,
                      duration_ms: testEpisodeData.durationMs,
                      type: "audiobooks",
                    },
                  })
                ),
            })
          )
      )
      .mockImplementation(
        (url, obj) =>
          new Promise((resolve, reject) =>
            resolve({
              status: 200, // Stub success status
              json: () =>
                new Promise((resolve, reject) =>
                  resolve([testEpisodeData.isSaved])
                ),
            })
          )
      );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        track: testEpisodeData.trackName,
        artist: testEpisodeData.artistName,
        albumUrl: testEpisodeData.albumUrl,
        isPlaying: testEpisodeData.isPlaying,
        id: testEpisodeData.trackId,
        deviceId: testEpisodeData.deviceId,
        volumePercent: testEpisodeData.volumePercent,
        isSaved: testEpisodeData.isSaved,
        durationMs: testEpisodeData.durationMs,
        progressMs: testEpisodeData.progressMs,
        type: "audiobooks",
      },
      error: {},
    });
  });

  it("user sends request to get currently playing track of type ad, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    const testAdData = {
      currentlyPlayingType: "ad",
      trackName: "ad",
      artistName: "",
      albumUrl: "",
      trackId: "",
      isPlaying: true,
      deviceId: "23459849763234",
      volumePercent: "0",
      isSaved: false,
      progressMs: "0",
      durationMs: 15 * 1000,
      type: "ad",
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementationOnce(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 200, // Stub success status
            json: () =>
              new Promise((resolve, reject) =>
                resolve({
                  currently_playing_type: testAdData.currentlyPlayingType,
                  is_playing: testAdData.isPlaying,
                  device: {
                    id: testAdData.deviceId,
                    volume_percent: testAdData.volumePercent,
                  },
                  progress_ms: testAdData.progressMs,
                })
              ),
          })
        )
    );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.SUCCESS,
      data: {
        track: testAdData.trackName,
        artist: testAdData.artistName,
        albumUrl: testAdData.albumUrl,
        isPlaying: testAdData.isPlaying,
        id: testAdData.trackId,
        deviceId: testAdData.deviceId,
        volumePercent: testAdData.volumePercent,
        isSaved: testAdData.isSaved,
        durationMs: testAdData.durationMs,
        progressMs: testAdData.progressMs,
        type: testAdData.type,
      },
      error: { message: "Ad is playing." },
    });
  });

  it("user sends request to get currently playing track of unknown track type, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    const testTrackData = {
      currentlyPlayingType: "unknown",
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementationOnce(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 200, // Stub success status
            json: () =>
              new Promise((resolve, reject) =>
                resolve({
                  currently_playing_type: testTrackData.currentlyPlayingType,
                })
              ),
          })
        )
    );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      data: {},
      error: {
        message: "Unknown currently playing type.",
      },
    });
  });

  it("user sends request to get currently playing track, but webplayer not open in browser, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementationOnce(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.FAILURE,
      data: {},
      error: {
        message: "Web player not open in browser.",
      },
    });
  });

  it("user sends request to get currently playing track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.GET_CURRENTLY_PLAYING,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    const getCurrentlyPlaying =
      require(backgroundScriptPath).getCurrentlyPlaying;

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementationOnce(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    await expect(getCurrentlyPlaying(stubReq)).resolves.toStrictEqual({
      status: Status.ERROR,
      data: {},
      error: {
        message: "Error occured when getting track data.",
      },
    });
  });

  // ----- TRACK COMMAND TESTS -----

  // PLAY TRACK tests
  it("user sends request to play track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PLAY,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to play track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PLAY,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/play", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to play track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PLAY,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/play", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to play track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PLAY,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/play", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // PAUSE TRACK tests
  it("user sends request to pause track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PAUSE,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to pause track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PAUSE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/pause", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to pause track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PAUSE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/pause", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to pause track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PAUSE,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "PUT", "/player/pause", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // NEXT TRACK tests
  it("user sends request to get next track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.NEXT,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to get next track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.NEXT,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/next", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to get next track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.NEXT,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/next", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to get next track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.NEXT,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/next", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // PREVIOUS TRACK tests
  it("user sends request to get previous track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PREVIOUS,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to get previous track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PREVIOUS,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/previous", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to get previous track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PREVIOUS,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/previous", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to get previous track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.PREVIOUS,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { additional_types: "episode" };
    await expect(
      trackCommand(stubReq, "POST", "/player/previous", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // SAVE TRACK tests
  it("user sends request to save track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SAVE_TRACK,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to save track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SAVE_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );


    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to save track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SAVE_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to save track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SAVE_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode"}
    await expect(
      trackCommand(stubReq, "PUT", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // REMOVE TRACK tests
  it("user sends request to remove track, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.REMOVE_SAVED_TRACK,
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to remove track, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.REMOVE_SAVED_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "DELETE", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });

  it("user sends request to remove track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.REMOVE_SAVED_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "DELETE", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to remove track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.REMOVE_SAVED_TRACK,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const stubQueryPath = {
      id: "track-id-stub",
      type: "tracks"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode"}
    await expect(
      trackCommand(stubReq, "DELETE", "/" + stubQueryPath.type, query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // SET VOLUME tests
  it("user sends request to set volume, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SET_VOLUME,
      query: { volumePercent: "100", deviceId: "" },
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to set volume, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SET_VOLUME,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const stubQueryPath = {
      volumePercent: "100",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/volume", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });
  
  it("user sends request to set volume, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SET_VOLUME,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const stubQueryPath = {
      volumePercent: "100",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/volume", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to set volume, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SET_VOLUME,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const stubQueryPath = {
      volumePercent: "100",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/volume", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  // SET TRACK POSITION tests
  it("user sends request to seek track position, chrome listener returns correct response", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SEEK_POSITION,
      query: { positionMs: "0", deviceId: "" },
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledTimes(1);
    });
  });

  it("user sends request to seek track position, returns success", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SEEK_POSITION,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 204, // Stub success status
          })
        )
    );

    const stubQueryPath = {
      positionMs: "0",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/seek", query)
    ).resolves.toStrictEqual({
      status: Status.SUCCESS,
    });
  });
  
  it("user sends request to seek track, but user is not spotify premium member, returns failure", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SEEK_POSITION,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 403, // Stub failure status
          })
        )
    );

    const stubQueryPath = {
      positionMs: "0",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/seek", query)
    ).resolves.toStrictEqual({
      status: Status.FAILURE,
    });
  });

  it("user sends request to seek track, but spotify API returns unknown status, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.SEEK_POSITION,
      accessToken: access_token_stub,
      refreshToken: refresh_token_stub,
      expiresIn: expires_in_stub,
    };

    // Mock fetch request to Spotify API
    global.fetch = jest.fn().mockImplementation(
      (url, obj) =>
        new Promise((resolve, reject) =>
          resolve({
            status: 401, // Stub error status
          })
        )
    );

    const stubQueryPath = {
      positionMs: "0",
      deviceId: "deviceId-stub"
    }
    const trackCommand = require(backgroundScriptPath).trackCommand;
    const query = { ids: stubQueryPath.id, additional_types: "episode" };

    await expect(
      trackCommand(stubReq, "PUT", "/player/seek", query)
    ).resolves.toStrictEqual({
      status: Status.ERROR,
      error: {
        message: "Error when completing track command.",
      },
    });
  });

  it("user requests unknown command, returns error", async () => {
    // Stub user request
    const stubReq = {
      message: PlayerActions.TESTING
    };

    // Mock chrome listener functionality
    const mockRes = jest.fn();
    global.chrome.runtime.onMessage = {
      addListener: jest.fn((callback) => {
        callback(stubReq, "sender", mockRes);
      }),
    };

    // Dynamic import of background script
    require(backgroundScriptPath);

    await waitFor(() => {
      expect(mockRes).toHaveBeenCalledWith({
        status: Status.ERROR,
        error: {
          message: "Unknown error occurred."
        }
      });
    });
  })

  // ----- ALARM TESTS -----
  it("alarm interval is set to seconds", () => {

    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {addListener: jest.fn()}
    }

    // Dynamic import of background script
    require(backgroundScriptPath)
    expect(global.chrome.alarms.create).toBeCalledWith({periodInMinutes: 1 / 60})
  });

  it("timer is not running and user send request to start timer, does not modify timer", async () => {

    // Stub chrome storage for timer values
    const isRunning = false;
    const hours = 5;
    const minutes = 30;
    const seconds = 23;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => {
          callback("test-alarm")
        }
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check if chrome storage was modified
    await waitFor(() => {
      expect(result.hours).toBe(hours)
      expect(result.minutes).toBe(minutes)
      expect(result.seconds).toBe(seconds)
      expect(result.isRunning).toBe(isRunning)
    })
  });

  it("timer counts down from 1 hours to only minutes and seconds", async () => {
    
    // Stub chrome storage to have pre-set time values
    const isRunning = true;
    const hours = 1;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(59)
      expect(result.seconds).toBe(59)
      expect(result.isRunning).toBe(isRunning)
    })
  });
    
  it("timer counts down from 1 minute to only seconds", async () => {

    // Stub chrome storage
    const isRunning = true;
    const hours = 0;
    const minutes = 1;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(59)
      expect(result.isRunning).toBe(isRunning)
    })
  });
  
  it("timer counts down from 55 second value", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 55;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Dynamic import background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome storage if values were decremented
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(54)
      expect(result.isRunning).toBe(isRunning)
    })
  });

  it("1 hour timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours: 1,
        minutes
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notifications 
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome notifications was called
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 hour(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });
  
  it("1 hour 1 minute timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours: 1,
        minutes: 1
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notification
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check chrome notifications was called upon
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 hour(s) and 1 minute(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });
 
  it("1 minute timer is done, timer sends notification to user", async () => {

    // Stub chrome storage for timer values
    const isRunning = true;
    const hours = 0;
    const minutes = 0;
    const seconds = 0;
    global.chrome.storage.local.set({
      isRunning,
      hours,
      minutes,
      seconds,
      setTime: {
        hours,
        minutes: 1
      }
    })
    
    // Mock chrome alarm
    global.chrome.alarms = {
      create: jest.fn((obj) => {}),
      onAlarm: {
        addListener: (callback) => callback("test-alarm")
      }
    }

    // Mock chrome notifications
    global.chrome.notifications = {
      create: jest.fn()
    }

    // Dynamic import of background script
    require(backgroundScriptPath)

    let result;
    global.chrome.storage.local.get([
        ChromeData.hours,
        ChromeData.minutes,
        ChromeData.seconds,
        ChromeData.isRunning
      ], (res) => {
        result = {
          hours: res.hours,
          minutes: res.minutes,
          seconds: res.seconds,
          isRunning: res.isRunning
      }
    })

    // Check if chrome notifications was called upon
    await waitFor(() => {
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.seconds).toBe(0)
      expect(result.isRunning).toBe(false)
      expect(global.chrome.notifications.create).toHaveBeenCalledWith({
        title: "Doro - Pomodoro with Spotify Player",
          message: "1 minute(s) timer complete.",
          type: "basic",
          iconUrl: "./img/doro_logo.png",
      })
    })
  });

});
