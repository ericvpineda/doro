import React, {FC, Fragment, useEffect, useState} from 'react'
import UserInput from './Components/UserInput/UserInput/UserInput'
import Timer from './Components/Timer/Timer/Timer'
import styles from './App.module.css'

const App: FC = () => {
    const [showTimer, setShowTimer] = useState(false); 

    // Set current window 
    const onClickHandler = () => {
        setShowTimer(!showTimer)
    }

    return (
        <Fragment>
            {!showTimer && <UserInput setShowTimerHandler={setShowTimer}></UserInput>}
            {showTimer && <Timer/>}
            {/* FIX: Update edit button  */}
            <button onClick={onClickHandler} className={styles.editBtn + " btn btn-primary"}>Edit</button>
        </Fragment>
    )
} 

export default App; 