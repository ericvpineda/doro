import React, {FC, Fragment, useEffect, useState} from 'react'
import Clock from '../Clock/Clock'
import FocusText from '../FocusText/FocusText'
import styles from './Timer.module.css'
import SpotifyPlayer from '../SpotifyPlayer/SpotifyPlayer'
import { GearFill } from "react-bootstrap-icons";

interface Prop {
    accessToken: string;
    setShowTimerHandler: (param: boolean) => void;
}

const Timer: FC<Prop> = (props) => {
    const [showPlayer, setShowPlayer] = useState(false)

    const setShowTimer = () => {
        props.setShowTimerHandler(false)
    }

    useEffect(() => {
        chrome.storage.sync.get(['signedIn'], (result) => {
            setShowPlayer(result.signedIn)
        })
    }, [])

    return (
        <Fragment>
            <div className={styles.body}>
                {showPlayer ? 
                    <Clock></Clock> :
                    <SpotifyPlayer accessToken={props.accessToken}></SpotifyPlayer>
                }
                <FocusText></FocusText>
            </div>
            <GearFill onClick={setShowTimer} className={styles.editButton}></GearFill>
        </Fragment>
    )
}

export default Timer

