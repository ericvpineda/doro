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

    const setShowTimer = () => {
        props.setShowTimerHandler(false)
    }

    return (
        <Fragment>
            <div className={styles.body}>
                {props.accessToken === "" ? 
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

