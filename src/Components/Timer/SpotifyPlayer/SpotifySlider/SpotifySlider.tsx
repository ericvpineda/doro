import React, { FC, useEffect, useState, useMemo } from "react";
import { Box, Grid, Slider } from "@material-ui/core";
import {
  createTrackTime,
  PlayerStatus,
  getThumbPosition,
} from "../../../../Utils/SpotifyUtils";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import styles from "./SpotifySlider.module.css";
import debounce from "lodash.debounce";

// Parent component is SpotifyPlayer
interface Props {
  playerStatus: PlayerStatus;
  progressMs: number;
  thumbPosition: number;
  thumbSeekChangeCommitted: (param: any) => void;
  durationMs: number;
  successPlayerStatus: () => boolean;
  successOrAdPlayerStatus: () => boolean;
  isPlaying: boolean;
  getTrack: () => void;
}

// Spotify slider component
const SpotifySlider: FC<Props> = (props) => {
  const [progressMs, setProgressMs] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0);
  const playerStatus = props.playerStatus;
  const durationMs = props.durationMs;
  const thumbSeekChangeCommitted = props.thumbSeekChangeCommitted;
  const successPlayerStatus = props.successPlayerStatus;
  const successOrAdPlayerStatus = props.successOrAdPlayerStatus;
  const getTrack = props.getTrack;
  const isPlaying = props.isPlaying;

  // Check if player has ad status
  const adPlayerStatus = () => {
    return playerStatus === PlayerStatus.AD_PLAYING;
  };

  // Theme for slider
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

  // Set intital values for thumb position and progress bar
  useEffect(() => {
    setThumbPosition(props.thumbPosition);
    setProgressMs(props.progressMs);
  }, [props.thumbPosition, props.progressMs]);

  // Note: will run sequential to previous useEffect
  useEffect(() => {
    if (successOrAdPlayerStatus() && thumbPosition >= 0) {
      const updateTime = setInterval(() => {
        if (isPlaying) {
          const updatedProgress = progressMs + 1000;
          setProgressMs(updatedProgress);
          const updatedPosition = getThumbPosition(updatedProgress, durationMs);
          setThumbPosition(updatedPosition);
          // Caution: Custom set advertisement interval will call this multiple times
          if (
            (successPlayerStatus() && updatedProgress >= durationMs - 3000) ||
            updatedProgress >= durationMs - 1000
          ) {
            getTrack();
          }
        }
      }, 1000);
      return () => clearInterval(updateTime);
    }
  }, [thumbPosition, progressMs, durationMs, isPlaying, playerStatus]);

  return (
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
              onChangeCommitted={(_, val) => thumbSeekChangeCommitted(val)}
            ></Slider>
          </ThemeProvider>
        </Grid>
        <Grid item className={styles.playerSeekTime + " ms-2"}>
          {successPlayerStatus() ? createTrackTime(durationMs) : "--:--"}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SpotifySlider;
