import React, { useEffect, useState, FC } from "react";
import { PlayerActions } from "../Utils/SpotifyPlayerUtils";

// Steps
// - Use chooses actions based on setAction
// - Calls useEffect
//  - get and set updated access token
//  - get and set updated player (get new player if access token changed)
//  - dispatch new action

const usePlayer = (): [(param: number) => void, string] => {
  const [action, setAction] = useState(-1);
  const [error, setError] = useState("");

  // Callback function for Spotify Player
  const tokenCallBack = (callback: (token: string) => void): void => {
    chrome.storage.local.get(["accessToken"], (res) => {
        callback(res.accessToken);
    })
  }

  useEffect(() => {
    // FIX: How to prevent script from being rendered every time?
    // Append script to document
    const script = document.createElement("script");
    script.src = "./spotify-player.js";
    script.async = true;
    document.head.appendChild(script);

    // Get previous instance of Player or create new Player
    window.onSpotifyWebPlaybackSDKReady = () => {
      chrome.storage.local.get(["signedIn", "player", "accessToken"], (res) => {
        let player: any;
        if (res.signedIn && res.player !== undefined) {
          player = res.player;
        } else if (res.signedIn) {
          
          // Create new player instance
          player = new window.Spotify.Player({
            name: "Doro",
            getOAuthToken: tokenCallBack,
            volume: 0.5,
          });

          // Connect playback sdk instance to spotify
          player.connect().then((success: boolean) => {
            if (!success) {
              setError("Unable to connect to Spotify");
              return;
            }
            setError("Connected to Spotify");
          });

          // Check if device is unique
          player.addListener("ready", (res: any) => {
            console.log("The Web Playback SDK is ready to play music!");
            console.log("Device ID", res.device_id);
          });

          // Check if playback is prohibited by browser rules
          player.addListener("autoplay_failed", () => {
            setError("Autoplay is prohibited by browser rules");
            return;
          });
          chrome.storage.local.set({ player: player });
        }
        // if (player!== undefined) {
            // }
        // if (player !== undefined && action > 0) {
        // player.activateElement()
        // player.toggleplay()
        setError("toggle play")
        // }
      });
    };
    // Note: window method needs to be out function
    // window.onSpotifyWebPlaybackSDKReady = () => {
    // if (player !== undefined && Object.keys(player).length > 0) {
    //     // player.togglePlay();
    //     setError(player)
    //     // Note: player only valid in context of window.onSpotifyWebPlaybackSDKReady
    //     // Handler for play button click
    //     // document.getElementById('togglePlay')!.onclick = () => {
    //     //   console.log("togglePlay")
    //     //   // Ensure playback is triggered by sync event-path ()
    //     //   player.activateElement();
    //     //   player.togglePlay()
    //     // };
    //     } else {
    //     setError("Player is undefined");
    //     }
    //   };
  }, []);

  return [setAction, error];
};

export default usePlayer;
