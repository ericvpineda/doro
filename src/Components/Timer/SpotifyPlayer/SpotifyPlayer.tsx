import React, { FC, useState, useEffect, useMemo } from "react";
import styles from "./SpotifyPlayer.module.css";
import Stack from "@mui/material/Stack";
import VolumeDownIcon from "@material-ui/icons/VolumeDown";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import VolumeOffIcon from "@material-ui/icons/VolumeOff";
import debounce from "lodash.debounce";
import { Box, Grid, Slider, IconButton } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
// Note: do not export this from utils module
import { createTheme } from "@material-ui/core/styles";
import {
  PlayerActions,
  Status,
  createTrackTime,
  getThumbPosition,
  PlayerStatus,
} from "../../../Utils/SpotifyUtils";
import {
  PlayFill,
  SkipEndFill,
  SkipStartFill,
  PauseFill,
  Heart,
  HeartFill,
  HeartHalf,
} from "react-bootstrap-icons";
import AlbumArt from "./AlbumArt/AlbumArt";

// Player component that interacts with Spotify APi
const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState(""); // Artist name
  const [track, setTrack] = useState(""); // Track name
  const [albumUrl, setAlbumUrl] = useState(""); // Spotify album url
  const [isPlaying, setIsPlaying] = useState(false); // Track currently playing
  const [trackId, setTrackId] = useState(""); // Current track id
  const [trackSaved, setTrackSaved] = useState(false); // Track currently saved
  const [volume, setVolume] = useState(0); // Volume value
  const [deviceId, setDeviceId] = useState(""); // Web player device id
  const [volumeCached, setVolumeCached] = useState(volume); // Helps with common volume icon press behavior
  const [showVolumeTrack, setShowVolumeTrack] = useState(false); // Shows volume track
  const [durationMs, setDurationMs] = useState(0); // Tracks total duration
  const [progressMs, setProgressMs] = useState(0); // Tracks current progress
  const [thumbPosition, setThumbPosition] = useState(0); // Tracks current thumb position
  const [playerStatus, setPlayerStatus] = useState(PlayerStatus.LOADING); // Players current state
  const [isMounted, setIsMounted] = useState(false); // Used for volume animation
  const [trackType, setTrackType] = useState("");

  // Plan: Use chrome script inject to submit spotify commands
  // - get tab id of chrome tab with spotify open
  // - for each command, create separate injection script
  //  - have helper function that will be injected into tab

  // Note: Use later when spotify tab is removed
  // chrome.tabs.query({lastFocusedWindow: true}, tabs => {
  //   console.log(tabs)
  //   tabs.forEach(tab => {
  //     console.log(tab.url)
  //     const re = new RegExp("^https:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.spotify.com");
  //     if (tab.url != null ) {
  //       console.log(re.test(tab.url))
  //     }
  //   })
  // })

  // request("PUT", "/player/pause", accessToken).catch((e) => console.log(e));
  // Note: used for html manipulation (script injection)
  // chrome.storage.local.get(["tabId"], (res) => {
  // })

  // Get initial track data upon loading page
  const getTrack = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.GET_CURRENTLY_PLAYING },
      (res) => {
        // Note: Will return success on tracks and advertisements
        console.log("Getting new track data", res);
        if (res !== undefined && res.status === Status.SUCCESS) {
          setTrack(res.data.track);
          const bufferTrail = res.data.artist.length > 30 ? "..." : "";
          setArtist(res.data.artist.substring(0, 30) + bufferTrail);
          setAlbumUrl(res.data.albumUrl);
          setIsPlaying(res.data.isPlaying);
          setTrackId(res.data.id);
          setTrackSaved(res.data.isSaved);
          setDeviceId(res.data.deviceId);
          setVolume(res.data.volumePercent);
          setProgressMs(res.data.progressMs);
          setDurationMs(res.data.durationMs);
          const progress = res.data.progressMs;
          const duration = res.data.durationMs;
          setProgressMs(progress + 500);
          setDurationMs(duration);
          setThumbPosition(getThumbPosition(progress, duration));
          const status =
            res.data.type === "ad"
              ? PlayerStatus.AD_PLAYING
              : PlayerStatus.SUCCESS;
          setPlayerStatus(status);
          setTrackType(res.data.type);
        } else if (res.status === Status.FAILURE) {
          // Case: User did not complete requirement prompt
          console.log(res.message);
          setThumbPosition(-1);
          setPlayerStatus(PlayerStatus.REQUIRE_WEBPAGE);
        } else if (res.status === Status.ERROR) {
          // TODO: Sign user out when error occurs?
          console.log(res.message);
          setThumbPosition(-1);
          setPlayerStatus(PlayerStatus.REQUIRE_WEBPAGE);
        } else {
          // Note: Automatic signout when unknown status received
          chrome.runtime.sendMessage({ message: PlayerActions.SIGNOUT });
          console.log("Unknown error when getting track data.");
        }
      }
    );
  };

  // On popup open, get track data
  useEffect(() => getTrack(), []);

  // Note: will run sequential to previous useEffect
  useEffect(() => {
    if ((validPlayerStatus() || adPlayerStatus()) && thumbPosition >= 0) {
      const updateTime = setInterval(() => {
        if (isPlaying) {
          const updatedProgress = progressMs + 1000;
          setProgressMs(updatedProgress);
          const updatedPosition = getThumbPosition(updatedProgress, durationMs);
          setThumbPosition(updatedPosition);
          if (validPlayerStatus() && updatedProgress >= durationMs - 3000) {
            getTrack();
          }
        }
      }, 1000);
      return () => clearInterval(updateTime);
    }
  }, [thumbPosition, progressMs, durationMs, isPlaying, playerStatus]);

  const re = new RegExp("^https://[-a-zA-Z0-9@:%._+~#=]{1,256}.spotify.com");

  const injectTrackPlayPause = () => {
    const pauseBtn = document.querySelector(
      "[data-testid=control-button-playpause]"
    ) as HTMLButtonElement;
    let isClicked = false;
    pauseBtn.addEventListener("click", () => (isClicked = true));
    pauseBtn.click();
    return isClicked;
  };

  const injectTrackNext = () => {
    const nextTrackBtn = document.querySelector(
      "[data-testid=control-button-skip-forward]"
    ) as HTMLButtonElement;
    let isClicked = false;
    nextTrackBtn.addEventListener("click", () => (isClicked = true));
    nextTrackBtn.click();
    return isClicked;
  };

  const injectTrackPrevious = () => {
    const prevTrackBtn = document.querySelector(
      "[data-testid=control-button-skip-back]"
    ) as HTMLButtonElement;
    let isClicked = false;
    prevTrackBtn.addEventListener("click", () => (isClicked = true));
    prevTrackBtn.click();
    return isClicked;
  };

  const injectChangeVolume = () => {
    let result = false;
    chrome.storage.local.get(["volume"], (res) => {
      // Container parent
      const volumeBarContainer = document.querySelector(
        "[data-testid=volume-bar]"
      ) as HTMLDivElement;
      // Get volume bar element
      const volumeBar = volumeBarContainer.querySelector(
        "input"
      ) as HTMLInputElement;
      // Note: data-testid progress-bar is also id of seek track bar
      const progressBarContainer = volumeBarContainer.querySelector(
        "[data-testid=progress-bar]"
      ) as HTMLDivElement;

      if (
        volumeBarContainer === undefined ||
        volumeBar === undefined ||
        progressBarContainer === undefined
      ) {
        return;
      }

      volumeBar.setAttribute("value", res.volume);
      // Note: Uses CSSDeclaration styles
      progressBarContainer.style.setProperty(
        "--progress-bar-transform",
        `${res.volume}%`
      );
      result = true;
    });
    return result;
  };

  const trackInjection = (commandFxn: () => boolean) => {
    return new Promise((resolve, _) => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.url && re.test(tab.url) && tab.id) {
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                func: commandFxn,
              })
              .then((injectedResults) => {
                if (injectedResults.length > 0 && injectedResults[0].result) {
                  resolve({ data: true });
                } else {
                  resolve({ data: false });
                }
              })
              .catch(() => resolve({ data: false }));
          }
        });
      });
    });
  };

  // Pause current track
  const trackPause = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.PAUSE }, (res) => {
      if (res.status === Status.SUCCESS) {
        setIsPlaying(false);
      } else if (res.status === Status.FAILURE) {
        trackInjection(injectTrackPlayPause).then((res: any) =>
          setIsPlaying(!res.data)
        );
      } else {
        console.log("Unknown error when pausing track.");
      }
    });
  };

  // Play current track
  const trackPlay = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.PLAY }, (res) => {
      if (res.status === Status.SUCCESS) {
        setIsPlaying(true);
      } else if (res.status === Status.FAILURE) {
        trackInjection(injectTrackPlayPause).then((res: any) =>
          setIsPlaying(res.data)
        );
      } else {
        console.log("Unknown error when playing track.");
      }
    });
  };

  // Get players next track
  const trackNext = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.NEXT }, async (res) => {
      if (res.status === Status.SUCCESS) {
        getTrack(); // Update track information state
      } else if (res.status === Status.FAILURE) {
        let success = false;
        // Note: cannot run state updating function in then() function
        await trackInjection(injectTrackNext).then(
          (res: any) => (success = res.data)
        );
        if (success) {
          setTimeout(() => {
            getTrack();
          }, 200);
        }
      } else {
        console.log("Unknown error when getting next track.");
      }
    });
  };

  // Get players previous track
  const trackPrevious = () => {
    if (thumbPosition > 0) {
      thumbSeekChangeCommitted(0);
      thumbSeekUI(0);
    } else {
      chrome.runtime.sendMessage(
        { message: PlayerActions.PREVIOUS },
        async (res) => {
          if (res.status === Status.SUCCESS) {
            getTrack();
          } else if (res.status === Status.FAILURE) {
            let success = false;
            await trackInjection(injectTrackPrevious).then(
              (res: any) => (success = res.data)
            );
            if (success) {
              setTimeout(() => {
                getTrack();
              }, 200);
            }
          } else {
            console.log("Unknown error when getting previous track.");
          }
        }
      );
    }
  };

  // Save track to user LIKED playlist
  const trackSave = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.SAVE_TRACK, query: trackId, type: trackType },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setTrackSaved(true);
        } else if (res.status === Status.FAILURE) {
          console.log(res.message);
        } else {
          console.log("Unknown error when saving track.");
        }
      }
    );
  };

  // Remove track from user LIKED playlist
  const trackRemoveSaved = () => {
    chrome.runtime.sendMessage(
      {
        message: PlayerActions.REMOVE_SAVED_TRACK,
        query: trackId,
        type: trackType,
      },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setTrackSaved(false);
        } else if (res.status === Status.FAILURE) {
          console.log(res.message);
        } else {
          console.log("Unknown error when removing user track.");
        }
      }
    );
  };

  // Show saved/unsaved track information
  const showHeart = () => {
    if (playerStatus === PlayerStatus.SUCCESS && trackSaved) {
      return (
        <IconButton onClick={trackRemoveSaved} data-testid="remove-track-btn">
          <HeartFill
            className={styles.playerControlIcons}
            size={18}
          ></HeartFill>
        </IconButton>
      );
    } else if (playerStatus === PlayerStatus.SUCCESS) {
      return (
        <IconButton onClick={trackSave} data-testid="save-track-btn">
          <Heart className={styles.playerControlIcons} size={18}></Heart>
        </IconButton>
      );
    } else {
      return (
        <IconButton disabled>
          <HeartHalf
            className={styles.playerControlIcons}
            size={18}
          ></HeartHalf>
        </IconButton>
      );
    }
  };

  // State function for change volume UI
  const volumeChangeUI = (value: any) => {
    setVolume(value);
  };

  // Show volume control when mouse hover over volume icon
  // - note: only this function re-rendered, does not make getTrack() request
  const debounceVolumeHandler = useMemo(() => debounce(volumeChangeUI, 25), []);

  // Get volume value after mouse-up from mouse click
  const trackVolumeChangeCommitted = (volumePercent: any) => {
    chrome.runtime.sendMessage(
      {
        message: PlayerActions.SET_VOLUME,
        query: { volumePercent, deviceId },
      },
      async (res) => {
        if (res.status === Status.SUCCESS) {
          if (volume !== 0) {
            setVolumeCached(volume);
          }
        } else if (res.status === Status.FAILURE) {
          chrome.storage.local.set({ volume: volumePercent });
          let success = false;
          await trackInjection(injectChangeVolume).then(
            (res: any) => (success = res.data)
          );
          if (success && volume !== 0) {
            setVolumeCached(volume);
          }
        } else {
          console.log("Unknown error when setting track volume.");
        }
      }
    );
  };

  // Mimic common volume press behavior
  const muteVolumeHandler = () => {
    if (volume > 0) {
      setVolume(0);
      setVolumeCached(volume);
      trackVolumeChangeCommitted(0);
    } else {
      setVolume(volumeCached);
      trackVolumeChangeCommitted(volumeCached);
      setVolumeCached(0);
    }
  };

  // Get volume icon based on volume value
  const getVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeOffIcon className={styles.playerControlIcons} />;
    } else if (volume < 50) {
      return <VolumeDownIcon className={styles.playerControlIcons} />;
    } else {
      return <VolumeUpIcon className={styles.playerControlIcons} />;
    }
  };

  // Shows volume icon on mouse hover
  const onVolumeEnterHandler = () => {
    if (playerStatus === PlayerStatus.SUCCESS) {
      setIsMounted(true);
      setShowVolumeTrack(true);
    }
  };

  // Removes volume icon on mouse leave
  const onVolumeLeaveHandler = () => {
    if (playerStatus === PlayerStatus.SUCCESS) {
      setIsMounted(false);
    }
  };

  // Theme for volume slider
  const muiTheme = createTheme({
    overrides: {
      MuiSlider: {
        thumb: {
          color: "green",
        },
        track: {
          color: "green",
        },
        rail: {
          color: "black",
        },
      },
    },
  });

  // Sets thumb gui position reactively
  const thumbSeekUI = (value: any) => {
    setThumbPosition(value);
  };

  // Prevent multiple renders for seeking thumb position
  const debounceThumbSeekHandler = useMemo(() => debounce(thumbSeekUI, 25), []);

  // Sets thumb position value after mouse up event on thumb icon
  const thumbSeekChangeCommitted = (percent: any) => {
    const positionMs = Math.floor(durationMs * (percent * 0.01));
    chrome.runtime.sendMessage(
      {
        message: PlayerActions.SEEK_POSITION,
        query: { positionMs, deviceId },
      },
      (res) => {
        if (res.status === Status.SUCCESS) {
          const updatedProgressMs = positionMs;
          setProgressMs(updatedProgressMs);
          const updatedThumbPos = getThumbPosition(
            updatedProgressMs,
            durationMs
          );
          setThumbPosition(updatedThumbPos);
        } else if (res.status === Status.FAILURE) {
          console.log(res.message);
        } else {
          console.log("Unknown error when seeking track volume.");
        }
      }
    );
  };

  const validPlayerStatus = () => {
    return playerStatus === PlayerStatus.SUCCESS;
  };

  const adPlayerStatus = () => {
    return playerStatus === PlayerStatus.AD_PLAYING;
  };

  return (
    <div className={styles.playerContainer} id="player-container">
      <AlbumArt playerStatus={playerStatus} albumUrl={albumUrl}></AlbumArt>
      {PlayerStatus.SUCCESS === playerStatus && (
        <div className={styles.trackTextContainer}>
          <div className={styles.trackTitleContainer}>
            <div className={styles.trackTitle}>{track}</div>
          </div>
          <div className={styles.trackArtist}>{artist}</div>
        </div>
      )}
      <div className={styles.playerControls}>
        <Box width={100} />
        {showHeart()}
        <IconButton
          disabled={!validPlayerStatus()}
          onClick={trackPrevious}
          data-testid="previous-track-btn"
        >
          <SkipStartFill
            className={styles.playerControlIcons}
            size={20}
          ></SkipStartFill>
        </IconButton>
        {!isPlaying ? (
          <IconButton
            disabled={!validPlayerStatus()}
            onClick={trackPlay}
            data-testid="play-btn"
          >
            <PlayFill
              className={styles.playerControlIcons}
              size={30}
            ></PlayFill>
          </IconButton>
        ) : (
          <IconButton
            disabled={!validPlayerStatus()}
            onClick={trackPause}
            data-testid="pause-btn"
          >
            <PauseFill
              className={styles.playerControlIcons}
              size={30}
            ></PauseFill>
          </IconButton>
        )}
        <IconButton
          disabled={!validPlayerStatus()}
          onClick={trackNext}
          data-testid="next-track-btn"
        >
          <SkipEndFill
            className={styles.playerControlIcons}
            size={20}
          ></SkipEndFill>
        </IconButton>
        <Box width={130}>
          <Stack>
            <Grid item className={styles.volumeSlider}>
              {showVolumeTrack && (
                <ThemeProvider theme={muiTheme}>
                  <Slider
                    data-testid="volume-slider"
                    className={
                      isMounted ? styles.volumeMount : styles.volumeUnmount
                    }
                    onAnimationEnd={() => {
                      if (!isMounted) setShowVolumeTrack(false);
                    }}
                    value={volume}
                    orientation="vertical"
                    onChange={(_, val) => debounceVolumeHandler(val)}
                    onChangeCommitted={(_, val) =>
                      trackVolumeChangeCommitted(val)
                    }
                    onMouseEnter={onVolumeEnterHandler}
                    onMouseLeave={onVolumeLeaveHandler}
                  ></Slider>
                </ThemeProvider>
              )}
            </Grid>
            <Grid item>
              <IconButton
                data-testid="volume-btn"
                onMouseEnter={onVolumeEnterHandler}
                onMouseLeave={onVolumeLeaveHandler}
                onClick={muteVolumeHandler}
                disabled={!validPlayerStatus()}
              >
                {getVolumeIcon()}
              </IconButton>
            </Grid>
          </Stack>
        </Box>
      </div>
      <div className={styles.playerTrackSlider}>
        {(validPlayerStatus() || adPlayerStatus()) && (
          <Box width={225}>
            <Grid container spacing={1} alignItems="center">
              <Grid item className={styles.playerSeekTime + " me-2"}>
                {createTrackTime(progressMs)}
              </Grid>
              <Grid item xs>
                <ThemeProvider theme={muiTheme}>
                  <Slider
                    disabled={adPlayerStatus()}
                    data-testid="seek-position-slider"
                    value={adPlayerStatus() ? 0 : thumbPosition}
                    onChange={(_, val) => debounceThumbSeekHandler(val)}
                    onChangeCommitted={(_, val) =>
                      thumbSeekChangeCommitted(val)
                    }
                  ></Slider>
                </ThemeProvider>
              </Grid>
              <Grid item className={styles.playerSeekTime + " ms-2"}>
                {validPlayerStatus() ? createTrackTime(durationMs) : "--:--"}
              </Grid>
            </Grid>
          </Box>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer;
