enum PlayerActions {
  PAUSE = 0,
  PLAY,
  NEXT, 
  PREVIOUS, 
  GET_PROFILE, 
  GET_CURRENTLY_PLAYING
}

enum Status {
  SUCCESS = 0,
  FAILURE,
  ERROR
}

export {PlayerActions, Status};