import React, {useEffect} from "react";

const SpotifyPlayBack = () => {
  let player;
   
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

        player = new window.Spotify.Player({
            name: "Eric",
            getOAuthToken: callback => {callback(accessToken)},
            volume: 0.5
          })
          player.connect().then((success) => {if (success) {console.log("Connected to Spotify")}})
        }
    }, [])
    
    return <div></div>
   }

export default SpotifyPlayBack;