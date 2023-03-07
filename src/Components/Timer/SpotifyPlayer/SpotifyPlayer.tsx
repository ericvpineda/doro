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
import { ChromeData } from "../../../Utils/ChromeUtils";

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
          // Case: User did not complete webpage requirement prompt
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
    if (successOrAdPlayerStatus() && thumbPosition >= 0) {
      const updateTime = setInterval(() => {
        if (isPlaying) {
          const updatedProgress = progressMs + 1000;
          setProgressMs(updatedProgress);
          const updatedPosition = getThumbPosition(updatedProgress, durationMs);
          setThumbPosition(updatedPosition);
          // FIX: will re-render every second
          if (updatedProgress >= durationMs - 3000) {
            getTrack();
          }
        }
      }, 1000);
      return () => clearInterval(updateTime);
    }
  }, [thumbPosition, progressMs, durationMs, isPlaying, playerStatus]);

  const re = new RegExp("^https://[-a-zA-Z0-9@:%._+~#=]{1,256}.spotify.com");

  // Inject script for play and pause (Non-premium users)
  const injectTrackPlayPause = () => {
    const pauseBtn = document.querySelector(
      "[data-testid=control-button-playpause]"
    ) as HTMLButtonElement;
    pauseBtn.addEventListener("click", () =>
      chrome.storage.local.set({ scriptSuccess: true })
    );
    pauseBtn.click();
  };

  // Inject script for next track (Non-premium users)
  const injectTrackNext = () => {
    const nextTrackBtn = document.querySelector(
      "[data-testid=control-button-skip-forward]"
    ) as HTMLButtonElement;
    nextTrackBtn.addEventListener("click", () =>
      chrome.storage.local.set({ scriptSuccess: true })
    );
    nextTrackBtn.click();
  };

  // Inject script for previous track (Non-premium users)
  const injectTrackPrevious = () => {
    const prevTrackBtn = document.querySelector(
      "[data-testid=control-button-skip-back]"
    ) as HTMLButtonElement;
    prevTrackBtn.addEventListener("click", () =>
      chrome.storage.local.set({ scriptSuccess: true })
    );
    prevTrackBtn.click();
  };

  // Inject script for change volume (Non-premium users)
  // - Note: 
  //  - cannot return promise since chrome.executescript only support jsonifiable objects
  //  - cannot access ChromeData since not injected
  const injectChangeVolume = () => {
    chrome.storage.local.get(["volume"], (res) => {
      // Container parent
      const volumeBarContainer = document.querySelector(
        "[data-testid=volume-bar]"
      ) as HTMLDivElement;

      // Note: data-testid progress-bar is also id of seek track bar
      const progressBar = volumeBarContainer.querySelector(
        "[data-testid=progress-bar]"
      ) as HTMLDivElement;

      if (volumeBarContainer && progressBar) {
        const volumeInt = res.volume;

        const mousedown = new MouseEvent("mousedown", {
          clientX: progressBar.getBoundingClientRect().left,
          bubbles: true,
          cancelable: true,
        });
        // Simulate drag mouse from left to right
        const mousemove = new MouseEvent("mousemove", {
          clientX: progressBar.getBoundingClientRect().left + volumeInt,
          bubbles: true,
          cancelable: true,
        });
        const mouseup = new MouseEvent("mouseup", {
          clientX: progressBar.getBoundingClientRect().left + volumeInt,
          bubbles: true,
          cancelable: true,
        });

        progressBar.dispatchEvent(mousedown);
        progressBar.dispatchEvent(mousemove);
        progressBar.dispatchEvent(mouseup);
        chrome.storage.local.set({ scriptSuccess: true });
      }
    });
  };

  // Inject script for seeking track (Non-premium users)
  const injectSeekTrack = () => {
    chrome.storage.local.get(["percent"], (res) => {
      // Container parent
      const playbackContainer = document.querySelector(
        "[data-testid=playback-progressbar]"
      ) as HTMLDivElement;
      // Note: data-testid progress-bar is also id of seek track bar
      const progressBar = playbackContainer.querySelector(
        "[data-testid=progress-bar]"
      ) as HTMLDivElement;

      if (playbackContainer && progressBar) {
        const percent = res.percent / 100;
        const totalLength =
          progressBar.getBoundingClientRect().right -
          progressBar.getBoundingClientRect().left;
        const length = totalLength * percent;

        const mousedown = new MouseEvent("mousedown", {
          clientX: progressBar.getBoundingClientRect().left,
          bubbles: true,
          cancelable: true,
        });
        // Simulate drag mouse from left to right
        const mousemove = new MouseEvent("mousemove", {
          clientX: progressBar.getBoundingClientRect().left + length,
          bubbles: true,
          cancelable: true,
        });
        const mouseup = new MouseEvent("mouseup", {
          clientX: progressBar.getBoundingClientRect().left + length,
          bubbles: true,
          cancelable: true,
        });

        progressBar.dispatchEvent(mousedown);
        progressBar.dispatchEvent(mousemove);
        progressBar.dispatchEvent(mouseup);
        chrome.storage.local.set({ scriptSuccess: true });
      }
    });
  };

  // Helper function to execute chrome injection scripts
  const trackInjection = (commandFxn: () => void) => {
    return new Promise((resolve, _) => {
      chrome.tabs.query({}, (tabs) => {
        // Search for tab with spotify using regex pattern
        tabs.forEach((tab) => {
          if (tab.url && re.test(tab.url) && tab.id) {
            // Set/reset script result boolean in chrome storage 
            chrome.storage.local.set({ scriptSuccess: false });
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                func: commandFxn,
              })
              .then(() => {
                chrome.storage.local.get([ChromeData.scriptSuccess], (res) =>
                  resolve({ data: res.scriptSuccess })
                );
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
        // Case: User is non-premium user
        trackInjection(injectTrackPlayPause);
        // TODO: Set conditional for failure case
        setIsPlaying(false);
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
        // Case: User is non-premium user
        trackInjection(injectTrackPlayPause);
        // TODO: Set conditional for failure case
        setIsPlaying(true);
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
        // Case: User is non-premium user
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
            // Case: User is non-premium user
            let success = false;
            await trackInjection(injectTrackPrevious).then(
              (res: any) => (success = res.data)
            );
            if (success) {
              setTimeout(() => {
                getTrack();
              }, 250);
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
          // Note: Saving track api is for premium and non-premium users
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
          // Note: Removing track api is for premium and non-premium users
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
          // Case: User is non-premium user
          chrome.storage.local.set({ volume: volumePercent });
          await trackInjection(injectChangeVolume);
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
    if (successOrAdPlayerStatus()) {
      setIsMounted(true);
      setShowVolumeTrack(true);
    }
  };

  // Removes volume icon on mouse leave
  const onVolumeLeaveHandler = () => {
    setIsMounted(false);
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
      async (res) => {
        if (res.status === Status.SUCCESS) {
          setProgressMs(positionMs);
          const updatedThumbPos = getThumbPosition(positionMs, durationMs);
          setThumbPosition(updatedThumbPos);
        } else if (res.status === Status.FAILURE) {
          // Case: User is not non-premium user
          chrome.storage.local.set({ percent });
          await trackInjection(injectSeekTrack);
          // TODO: Add condition on if injection results in error
          setProgressMs(positionMs);
          const updatedThumbPos = getThumbPosition(positionMs, durationMs);
          setThumbPosition(updatedThumbPos);
        } else {
          console.log("Unknown error when seeking track volume.");
        }
      }
    );
  };

  // Check if player has success status
  const successPlayerStatus = () => {
    return playerStatus === PlayerStatus.SUCCESS;
  };

  // Check if player has ad status
  const adPlayerStatus = () => {
    return playerStatus === PlayerStatus.AD_PLAYING;
  };

  const successOrAdPlayerStatus = () => {
    return (
      playerStatus === PlayerStatus.AD_PLAYING ||
      playerStatus === PlayerStatus.SUCCESS
    );
  };

  return (
    <div className={styles.playerContainer} id="player-container">
      <AlbumArt playerStatus={playerStatus} albumUrl={albumUrl}></AlbumArt>
      {successPlayerStatus() && (
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
          disabled={!successPlayerStatus()}
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
            disabled={!successPlayerStatus()}
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
            disabled={!successPlayerStatus()}
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
          disabled={!successPlayerStatus()}
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
                disabled={!successOrAdPlayerStatus()}
              >
                {getVolumeIcon()}
              </IconButton>
            </Grid>
          </Stack>
        </Box>
      </div>
      <div className={successOrAdPlayerStatus() && styles.playerTrackSlider}>
        {successOrAdPlayerStatus() && (
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
                {successPlayerStatus() ? createTrackTime(durationMs) : "--:--"}
              </Grid>
            </Grid>
          </Box>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer;
