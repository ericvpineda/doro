import React, { FC, useEffect, Fragment } from "react";
import styles from "./AlbumArt.module.css";
import { FastAverageColor } from "fast-average-color";
      
interface Props {
  albumUrl: string;
  getDominantColorHandler: (param: string) => void;
}

// Note:
// - props variables and state variables that useState of prop will be updated when parent state variable updates
//  - does not update custom hooks
const AlbumArt: FC<Props> = (props: any) => {
  const fac = new FastAverageColor();

  useEffect(() => {
    if (props.albumUrl !== "") {
      const albumArt = document.getElementById("album-art") as HTMLImageElement;
      fac
        .getColorAsync(albumArt)
        .then((color) => {
          props.getDominantColorHandler(color["hex"]);
        })
        .catch((err) => {
          console.log("Unable to get average color from album art.");
          console.log(err);
        });
    }
  }, [props.albumUrl]);

  return (
    <Fragment>
      {props.albumUrl === "" ? (
        <img src="" alt="" />
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
