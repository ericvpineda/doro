import React, { FC, useEffect, useState } from "react";
import { PlayerActions, Status } from "../../../Utils/SpotifyUtils";
import { PersonCircle } from "react-bootstrap-icons";
import "./Profile.css"; // Needed for dropdown customization

// Parent is Login Compoenent
interface Props {
  signOut: () => void;
}

// Profile componenet
const Profile: FC<Props> = (props) => {
  const [profileUrl, setProfileUrl] = useState("");

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
          {profileUrl.length === 0 ? (
            <PersonCircle data-testid="profile-pic-blank" className="image-default"></PersonCircle>
          ) : (
            <img data-testid="profile-pic-filled" src={profileUrl} className="image" />
          )}
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
