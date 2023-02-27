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
  const [playerStatus, setPlayerStatus] = useState(PlayerStatus.LOADING);
  const [isMounted, setIsMounted] = useState(false);

  // Get accesstoken and initial track data (on initial load
  // - issue: multiple calls to spotify api
  //  - possible solutions:
  //      - save artist data into storage?
  //          - issue: what if change track on diff device

  const getTrack = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.GET_CURRENTLY_PLAYING },
      (res) => {
        if (res !== undefined) {
          if (res.status === Status.SUCCESS) {
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
            setPlayerStatus(PlayerStatus.SUCCESS);
          } else if (res.status === Status.FAILURE) {
            console.log(res);
            setThumbPosition(-1);
            setPlayerStatus(PlayerStatus.REQUIRE_WEBPAGE);
          } else if (res.status === Status.ERROR) {
            setThumbPosition(-1);
            // TODO: What to show when status is error?
            // setPlayerStatus(PlayerStatus.ERROR);
            console.log(res);
          }
        } else {
          // setPlayerStatus(PlayerStatus.ERROR);
          console.log("Unknown error when getting track data.");
        }
      }
    );
  };

  // On popup open, get track data
  useEffect(() => {
    getTrack();
  }, []);

  // Note: will run sequential to previous useEffect
  useEffect(() => {
    if (playerStatus === PlayerStatus.SUCCESS && thumbPosition >= 0) {
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
  }, [thumbPosition, progressMs, durationMs, isPlaying, playerStatus]);

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
    if (playerStatus === PlayerStatus.SUCCESS && trackSaved) {
      return (
        <HeartFill
          onClick={() => (PlayerStatus.SUCCESS ? trackRemoveSaved() : null)}
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></HeartFill>
      );
    } else if (playerStatus === PlayerStatus.SUCCESS) {
      return (
        <Heart
          onClick={() => (PlayerStatus.SUCCESS ? trackSave() : null)}
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></Heart>
      );
    } else {
      return (
        <HeartHalf
          className={styles.playerControlIcons + " me-4"}
          size={18}
        ></HeartHalf>
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
    if (playerStatus === PlayerStatus.SUCCESS) {
      setIsMounted(true);
      setShowVolumeTrack(true);
    }
  };

  const onMouseLeaveHandler = () => {
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
    transitions: {
      easing: {
        easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
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

  // TODO: Put filler image here (to wait for loading images)
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
        <Box width={100}></Box>
        {showHeart()}
        <SkipStartFill
          onClick={() =>
            playerStatus === PlayerStatus.SUCCESS ? trackPrevious() : null
          }
          className={styles.playerControlIcons + " ms-2 me-2"}
          size={20}
        ></SkipStartFill>
        {!isPlaying ? (
          <PlayFill
            onClick={() =>
              playerStatus === PlayerStatus.SUCCESS ? trackPlay() : null
            }
            className={styles.playerControlIcons + " me-2"}
            size={30}
          ></PlayFill>
        ) : (
          <PauseFill
            onClick={() =>
              playerStatus === PlayerStatus.SUCCESS ? trackPause() : null
            }
            className={styles.playerControlIcons + " me-2"}
            size={30}
          ></PauseFill>
        )}
        <SkipEndFill
          className={styles.playerControlIcons + " me-3"}
          onClick={() =>
            playerStatus === PlayerStatus.SUCCESS ? trackNext() : null
          }
          size={20}
        ></SkipEndFill>
        <Box width={130}>
          <Stack>
            <Grid item className={styles.trackSliderContainer}>
              {showVolumeTrack && (
                <ThemeProvider theme={muiTheme}>
                  <Slider
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
          {PlayerStatus.SUCCESS === playerStatus && (
            <Box width={225}>
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
            </Box>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
