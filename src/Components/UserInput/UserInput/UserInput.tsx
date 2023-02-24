import React from 'react'
import {FC, useState, Fragment, useContext} from 'react'
import Description from '../Description/Description';
import Time from '../Time/Time';
import styles from './UserInput.module.css'
import { ArrowReturnRight } from "react-bootstrap-icons";
import DescriptContext from '../../../hooks/DescriptContext';

interface pageUpdate {
    setShowTimerHandler: (param: boolean) => void;
}

const UserInput: FC<pageUpdate> = (props): JSX.Element => {
    
    const [showError, setShowError] = useState(false)
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [descript, setDescript] = useState('') 
    // TODO: Allow user to update default message
    const [defaultMsg, setDefaultMsg] = useState("Working...")
    const ctx = useContext(DescriptContext);

    const onSubmitHandler = () => {
        // TODO: Check for errors, if so, show error messgae 
        if (hours == 0 && minutes == 0) {
            setShowError(true)
        } else {
            chrome.storage.local.set({
                hours,
                minutes,
                seconds: 0,
                description: descript.length === 0 ? defaultMsg : descript,
                isRunning: true,
                setTime: {
                    hours, 
                    minutes
                },
                isCleared: false
            })
    
            // Prevent error message from showing
            setShowError(false)
    
            // Change page to timer gui window
            props.setShowTimerHandler(true)

            // Set description booleanto true 
            ctx.onSetDescript()
        } 
    }

    const showTimerHandler = () => {
        props.setShowTimerHandler(true)
    }

    return (
        <Fragment>
            <div className={styles.body + " d-flex flex-column justify-content-center"}>
                <h3 className='mb-3 text-center'>Set Timer</h3>
                <div className='container'>
                    <Time setHours={setHours} setMinutes={setMinutes}/>
                    <Description setDescript={setDescript} />
                </div>
                <button onClick={onSubmitHandler} className='btn btn-success mt-3'>Start</button>
                {showError && <div className='text-danger fs-6'>Input valid hours or minutes.</div>}
            </div>
            <ArrowReturnRight onClick={showTimerHandler} className={styles.clockButton}></ArrowReturnRight>
        </Fragment>
    )}

    export default UserInput;