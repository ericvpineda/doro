import React, { useEffect, useState, FC } from "react";
// import { PlayerActions } from "../Utils/SpotifyPlayerUtils";

// NOTE: 
// - Spotify Playback hook to stream music 
// - Will continue this later.. due to issues..

// Steps
// - Use chooses actions based on setAction
// - Calls useEffect
//  - get and set updated access token
//  - get and set updated player (get new player if access token changed)
//  - dispatch new action

// Edge cases
// - how to update stale player? 
//  - create new player or will token callback fix it auto?
// - how to keep state of action variable
//  - save variable in local storage 

// Note:
// - can only have one instance of onSpotifyWebPlaybackSDKReady
//  - ex: cannot have update method with onSpotifyWebPlaybackSDKReady

// Issue:
// - cannot save player instance into local storage
//  - cannot save pre-connected player 
//  - cannot used window object (only works on current tab)

const usePlayer = (): [(param: number) => void, string] => {
  const [action, setAction] = useState(-1);
  const [error, setError] = useState("");

  // Callback function for Spotify Player
  const tokenCallBack = (callback: (token: string) => void): void => {
    chrome.storage.local.get(["accessToken"], (res) => {
        callback(res.accessToken);
    })
  }

   // Connect playback sdk instance to spotify
   const connectPlayer = async () => {
      // Check if playback is prohibited by browser rules
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(["signedIn", "player", "accessToken"], (res) => {
          // let player: any;
          // if (res.signedIn && res.player !== undefined) {
          //   player = res.player;
          // } else if (res.signedIn) {
            // Create new player instance
            const player = new window.Spotify.Player({
              name: "Doro",
              getOAuthToken: tokenCallBack,
              volume: 0.5,
            });
            
    // Connect playback sdk instance to spotify
              // Check if playback is prohibited by browser rules
            player.addListener("autoplay_failed", () => {
              setError("Autoplay is prohibited by browser rules");
              return;
            });
            player.addListener("ready", (res: any) => {
              console.log("The Web Playback SDK is ready to play music!");
              console.log("Device ID", res.device_id);
            })
            player.connect().then((success: boolean) => {
              if (success) { console.log("Connected to Spotify"); } 
            })
            resolve(player)
        // }
        })
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

       connectPlayer().then((player: any) => {
        chrome.storage.local.set({ player: player });
        player.togglePlay().then((success: boolean) => {
          console.log("Player toggled from async");
        })
       })
      };
      
      // useEffect cleanup function
      return () => {}
    }, []);
    
  return [setAction, error];
};

export default usePlayer;
