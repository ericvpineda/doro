import React from 'react'
import {FC, useState, MouseEvent} from 'react'
import Description from '../Description/Description';
import Time from '../Time/Time';
import styles from './UserInput.module.css'

const UserInput: FC = () => {

    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [description, setDescript] = useState('') 

    const onClickHandler = () => {
        chrome.storage.local.set({
            hours,
            minutes,
            seconds: 0,
            description,
            isRunning: true,
            setTime: {
                hours, 
                minutes
            }
        })

        // REMOVE: 
        chrome.storage.local.get(["hours", "minutes"], (res) => {
            console.log("UserInput: hours=", res.hours, "minutes=", res.minutes)
        })
    }

    return (
        <div className={styles.body + " d-flex flex-column justify-content-center"}>
            <h3 className='mb-3 text-center'>Set Timer</h3>
            <div className='container'>
                <Time setHours={setHours} setMinutes={setMinutes}/>
                <Description setDescript={setDescript} />
            </div>

            <button onClick={onClickHandler} className='btn btn-success mt-3'>Submit</button>
        </div>
    )
}

export default UserInput; 