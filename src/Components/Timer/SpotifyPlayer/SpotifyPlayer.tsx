import React, { FC, useState, useEffect, useMemo } from "react";
import styles from "./SpotifyPlayer.module.css";
import { Box, Grid, Slider, IconButton } from "@material-ui/core";
import Stack from "@mui/material/Stack";
import VolumeDownIcon from "@material-ui/icons/VolumeDown";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import VolumeOffIcon from "@material-ui/icons/VolumeOff";
import { ThemeProvider } from "@material-ui/styles";
import debounce from "lodash.debounce";
// Note: do not export this from utils module
import { createTheme } from "@material-ui/core/styles";
import {
  PlayerActions,
  Status,
  createTrackTime,
  getThumbPosition,
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

const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackSaved, setTrackSaved] = useState(false);
  const [volume, setVolume] = useState(0);
  const [deviceId, setDeviceId] = useState("");
  const [volumeCached, setVolumeCached] = useState(volume);
  const [showVolumeTrack, setShowVolumeTrack] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [progressMs, setProgressMs] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0);
  const [showThumbTrack, setShowThumbTrack] = useState(false);
  const [dominantColor, setDominantColor] = useState("#212529");

  // Get accesstoken and initial track data (on initial load
  // - issue: multiple calls to spotify api
  //  - possible solutions:
  //      - save artist data into storage?
  //          - issue: what if change track on diff device

  // On popup open, get track data
  useEffect(() => getTrack(), []);

  // Note: will run sequential to previous useEffect
  useEffect(() => {
    if (thumbPosition >= 0) {
      const updateTime = setInterval(() => {
        if (isPlaying) {
          const updatedProgress = progressMs + 1000;
          setProgressMs(updatedProgress);
          const updatedPosition = getThumbPosition(updatedProgress, durationMs);
          setThumbPosition(updatedPosition);
          if (updatedProgress >= durationMs - 3000) {
            getTrack();
          }
        } else {
          getTrack();
        }
      }, 1000);
      return () => clearInterval(updateTime);
    }
  }, [thumbPosition, progressMs, durationMs, isPlaying]);

  const getTrack = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.GET_CURRENTLY_PLAYING },
      (res) => {
        if (res !== undefined) {
          if (res.status === Status.SUCCESS) {
            setTrack(res.data.track);
            setArtist(res.data.artist);
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
          } else if (res.status === Status.FAILURE) {
            setThumbPosition(-1);
            console.log(res);
          } else if (res.status === Status.ERROR) {
            setThumbPosition(-1);
            console.log(res);
          }
        } else {
          console.log("Unknown error when getting track data.");
        }
      }
    );
  };

  const trackPause = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.PAUSE }, (res) => {
      if (res.status === Status.SUCCESS) {
        setIsPlaying(false);
      } else if (res.status === Status.FAILURE) {
        console.log(res);
      } else if (res.status === Status.ERROR) {
        console.log(res);
      } else {
        console.log("Unknown error when pausing track.");
      }
    });
  };

  const trackPlay = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.PLAY }, (res) => {
      if (res.status === Status.SUCCESS) {
        setIsPlaying(true);
      } else if (res.status === Status.FAILURE) {
        console.log(res);
      } else if (res.status === Status.ERROR) {
        console.log(res);
      } else {
        console.log("Unknown error when playing track.");
      }
    });
  };

  const trackNext = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.NEXT }, (res) => {
      if (res.status === Status.SUCCESS) {
        getTrack();
      } else if (res.status === Status.FAILURE) {
        console.log(res);
      } else if (res.status === Status.ERROR) {
        console.log(res);
      } else {
        console.log("Unknown error when getting next track.");
      }
    });
  };

  const trackPrevious = () => {
    if (thumbPosition > 0) {
      thumbSeekChangeCommitted(0);
      thumbSeekUI(0);
    } else {
      chrome.runtime.sendMessage({ message: PlayerActions.PREVIOUS }, (res) => {
        if (res.status === Status.SUCCESS) {
          getTrack();
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when getting previous track.");
        }
      });
    }
  };

  // Save track to user LIKED playlist
  const trackSave = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.SAVE_TRACK, query: trackId },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setTrackSaved(true);
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when saving user track.");
        }
      }
    );
  };

  // Remove track from user LIKED playlist
  const trackRemoveSaved = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.REMOVE_SAVED_TRACK, query: trackId },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setTrackSaved(false);
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when removing user track.");
        }
      }
    );
  };

  const showHeart = () => {
    if (artist === "") {
      return (
        <HeartHalf
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></HeartHalf>
      );
    } else if (trackSaved) {
      return (
        <HeartFill
          onClick={trackRemoveSaved}
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></HeartFill>
      );
    } else {
      return (
        <Heart
          onClick={trackSave}
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></Heart>
      );
    }
  };

  // State function for change volume UI
  const volumeChangeUI = (value: any) => {
    setVolume(value);
  };

  // Show volume control when mouse hover over volume icon
  // FIX: Implement debounce on slider?
  // - Note: only this function re-rendered, does not make getTrack() request
  const debounceVolumeHandler = useMemo(() => debounce(volumeChangeUI, 25), []);

  // Get volume value after mouse-up from mouse click
  const trackVolumeChangeCommitted = (volumePercent: any) => {
    chrome.runtime.sendMessage(
      {
        message: PlayerActions.SET_VOLUME,
        query: { volumePercent, deviceId },
      },
      (res) => {
        if (res.status === Status.SUCCESS) {
          if (volume !== 0) {
            setVolumeCached(volume);
          }
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when setting track volume.");
        }
      }
    );
  };

  const muteVolumeHandler = () => {
    if (volume > 0) {
      setVolume(0);
      trackVolumeChangeCommitted(0);
    } else {
      setVolume(volumeCached);
      trackVolumeChangeCommitted(volumeCached);
      setVolumeCached(0);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeOffIcon className={styles.playerControlIcons} />;
    } else if (volume < 50) {
      return <VolumeDownIcon className={styles.playerControlIcons} />;
    } else {
      return <VolumeUpIcon className={styles.playerControlIcons} />;
    }
  };

  const onMouseEnterHandler = () => {
    setShowVolumeTrack(true);
  };

  const onMouseLeaveHandler = () => {
    setShowVolumeTrack(false);
  };

  const onMouseEnterThumbTrack = () => {
    console.log("Showing thumb track");
    setShowThumbTrack(true);
  };

  const onMouseLeaveThumbTrack = () => {
    console.log("Closing thumb track");
    setShowThumbTrack(false);
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

  const thumbSeekUI = (value: any) => {
    setThumbPosition(value);
  };

  const debounceThumbSeekHandler = useMemo(() => debounce(thumbSeekUI, 25), []);

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
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when seeking track volume.");
        }
      }
    );
  };

  const getDominantColor = (color: string) => {
    // const playerContainer = document.getElementById("player-container") as HTMLElement;
    // if (playerContainer) {
    //   console.log("Setting background color =", color)
    //   playerContainer.style.background = `radial-gradient(${color}, #212529)`
    // }
    setDominantColor(color);
  };

  // TODO: Put filler image here (to wait for loading images)
  return (
    <div className={styles.playerContainer} id="player-container">
      <AlbumArt
        albumUrl={albumUrl}
        getDominantColorHandler={getDominantColor}
      ></AlbumArt>
      <div className={styles.trackTextContainer}>
        <div className={styles.trackTitle}>{track}</div>
        <div className={styles.trackArtist}>{artist}</div>
      </div>
      <div
        className={styles.playerControls}
        onMouseEnter={onMouseEnterThumbTrack}
        onMouseLeave={onMouseLeaveThumbTrack}
      >
        <Box width={100}></Box>
        {showHeart()}
        <SkipStartFill
          onClick={trackPrevious}
          className={styles.playerControlIcons + " ms-2 me-2"}
          size={20}
        ></SkipStartFill>
        {!isPlaying ? (
          <PlayFill
            onClick={trackPlay}
            className={styles.playerControlIcons + " me-2"}
            size={30}
          ></PlayFill>
        ) : (
          <PauseFill
            onClick={trackPause}
            className={styles.playerControlIcons + " me-2"}
            size={30}
          ></PauseFill>
        )}
        <SkipEndFill
          className={styles.playerControlIcons + " me-3"}
          onClick={trackNext}
          size={20}
        ></SkipEndFill>
        <Box width={130}>
          <Stack>
            <Grid item className={styles.trackSlider}>
              {showVolumeTrack && (
                <ThemeProvider theme={muiTheme}>
                  <Slider
                    value={volume}
                    orientation="vertical"
                    onChange={(_, val) => debounceVolumeHandler(val)}
                    onChangeCommitted={(_, val) =>
                      trackVolumeChangeCommitted(val)
                    }
                    onMouseEnter={onMouseEnterHandler}
                    onMouseLeave={onMouseLeaveHandler}
                  ></Slider>
                </ThemeProvider>
              )}
            </Grid>
            <Grid item>
              <IconButton
                onMouseEnter={onMouseEnterHandler}
                onMouseLeave={onMouseLeaveHandler}
                onClick={muteVolumeHandler}
              >
                {getVolumeIcon()}
              </IconButton>
            </Grid>
          </Stack>
        </Box>
        <div className={styles.playerSeekTrack}>
          <Box width={225}>
            {showThumbTrack && (
              <Grid container spacing={1} alignItems="center">
                <Grid item className={styles.playerSeekTime + " me-2"}>
                  {createTrackTime(progressMs)}
                </Grid>
                <Grid item xs>
                  <ThemeProvider theme={muiTheme}>
                    <Slider
                      value={thumbPosition}
                      onChange={(_, val) => debounceThumbSeekHandler(val)}
                      onChangeCommitted={(_, val) =>
                        thumbSeekChangeCommitted(val)
                      }
                    ></Slider>
                  </ThemeProvider>
                </Grid>
                <Grid item className={styles.playerSeekTime + " ms-2"}>
                  {createTrackTime(durationMs)}
                </Grid>
              </Grid>
            )}
          </Box>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
