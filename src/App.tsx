import React, {FC, Fragment, useEffect, useState} from 'react'
import UserInput from './Components/UserInput/UserInput/UserInput'
import Timer from './Components/Timer/Timer/Timer'
// import styles from './App.module.css'

const App: FC = () => {
    const [isRunning, setIsRunning] = useState(false); 

    // Updates isRunning variable on chrome storage change
    useEffect(() => {
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            if ("isRunning" in changes) {
                setIsRunning(changes.isRunning.newValue)
            }
        })
        
    },[isRunning])

    return (
        <Fragment>
            {!isRunning && <UserInput/>}
            {isRunning && <Timer/>}
        </Fragment>
    )
} 

export default App; 