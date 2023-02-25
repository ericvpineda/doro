import React, { FC, Fragment, useState, useEffect } from "react";
import styles from "./AlbumArt.module.css";
import { PlayerStatus } from "../../../../Utils/SpotifyUtils";

interface Props {
  albumUrl: string;
  playerStatus: PlayerStatus;
}

// Note:
// - props variables and state variables that useState of prop will be updated when parent state variable updates
//  - does not update custom hooks
const AlbumArt: FC<Props> = (props: any) => {
  const [status, setStatus] = useState(PlayerStatus.LOADING)

  useEffect(() => {
    setStatus(props.playerStatus)
  }, [props.playerStatus])

  const showAlbum = () => {
    if (status === PlayerStatus.LOADING) {
      return (<div className={styles.blankImage}>
      <span>
        Loading...
      </span>
    </div>)
    } else if (status === PlayerStatus.REQUIRE_WEBPAGE) {
      return (
        <div className={styles.blankImage}>
          <span>
            <a href="https://open.spotify.com/" target="_blank">
              Sign in
            </a>{" "}
            spotify <br></br> web player and <br></br>{" "}
            <mark className={styles.highlight}>PLAY a song</mark>!
          </span>
        </div>
      )
    } else if (status === PlayerStatus.ERROR) {
      // TODO: Complete this later..
    } else {
      return (
        <img
          id="album-art"
          src={props.albumUrl}
          className={styles.image}
          alt=""
          crossOrigin="anonymous"
        />
      )
    }
  }

  return (
    <Fragment>
      {showAlbum()}
    </Fragment>
  );
};

export default AlbumArt;
