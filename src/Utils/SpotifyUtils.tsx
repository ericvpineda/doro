enum PlayerActions {
  PAUSE = 0,
  PLAY,
  NEXT, 
  PREVIOUS, 
  GET_PROFILE, 
  GET_CURRENTLY_PLAYING,
  SAVE_TRACK,
  REMOVE_SAVED_TRACK,
  SET_VOLUME
}

enum Status {
  NOT_SET = -1,
  SUCCESS,
  FAILURE,
  ERROR
}

export {PlayerActions, Status};