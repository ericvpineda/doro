import React, { FC, useEffect } from "react";
import {PlayerActions, Status} from "../../../Utils/SpotifyUtils";
import "./Profile.css";

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
          props.signOut()
        } else if (res.status === Status.ERROR) {
          console.log(res);
          props.signOut()
        } else {
          console.log("Unknown error when getting profile url.");
        }
      })
  }, []);

  return (
    <div className="background">
      <div className="btn-group">
        <button
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
        <img src={profileUrl} className="image"/>
        </button>
          <ul className="dropdown-menu dropdown-menu-dark">
            <li onClick={signOutHandler} className="dropdown-item">Sign out</li>
          </ul>
      </div>
    </div>
  );
};

export default Profile;
