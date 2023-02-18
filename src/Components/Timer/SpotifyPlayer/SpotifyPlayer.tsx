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
    // chrome.storage.local.get(["accessToken", "endTime", "signedIn"], (res) => {
    //   const currTime = new Date().getTime();
    //   if (res.signedIn && currTime < res.endTime) {
    //     request("GET", "/player/currently-playing", res.accessToken)
    //       .then((res) => res.json())
    //       .then((data) => {
            // setTrack(data.item.name);
            // setArtist(data.item.artists[0].name);
            // setAlbumUrl(data.item.album.images[0].url);
    //       })
    //       .catch((e) => {
    //         console.log(e);
    //       });
    //   }
    // });
  }, []);

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

  //   chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //     console.log("Listener:", tab.url)
  //   }
  // )
  // window.onSpotifyWebPlaybackSDKReady = () => {
  //   console.log("Ready");
  //   const player = new Spotify.Player({
  //     name: "Eric",
  //     getOAuthToken: () => {accessToken},
  //     volume: 0.5
  //   })
  // }

  const togglePlay = () => {
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
  };

  return (
    <Fragment>
      <div className="d-flex flex-column align-items-center">
        // TODO: Put filler image here (to wait for loading images)
        {albumUrl && <img className="w-50 h-50 mb-3" src={albumUrl} alt="" />}
        <div className="text-center mb-2">
          {/* <div className='text-white'>{track}</div> */}
          <div className="text-white fst-italic fw-light">{artist}</div>
        </div>
        <div>
          <SkipStartFill
            className="me-2"
            color="white"
            size={20}
          ></SkipStartFill>
          <PlayFill
            onClick={togglePlay}
            // id="togglePlay"
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
