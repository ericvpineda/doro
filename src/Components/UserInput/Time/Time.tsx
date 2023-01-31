import React from 'react'
import {FC, ChangeEvent} from 'react'

interface TimeValues {
    setHours: (param: number) => void,
    setMinutes: (param: number) => void
}

const Time: FC<TimeValues> = (props): JSX.Element => {
    const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
        props.setHours(+event.target.value)
    }
    
    const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
        props.setMinutes(+event.target.value)
    }

    return (
        <div className='d-flex flex-row'>
            <label className='form-label' htmlFor="hours">Hours</label>
            <input onChange={setHoursHandler} id="hours" className='form-control' type="number" min="0" max="24"/>
            <label className='form-label' htmlFor="minutes">Minutes</label>
            <input onChange={setMinutesHandler} id="minutes" className='form-control' type="number" min="0" max="59"/>
        </div>
    )
}

export default Time; 