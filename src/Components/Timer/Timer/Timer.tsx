import React, {FC} from 'react'
import Clock from '../Clock/Clock'
import FocusText from '../FocusText/FocusText'
import styles from './Timer.module.css'

const Timer: FC = () => {
    return (
        <div className={styles.body}>
            <Clock></Clock>
            {/* <FocusText></FocusText> */}
        </div>
    )
}

export default Timer