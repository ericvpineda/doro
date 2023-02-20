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
} from "react-bootstrap-icons";

const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackId, setTrackId] = useState("")

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
          setTrackId(res.data.id)
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

  const trackSave = () => {
    chrome.runtime.sendMessage({ message: PlayerActions.SAVE_TRACK, query: trackId }, (res) => {
      if (res.status === Status.SUCCESS) {
        // getTrack();
        console.log("Track saved successfully.");

      } else if (res.status === Status.FAILURE) {
        console.log(res);
      } else if (res.status === Status.ERROR) {
        console.log(res);
      } else {
        console.log("Unknown error when getting previous track.");
      }
    });
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
        <div>
          <Heart onClick={trackSave} className={styles.playerControls + " me-3"} size={18}>
          </Heart>
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
        </div>
      </div>
    </Fragment>
  );
};

export default SpotifyPlayer;
