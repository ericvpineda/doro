import React, {FC, useEffect} from 'react'
import styles from './Profile.module.css'
import request from '../../Utils/SpotifyPlayerUtils';

interface Props {
    signOut: (param: boolean) => void
}

const Profile: FC<Props> = (props) => {
  const [profileUrl, setProfileUrl] = React.useState("")

  const signOutHandler = () => {
    props.signOut(true)
  }

  useEffect(() => {
    chrome.storage.local.get(['accessToken', 'profileUrl', 'signedIn'], (res) => {
      if (res.signedIn && res.profileUrl != "") {
          setProfileUrl(res.profileUrl)
        } else if (res.accessToken) {
              request("GET", "", res.accessToken)
              .then(res => {return res.json()})
              .then((data) => {
                  setProfileUrl(data.images[0].url)
                  chrome.storage.local.set({'profileUrl': data.images[0].url})
              })
          }
      })
  }, [])

  return (
    <div className={styles.background}>
        <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <img src={profileUrl} className={styles.image}/>
        </button>
        <ul className="dropdown-menu dropdown-menu-dark">
            <li onClick={signOutHandler} className="text-center">Sign out</li>
        </ul>
    </div>
  )
}

export default Profile;