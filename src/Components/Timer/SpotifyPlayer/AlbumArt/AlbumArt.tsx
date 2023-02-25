import React, { FC, Fragment } from "react";
import styles from "./AlbumArt.module.css";

interface Props {
  albumUrl: string;
}

// Note:
// - props variables and state variables that useState of prop will be updated when parent state variable updates
//  - does not update custom hooks
const AlbumArt: FC<Props> = (props: any) => {

  return (
    <Fragment>
      {props.albumUrl === "" ? (
        <div className={styles.blankImage}>
          <span>
            <a href="https://open.spotify.com/" target="_blank">
              Sign in
            </a>{" "}
            spotify <br></br> web player and <br></br>{" "}
            <mark className={styles.highlight}>PLAY a song</mark>!
          </span>
        </div>
      ) : (
        <img
          id="album-art"
          src={props.albumUrl}
          className={styles.image}
          alt=""
          crossOrigin="anonymous"
        />
      )}
    </Fragment>
  );
};

export default AlbumArt;
