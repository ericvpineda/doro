// import React, { useState, useEffect, useMemo, FC } from "react";
// import { Grid, Slider } from "@material-ui/core";
// import styles from "./SpotifyThumbSlider.module.css";
// import { createTrackTime } from "../../../Utils/SpotifyUtils";
// import { createTheme } from "@material-ui/core/styles";
// import { ThemeProvider } from "@material-ui/styles";
// import {
//   PlayerActions,
//   Status,
//   getThumbPosition,
// } from "../../../Utils/SpotifyUtils";
// import debounce from "lodash.debounce";

// interface Props {
//   parentThumbPos: number;
//   deviceId: string;
//   isPlaying: boolean;
//   updateParentThumbPosition: (param: number) => void;
// }

// const SpotifyThumbSlider: FC<Props> = (props: any) => {
//   const [thumbPosition, setThumbPosition] = useState(0);
//   const [progressMs, setProgressMs] = useState(0);
//   const [durationMs, setDurationMs] = useState(0);
//   const [deviceId, setDeviceId] = useState("");
//   const [isPlaying, setIsPlaying] = useState();

//   // On popup open, get track data
//   useEffect(() => getTrack(), []);

//   const getTrack = () => {
//     chrome.runtime.sendMessage(
//       { message: PlayerActions.GET_CURRENTLY_PLAYING },
//       (res) => {
//         if (res !== undefined) {
//           if (res.status === Status.SUCCESS) {
//             setIsPlaying(res.data.isPlaying);
//             setDeviceId(res.data.deviceId);
//             const progress = res.data.progressMs;
//             const duration = res.data.durationMs;
//             setProgressMs(progress + 500);
//             setDurationMs(duration);
//             const newThumbPos = getThumbPosition(progress, duration)
//             setThumbPosition(newThumbPos);
//             props.updateParentThumbPosition(newThumbPos + 1)
//           } else if (res.status === Status.FAILURE) {
//             setThumbPosition(-1);
//             console.log(res);
//           } else if (res.status === Status.ERROR) {
//             setThumbPosition(-1);
//             console.log(res);
//           }
//         } else {
//           console.log("Unknown error when getting track data.");
//         }
//       }
//     );
//   };

//   // Note: will run sequential to previous useEffect
//   useEffect(() => {
//     if (thumbPosition >= 0) {
//       const updateTime = setInterval(() => {
//         if (isPlaying) {
//           const updatedProgress = progressMs + 1000;
//           setProgressMs(updatedProgress);
//           const updatedPosition = getThumbPosition(updatedProgress, durationMs);
//           setThumbPosition(updatedPosition);
//           if (updatedProgress >= durationMs - 3000) {
//             props.callGetTrackHandler();
//           }
//         } else {
//           props.callGetTrackHandler();
//         }
//       }, 1000);
//       return () => clearInterval(updateTime);
//     }
//   }, [thumbPosition, progressMs, durationMs, isPlaying]);

//   const thumbSeekUI = (value: any) => {
//     setThumbPosition(value);
//   };

//   const debounceThumbSeekHandler = useMemo(() => debounce(thumbSeekUI, 25), []);

//   const thumbSeekChangeCommitted = (percent: any) => {
//     const positionMs = Math.floor(durationMs * (percent * 0.01));
//     chrome.runtime.sendMessage(
//       {
//         message: PlayerActions.SEEK_POSITION,
//         query: { positionMs, deviceId },
//       },
//       (res) => {
//         if (res.status === Status.SUCCESS) {
//           const updatedProgressMs = positionMs;
//           setProgressMs(updatedProgressMs);
//           const updatedThumbPos = getThumbPosition(
//             updatedProgressMs,
//             durationMs
//           );
//           setThumbPosition(updatedThumbPos);
//           props.updateProgressMs(updatedThumbPos);
//         } else if (res.status === Status.FAILURE) {
//           console.log(res);
//         } else if (res.status === Status.ERROR) {
//           console.log(res);
//         } else {
//           console.log("Unknown error when seeking track volume.");
//         }
//       }
//     );
//   };

//   // Theme for volume slider
//   const muiTheme = createTheme({
//     overrides: {
//       MuiSlider: {
//         thumb: {
//           color: "green",
//         },
//         track: {
//           color: "green",
//         },
//         rail: {
//           color: "black",
//         },
//       },
//     },
//   });

//   return (
//     <Grid container spacing={1} alignItems="center">
//       <Grid item className={styles.playerSeekTime + " me-2"}>
//         {createTrackTime(progressMs)}
//       </Grid>
//       <Grid item xs>
//         <ThemeProvider theme={muiTheme}>
//           <Slider
//             className="pb-1"
//             value={thumbPosition}
//             onChange={(_, val) => debounceThumbSeekHandler(val)}
//             onChangeCommitted={(_, val) => thumbSeekChangeCommitted(val)}
//           ></Slider>
//         </ThemeProvider>
//       </Grid>
//       <Grid item className={styles.playerSeekTime + " ms-2"}>
//         {createTrackTime(durationMs)}
//       </Grid>
//     </Grid>
//   );
// };

// export default SpotifyThumbSlider;
