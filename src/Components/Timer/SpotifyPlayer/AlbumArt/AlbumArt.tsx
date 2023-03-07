import React, { FC, Fragment, useState, useEffect } from "react";
import styles from "./AlbumArt.module.css";
import { PlayerStatus } from "../../../../Utils/SpotifyUtils";

// Parent component: SpotifyPlayer
interface Props {
  albumUrl: string;
  playerStatus: PlayerStatus;
}

// - Assumptions: every album, if exits in spotify, will have album artwork
const AlbumArt: FC<Props> = (props: any) => {
  const [status, setStatus] = useState(PlayerStatus.LOADING);
  const [previousStatus, setPreviousStatus] = useState(PlayerStatus.LOADING);

  console.log("Rendered album artwork");
  // Update based on parent components player status
  useEffect(() => {
    setPreviousStatus(status);
    setStatus(props.playerStatus);
  }, [props.playerStatus]);

  // Show album artwork or webpage sign in prompt
  const showAlbum = () => {
    if (status === PlayerStatus.LOADING) {
      return <div/>
    } else if (status === PlayerStatus.REQUIRE_WEBPAGE) {
      return (
        <div className={styles.blankImage}>
          <span className={styles.blankImageText}>
            <a href="https://open.spotify.com/" target="_blank">
              Sign in
            </a>{" "}
            spotify <br></br> web player and <br></br>{" "}
            <mark className={styles.highlight}>PLAY a song</mark>!
          </span>
        </div>
      );
    } else if (status === PlayerStatus.AD_PLAYING) {
      const adStyles =
        previousStatus === PlayerStatus.LOADING
          ? styles.adWithAnimation
          : styles.ad;
      return (
        <div className={adStyles}>
          <span>Ad is currently playing...</span>
        </div>
      );
    } else if (status === PlayerStatus.ERROR) {
      // TODO-LATER: Dependant on SpotifyPlayer component will render if error occurrs
    } else {
      const imageStyles =
        previousStatus === PlayerStatus.LOADING
          ? styles.imageWithAnimation
          : styles.image;
      return (
        <img
          data-testid="album-art"
          id="album-art"
          src={props.albumUrl}
          className={imageStyles}
          alt=""
          crossOrigin="anonymous"
        />
      );
    }
  };

  // Note: Loading page until parent gets item information and updates status
  return (
    <Fragment>
      {showAlbum()}
    </Fragment>
  );
};

export default AlbumArt;
