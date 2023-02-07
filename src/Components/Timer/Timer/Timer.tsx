import React, {FC} from 'react'
import Clock from '../Clock/Clock'
import FocusText from '../FocusText/FocusText'
import styles from './Timer.module.css'
import SpotifyPlayer from '../../SpotifyPlayer/SpotifyPlayer'

const Timer: FC = () => {

    return (
        <div className={styles.body}>
            <Clock></Clock>
            {/* <SpotifyPlayer></SpotifyPlayer> */}
            <FocusText></FocusText>
        </div>
    )
}

export default Timer

