import React, { FC, Fragment, useState, useEffect } from "react";
import { PlayFill, SkipEndFill, SkipStartFill } from "react-bootstrap-icons";
import { PlayerActions, Status } from "../../../Utils/SpotifyUtils";

const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  // const [isPlaying, setIsPlaying] = useState(false);

  // Get accesstoken and initial track data (on initial load
  // - issue: multiple calls to spotify api
  //  - possible solutions:
  //      - save artist data into storage?
  //          - issue: what if change track on diff device

  useEffect(() => {
    chrome.runtime.sendMessage({ message: PlayerActions.GET_CURRENTLY_PLAYING }, (res) => {
      if (res.status === Status.SUCCESS) {
        setTrack(res.data.track);
        setArtist(res.data.artist);
        setAlbumUrl(res.data.albumUrl);
      } else if (res.status === Status.FAILURE) {
        console.log(res);
      } else if (res.status === Status.ERROR) {
        console.log(res);
      } else {
        console.log("Unknown error when getting profile url.");
      }
    })
}, []);

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

  const togglePause = () => {
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
    console.log("togglePause");

  };

  return (
    <Fragment>
      <div className="d-flex flex-column align-items-center justify-content-center">
        // TODO: Put filler image here (to wait for loading images)
        {albumUrl && <img className="w-25 h-25 mb-3" src={albumUrl} alt="" />}
        <div className="text-center mb-2">
          <div className='text-white'>{track}</div>
          <div className="text-white fst-italic fw-light">{artist}</div>
        </div>
        <div>
          <SkipStartFill
            className="me-2"
            color="white"
            size={20}
          ></SkipStartFill>
          <PlayFill
            onClick={togglePause}
            className="me-1"
            color="white"
            size={30}
          ></PlayFill>
          <SkipEndFill color="white" size={20}></SkipEndFill>
        </div>
      </div>
      {/* <button className="btn btn-success" onClick={getCurrentTrack}>Get Current</button> */}
    </Fragment>
  );
};

export default SpotifyPlayer;
