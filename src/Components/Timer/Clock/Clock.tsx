import React, {FC, useEffect, useState} from 'react'
import styles from './Clock.module.css'

const Clock: FC = () => {

    let progressRing: any;
    const incrementRing = () => {
        if (progressRing) {
            progressRing.style.background = `conic-gradient(
                #212529 100deg,
                lightgreen 100deg
            )`
        }
    }

    const [hours, setHours] = useState("00");
    const [minutes, setMinutes] = useState("00");
    const [seconds, setSeconds] = useState("00");


    // Note: Assumed that isRunning is true
    useEffect(() => {
        
        // REMOVE:
        console.log("Initiating clock...")
        chrome.storage.local.get(["hours", "minutes", "seconds"], (res) => {
            // console.log("Chrome storage local=", res.hours, res.minutes, res.seconds)
            if (res.hours != hours) {
                let updateHour: number = res.hours.newValue
                setHours(updateHour >= 10 ? updateHour.toString() : "0" + updateHour)
            }
            if (res.minutes != minutes) {
                let updateMinutes: number = res.minutes.newValue
                setMinutes(updateMinutes >= 10 ? updateMinutes.toString() : "0" + updateMinutes)
            }
            if (res.seconds != seconds) {
                let updateSeconds: number = res.seconds.newValue
                setSeconds(updateSeconds >= 10 ? updateSeconds.toString() : "0" + updateSeconds)            
            }
        })
    
        progressRing = document.getElementById("timer-outer");
        incrementRing()
    }, [hours, minutes, seconds])

    chrome.storage.onChanged.addListener(function(changes, namespace) {
            
        console.log("Clock change listener")
        console.log(changes)


    })

    return (
        <div>
            <div id="timer-outer" className={styles.timerOuter}>
                <div className={styles.timerRing}>
                    <div className={styles.timer}>
                        <span id="hours">{hours}</span>
                        <span>:</span>
                        <span id="minutes">{minutes}</span>
                        <span>:</span>
                        <span id="seconds">{seconds}</span>
                    </div>
                    {/* <!-- FIX: Change out with picture later  --> */}
                    <div className={styles.timerControl} id="timer-control">Start</div>
                </div>
            </div>
        </div>
    )
}

export default Clock