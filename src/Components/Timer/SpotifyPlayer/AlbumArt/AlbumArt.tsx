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

  // Update based on parent components player status
  useEffect(() => {
    setPreviousStatus(status);
    setStatus(props.playerStatus);
  }, [props.playerStatus, previousStatus]);

  // Show prompt/window to user based on player current player status
  const showAlbum = () => {
    switch (status) {
      case PlayerStatus.LOADING:
        return <Fragment />;
      case PlayerStatus.REQUIRE_WEBPAGE:
        return (
          <div className={styles.textContainer}>
            <span className={styles.signInText}>
              <a href="https://open.spotify.com/" target="_blank">
                Sign in
              </a>{" "}
              spotify <br></br> web player and <br></br>{" "}
              <mark className={styles.highlight}>PLAY a song</mark>!
            </span>
          </div>
        );
      case PlayerStatus.AD_PLAYING:
        const adStyles =
          previousStatus === PlayerStatus.LOADING
            ? styles.adWithAnimation
            : styles.ad;
        return (
          <div className={adStyles}>
            <span>Ad is currently playing...</span>
          </div>
        );
      case PlayerStatus.SUCCESS:
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
      default:
        return (
          <div className={styles.textContainer}>
            <span className={styles.errorText}>
              Error occured, please{" "}
              <mark className={styles.highlight}>
                close and<br/>reopen extension.
              </mark>
            </span>
          </div>
        );
    }
  };

  return <Fragment>{showAlbum()}</Fragment>;
};

export default AlbumArt;
