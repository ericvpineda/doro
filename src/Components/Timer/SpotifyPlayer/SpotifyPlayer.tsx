import React, { FC, Fragment, useState, useEffect } from "react";
import request from "../../Utils/SpotifyPlayerUtils";
import { PlayFill, SkipEndFill, SkipStartFill } from "react-bootstrap-icons";
// import SpotifyPlayBack from "./SpotifyPlayBack";

const SpotifyPlayer: FC = (props) => {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);


  // Get accesstoken and initial track data (on initial load
  // - issue: multiple calls to spotify api
  //  - possible solutions:
  //      - save artist data into storage?
  //          - issue: what if change track on diff device
  useEffect(() => {
    chrome.storage.local.get(["accessToken", "endTime", "signedIn"], (res) => {
      const currTime = new Date().getTime();
      if (res.signedIn && currTime < res.endTime) {
        request("GET", "/player/currently-playing", res.accessToken)
          .then((res) => res.json())
          .then((data) => {
            setTrack(data.item.name);
            setArtist(data.item.artists[0].name);
            setImageUrl(data.item.album.images[0].url);
            setAccessToken(res.accessToken);
          })
          .catch((e) => {
            console.log(e);
          });
      }
    });
  }, []);

  // Note: Use later when implementing free spotify account
  // function Pause () {
  //   const btn = document.querySelector("[data-testid='control-button-playpause']") as HTMLElement;
  //   if (btn.getAttribute('aria-label') == "Play") {
  //     btn.click();
  //     return "Play"
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
    // chrome.storage.local.get(["tabId"], (res) => {      
    //   chrome.scripting.executeScript({
    //     target: { tabId: res.tabId },
    //     func: Pause,

    //   })
    //   .then((injectedResults) => {console.log(injectedResults);})
    // })
    setIsPlaying(!isPlaying);
    }
  // const ready = useWebPlaybackSDKReady();
  // console.log("Ready=", ready);

  useEffect(() => {
    // Append script to document
    const script = document.createElement('script');
    script.src = "./spotify-player.js"
    script.async = true;
    document.head.appendChild(script)

    // Get accesstoken from storage
    let accessToken = ""
    chrome.storage.local.get(["accessToken"], (result) => {
      accessToken = result.accessToken;
    })

    // Will be executed when spotify script loaded
    window.onSpotifyWebPlaybackSDKReady = () => {

      const player = new window.Spotify.Player({
          name: "Eric",
          getOAuthToken: callback => {callback(accessToken)},
          volume: 0.5
        })
        // Connect playback sdk instance to spotify
        player.connect().then((success) => {if (success) {
          console.log("Connected to Spotify")
        }})
        // Check if devicce is unique
        player.addListener('ready', ({ device_id }) => {
          console.log('The Web Playback SDK is ready to play music!');
          console.log('Device ID', device_id);
        })
        // Check if playback is prohibited by browser rules
        player.addListener('autoplay_failed', () => {
          console.log('Autoplay is not allowed by the browser autoplay rules');
        });

        // Handler for play button click
        document.getElementById('togglePlay')!.onclick = () => {
          console.log("togglePlay")
          // Ensure playback is triggered by sync event-path ()
          player.activateElement();
          player.togglePlay()
        }; 
      }
  }, [])

  return (
    <Fragment>
      <div className="d-flex flex-column align-items-center">
        <img className="w-50 h-50 mb-3" src={imageUrl} alt="" />
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
            // onClick={togglePlay}
            id="togglePlay"
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
