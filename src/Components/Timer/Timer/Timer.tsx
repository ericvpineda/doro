import React, {FC, Fragment, useEffect, useState} from 'react'
import Clock from '../Clock/Clock'
import FocusText from '../FocusText/FocusText'
import styles from './Timer.module.css'
import SpotifyPlayer from '../SpotifyPlayer/SpotifyPlayer'
import { GearFill } from "react-bootstrap-icons";

interface Prop {
    showPlayer: boolean;
    setShowTimerHandler: (param: boolean) => void;
}

const Timer: FC<Prop> = (props) => {
    const [showPlayer, setShowPlayer] = useState(false)

    const setShowTimer = () => {
        props.setShowTimerHandler(false)
    }
    console.log("Render timer")
    // Note:
    // - how to change what is shown based on whether user is signed in 
    // - need something in component to re-render
    //  - doesnt work
    //   - listen to storage local changes -- will rerun component many times (once timer on)
    useEffect(() => {
        chrome.storage.local.get(['signedIn'], (result) => {
            console.log("Signed in=", result)
            setShowPlayer(result.signedIn)
        })
    }, [props.showPlayer])

    return (
        <Fragment>
            <div className={styles.body}>
                {showPlayer ? 
                    <SpotifyPlayer></SpotifyPlayer> :
                    <Clock></Clock>
                }
                <FocusText></FocusText>
            </div>
            <GearFill onClick={setShowTimer} className={styles.editButton}></GearFill>
        </Fragment>
    )
}

export default Timer

