import React, {FC, useEffect, useState} from 'react'
import styles from './Clock.module.css'

const Clock: FC = (): JSX.Element => {

    let progressRing: any;
    const incrementRing = () => {
        if (progressRing) {
            progressRing.style.background = `conic-gradient(
                #212529 100deg,
                lightgreen 100deg
            )`
        }
    }

    const [time, setTime] = useState({
        hours: "00",
        minutes: "00",
        seconds: "00"
    });
   
    // Initial re-render
    useEffect(() => {
        chrome.storage.local.get(["hours", "minutes"], (res) => {
            if (res.hours != null && res.minutes != null) {
                let hours = res.hours >= 10 ? res.hours.toString() : "0" + res.hours
                let minutes = res.minutes >= 10 ? res.minutes.toString() : "0" + res.minutes
                setTime({
                    ...time,
                    hours,
                    minutes
                })
            }
        })
    }, [])

    // Note: Assumed that isRunning is true
    useEffect(() => {
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            // console.log("Chrome storage local=", res.hours, res.minutes, res.seconds)
          
            if ("hours" in changes) {
                let updateHours: number = changes.hours.newValue
                let hours: string = updateHours >= 10 ? updateHours.toString() : "0" + updateHours
                setTime({
                    hours,
                    minutes: "00",
                    seconds: "00",
                })
            } else if ("minutes" in changes) {
                let updateMinutes: number = changes.minutes.newValue
                let minutes: string = updateMinutes >= 10 ? updateMinutes.toString() : "0" + updateMinutes
                setTime({
                    ...time,
                    minutes,
                    seconds: "00"
                })
            } else if ("seconds" in changes) {
                let updateSeconds: number = changes.seconds.newValue
                let seconds: string = updateSeconds >= 10 ? updateSeconds.toString() : "0" + updateSeconds;
                setTime({
                    ...time,
                    seconds
                })            
            }
        })
        progressRing = document.getElementById("timer-outer");
        incrementRing()
    }, [time])

    

    return (
        <div>
            <div id="timer-outer" className={styles.timerOuter}>
                <div className={styles.timerRing}>
                    <div className={styles.timer}>
                        <span id="hours">{time.hours}</span>
                        <span>:</span>
                        <span id="minutes">{time.minutes}</span>
                        <span>:</span>
                        <span id="seconds">{time.seconds}</span>
                    </div>
                    {/* <!-- FIX: Change out with picture later  --> */}
                    <div className={styles.timerControl} id="timer-control">Start</div>
                </div>
            </div>
        </div>
    )
}

export default Clock