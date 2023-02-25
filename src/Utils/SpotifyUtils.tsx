// import { createTheme } from "@material-ui/core";


enum PlayerActions {
  PAUSE = 0,
  PLAY,
  NEXT,
  PREVIOUS,
  GET_PROFILE,
  GET_CURRENTLY_PLAYING,
  SAVE_TRACK,
  REMOVE_SAVED_TRACK,
  SET_VOLUME,
  SEEK_POSITION
}

enum Status {
  NOT_SET = -1,
  SUCCESS,
  FAILURE,
  ERROR,
}

enum PlayerStatus {
  LOADING = 0,
  REQUIRE_WEBPAGE,
  SUCCESS,
  ERROR
}

// Note:
// - need to account for up to 800 hours of music
const createTrackTime = (timeMs: number): string => {
  const secondsRaw = Math.floor(timeMs / 1000);
  const minutesRaw = Math.floor(secondsRaw / 60);
  const hoursRaw = Math.floor(minutesRaw / 60);
  const seconds = secondsRaw % 60;
  const minutes = minutesRaw % 60;
  const hours = hoursRaw % 60;
  const secToString = seconds >= 10 ? seconds.toString() : "0" + seconds;
  const minToString = minutes >= 10 ? minutes.toString() : "0" + minutes;
  const hourToString = hours >= 10 ? hours.toString() : "0" + hours;

  if (hours == 0) {
    return minToString + ":" + secToString;
  }
  return hourToString + ":" + minToString + ":" + secToString;
};

  const getThumbPosition = (progress: number, duration: number) => {
    return Math.floor((progress / duration) * 100)
  }

export { PlayerStatus, PlayerActions, Status, createTrackTime, getThumbPosition };
