import React, { FC, useEffect } from "react";
import styles from "./Profile.module.css";
import {PlayerActions, Status} from "../../../Utils/SpotifyUtils";

interface Props {
  signOut: () => void;
}

const Profile: FC<Props> = (props) => {
  const [profileUrl, setProfileUrl] = React.useState("");

  const signOutHandler = () => {
    props.signOut();
  };

  useEffect(() => {
      chrome.runtime.sendMessage({ message: PlayerActions.GET_PROFILE }, (res) => {
        if (res.status === Status.SUCCESS) {
          setProfileUrl(res.data.profileUrl);
        } else if (res.status === Status.FAILURE) {
          console.log(res);
        } else if (res.status === Status.ERROR) {
          console.log(res);
        } else {
          console.log("Unknown error when getting profile url.");
        }
      })
  }, []);

  return (
    <div className={styles.background}>
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img src={profileUrl} className={styles.image} />
      </button>
      <ul className="dropdown-menu dropdown-menu-dark">
        <li onClick={signOutHandler} className="text-center">
          Sign out
        </li>
      </ul>
    </div>
  );
};

export default Profile;
