import React, { FC, useEffect, useState, useMemo } from "react";
import { Slider } from "@material-ui/core";
// Note: do not export this from utils module
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import debounce from "lodash.debounce";
import styles from "./VolumeSlider.module.css";

// Parent is SpotifyPLayer component
interface Props {
  setShowVolumeTrack: (params: any) => void;
  trackVolumeChangeCommitted: (params: any) => void;
  volume: number;
  isMounted: boolean;
}

// Volume slider component
const VolumeSlider: FC<Props> = (props) => {
  const [isMounted, setIsMounted] = useState(false);
  const setShowVolumeTrack = props.setShowVolumeTrack;
  const trackVolumeChangeCommitted = props.trackVolumeChangeCommitted;
  const [volume, setVolume] = useState(0);

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

  // State function for change volume UI
  const volumeChangeUI = (value: any) => {
    setVolume(value);
  };

  // Show volume control when mouse hover over volume icon
  const debounceVolumeHandler = useMemo(() => debounce(volumeChangeUI, 25), []);

  // Set initial volume and mounted information from parent component
  useEffect(() => {
    setIsMounted(props.isMounted);
    setVolume(props.volume);
  }, [props.isMounted, props.volume]);

  return (
    <ThemeProvider theme={muiTheme}>
      <Slider
        data-testid="volume-slider"
        className={isMounted ? styles.volumeMount : styles.volumeUnmount}
        onAnimationEnd={() => {
          if (!isMounted) setShowVolumeTrack(false);
        }}
        value={volume}
        orientation="vertical"
        onChange={(_, val) => debounceVolumeHandler(val)}
        onChangeCommitted={(_, val) => trackVolumeChangeCommitted(val)}
      ></Slider>
    </ThemeProvider>
  );
};

export default VolumeSlider;
