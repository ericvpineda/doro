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
// - Assumptions:
//  - every album, if exits in spotify, will have album artwork 
const AlbumArt: FC<Props> = (props: any) => {
  const [status, setStatus] = useState(PlayerStatus.LOADING);

  useEffect(() => {
    setStatus(props.playerStatus);
  }, [props.playerStatus]);

  const showAlbum = () => {
    if (status === PlayerStatus.REQUIRE_WEBPAGE) {
      return (
        <div className={styles.blankImage}>
          <span>
            <a href="https://open.spotify.com/" target="_blank">Sign in</a>{" "}
            spotify <br></br> web player and <br></br>{" "}
            <mark className={styles.highlight}>PLAY a song</mark>!
          </span>
        </div>
      );
    } else if (status === PlayerStatus.ERROR) {
      // TODO: Dependant on SpotifyPlayer component will render if error occurrs
    } else {
      return (
        <img
          data-testid="album-art"
          id="album-art"
          src={props.albumUrl}
          className={styles.image}
          alt=""
          crossOrigin="anonymous"
        />
      );
    }
  };

  return (
    <Fragment>
      {status === PlayerStatus.LOADING ? (
        <div className={styles.blankImage}>
          <span>Loading...</span>
        </div>
      ) : (
        showAlbum()
      )}
    </Fragment>
  );
};

export default AlbumArt;
