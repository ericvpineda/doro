import React, {FC, useEffect, useState, MouseEvent} from 'react'
import styles from './Clock.module.css'

const Clock: FC = () => {

    const [timer, setTimer] = useState({ hours: "00", minutes: "00", seconds: "00" });
    const [controlText, setControlText] = useState("Start")

    const updateTime = () => {
        const progressRing = document.getElementById("timer-outer")! as HTMLElement;
        chrome.storage.local.get(["hours", "minutes", "seconds", "isRunning", "setTime"], (res) => {
            
            if (res.isRunning) {
                // Update clock time ui 
                const hours: string = res.hours >= 10 ? res.hours.toString() : "0" + res.hours
                const minutes: string = res.minutes >= 10 ? res.minutes.toString() : "0" + res.minutes
                const seconds: string = res.seconds >= 10 ? res.seconds.toString() : "0" + res.seconds
                setTimer({ hours, minutes, seconds })
                
                // Update clock gui
                const curr_time: number = (res.hours * 3600) + (res.minutes * 60) + res.seconds
                const end_time: number = res.setTime.hours * 3600 + res.setTime.minutes * 60
                const degree: number = 360 - ((curr_time / end_time) * 360)
                console.log(degree, curr_time, end_time, curr_time/end_time)
                progressRing.style.background = `conic-gradient(
                    lightgreen ${degree}deg,
                    #212529 ${degree}deg 
                )`
            } 
            // else {
            //     // Update clock gui
            //     progressRing.style.background = `conic-gradient(#212529 0deg, lightgreen 0deg )`
            // }
        })
    }

    const setControlTextHandler = () => {
        chrome.storage.local.get(["isRunning", "hours", "minutes", "seconds"], (res) => {
            
            // FIX: Improve way to check start and stop button 
            if (!(res.hours == 0 && res.minutes == 0 && res.seconds == 0)) {
                chrome.storage.local.set({ isRunning: !res.isRunning })
                setControlText(res.isRunning ? "Pause" : "Start")
            }  
        })
    }
   
    // Initial re-render (allow initial set timer to show up)
    useEffect(() => { updateTime() }, [])

    // Note: Assumed that isRunning is true
    useEffect(() => {
        chrome.storage.onChanged.addListener(() => { updateTime() })
    }, [])

    

    return (
        <div>
            <div id="timer-outer" className={styles.timerOuter}>
                <div className={styles.timerRing}>
                    <div className={styles.timer}>
                        <span id="hours">{timer.hours}</span>
                        <span>:</span>
                        <span id="minutes">{timer.minutes}</span>
                        <span>:</span>
                        <span id="seconds">{timer.seconds}</span>
                    </div>
                    {/* <!-- FIX: Change out with picture later  --> */}
                    <div onClick={() => setControlTextHandler()} className={styles.timerControl} id="timer-control">
                        {controlText}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Clock