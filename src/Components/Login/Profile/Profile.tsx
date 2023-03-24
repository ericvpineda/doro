import React, { FC, useEffect, useState } from "react";
import { PlayerActions, Status, PlayerStatus } from "../../../Utils/SpotifyUtils";
import { PersonCircle } from "react-bootstrap-icons";
import "./Profile.css"; // Needed for dropdown customization

// Parent is Login Compoenent
interface Props {
  signOut: () => void;
}

// Profile componenet
const Profile: FC<Props> = (props) => {
  const [profileUrl, setProfileUrl] = useState("");
  const [playerStatus, setPlayerStatus] = useState(PlayerStatus.LOADING)

  // Note: Causes parent to rerender
  const signOutHandler = () => {
    props.signOut();
  };

  // Note: Immediately get profile on open extension popup
  useEffect(() => {
    chrome.runtime.sendMessage(
      { message: PlayerActions.GET_PROFILE },
      (res) => {
        if (res.status === Status.SUCCESS) {
          setProfileUrl(res.data.profileUrl);
          setPlayerStatus(PlayerStatus.SUCCESS)
        } else if (res.status === Status.FAILURE) {
          console.log(res.error.message);
          props.signOut();
        } else if (res.status === Status.ERROR) {
          console.log(res.error.message);
          props.signOut();
        } else {
          console.log("Unknown error occured when getting profile url.");
        }
      }
    );
  }, []);

  const getProfile = () => {
    if (playerStatus === PlayerStatus.SUCCESS) {
      if (!profileUrl || profileUrl.length === 0) {
        return <PersonCircle data-testid="profile-pic-blank" className="image-stock"/>
      } else {
        return <img data-testid="profile-pic-filled" src={profileUrl} className="image" />
      }
    } 
    return <div data-testid="profile-pic-loading" className="image-loading"/>
  }

  return (
    <div className="background">
      <div className="btn-group">
        <button
          data-testid="profile-icon"
          className="btn btn-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {getProfile()}
        </button>
        <ul className="dropdown-menu dropdown-menu-dark">
          <li onClick={signOutHandler} className="dropdown-item">
            Sign out
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Profile;
