import React, { FC, Fragment, useState, useEffect } from "react";
import { PlayerActions, Status } from "../../../Utils/SpotifyUtils";
import styles from "./SpotifyPlayer.module.css";
import {
  PlayFill,
  SkipEndFill,
  SkipStartFill,
  PauseFill,
  Heart,
  HeartFill,
  HeartHalf,
  VolumeOff,
} from "react-bootstrap-icons";
import { Box, Grid, Slider, IconButton } from "@material-ui/core";
import VolumeDownIcon from "@material-ui/icons/VolumeDown";
import VolumeUpIcon from "@material-ui/icons";
import VolumeOffIcon from "@material-ui/icons";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackSaved, setTrackSaved] = useState(false);
  const [volume, setVolume] = useState(0);

  // Get accesstoken and initial track data (on initial load
  // - issue: multiple calls to spotify api
  //  - possible solutions:
  //      - save artist data into storage?
  //          - issue: what if change track on diff device

  // Note: Use later when implementing free spotify account
  // function Pause () {
  //   const btn = document.querySelector('[data-testid="control-button-playpause"]') as HTMLElement;
  //   if (btn !== null && btn.getAttribute('aria-label') === "Pause") {
  //     btn.click();
  //     return "pause"
  //   }
  // }

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
  //   console.log(res.tabId)
  // chrome.scripting.executeScript({
  //   target: { tabId: res.tabId },
  //   func: Pause,
  // })
  // .then((injectedResults) => {console.log(injectedResults);})
  // })
  // setIsPlaying(!isPlaying);
  // console.log(typeof player)

  // On popup open, get track data
  useEffect(() => getTrack(), []);

  const getTrack = () => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.GET_CURRENTLY_PLAYING },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setTrack(res.data.track);
          setArtist(res.data.artist);
          setAlbumUrl(res.data.albumUrl);
          setIsPlaying(res.data.isPlaying);
          setTrackId(res.data.id);
          setTrackSaved(res.data.isSaved);
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when getting profile url.");
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
          className={styles.playerControls + " me-3"}
          size={18}
        ></HeartHalf>
      );
    } else if (trackSaved) {
      return (
        <HeartFill
          onClick={trackRemoveSaved}
          className={styles.playerControls + " me-3"}
          size={18}
        ></HeartFill>
      );
    } else {
      return (
        <Heart
          onClick={trackSave}
          className={styles.playerControls + " me-3"}
          size={18}
        ></Heart>
      );
    }
  };

  // Show volume control when mouse hover over volume icon
  const showVolume = () => {
    console.log("Show volume");
  };

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

  const volumeChangeUI = (value: any) => {
    setVolume(value);
  };
  console.log("Render spotify player");

  const volumeChangeSpotify = (value: any) => {
    console.log(value);
  }

  // TODO: Put filler image here (to wait for loading images)
  return (
    <Fragment>
      <div className={styles.playerContainer}>
        {albumUrl && <img className={styles.image} src={albumUrl} alt="" />}
        <div className="text-center mb-2">
          <div className="text-white">{track}</div>
          <div className="text-white fst-italic fw-light">{artist}</div>
        </div>
        <div className="d-flex flex-row justify-content-center align-items-center">
          <Box width={100}></Box>
          {showHeart()}
          <SkipStartFill
            onClick={trackPrevious}
            className={styles.playerControls + " me-2"}
            size={20}
          ></SkipStartFill>
          {!isPlaying ? (
            <PlayFill
              onClick={trackPlay}
              className={styles.playerControls + " me-2"}
              size={30}
            ></PlayFill>
          ) : (
            <PauseFill
              onClick={trackPause}
              className={styles.playerControls + " me-2"}
              size={30}
            ></PauseFill>
          )}
          <SkipEndFill
            className={styles.playerControls}
            onClick={trackNext}
            color="white"
            size={20}
          ></SkipEndFill>
          <Box width={125}>
            <Grid container spacing={0} alignItems="center">
              <Grid item md>
                <IconButton>
                  <VolumeDownIcon className={styles.playerControls} />
                </IconButton>
              </Grid>
              <Grid item xs>
                <ThemeProvider theme={muiTheme}>
                  <Slider
                    className="pb-2"
                    value={volume}
                    onChange={(_, val) => volumeChangeUI(val)}
                    onChangeCommitted={(_, val) => volumeChangeSpotify(val)}
                  ></Slider>
                </ThemeProvider>
              </Grid>
            </Grid>
          </Box>
        </div>
      </div>
    </Fragment>
  );
};

export default SpotifyPlayer;
