import React from 'react'
import {FC, ChangeEvent, Fragment} from 'react'

interface TimeFunctions {
    setHours: (param: number) => void,
    setMinutes: (param: number) => void
}

const Time: FC<TimeFunctions> = (props): JSX.Element => {
    const setHoursHandler = (event: ChangeEvent<HTMLInputElement>) => {
        props.setHours(+event.target.value)
    }
    
    const setMinutesHandler = (event: ChangeEvent<HTMLInputElement>) => {
        props.setMinutes(+event.target.value)
    }

    return (
        <Fragment>
            <div className='row'>
                <div className="col-3">
                    <label className='form-label' htmlFor="hours">Hours</label>
                </div>
                <div className="offset-1 col">
                    <input onChange={setHoursHandler} id="hours" className='form-control' type="number" min="0" max="24" placeholder='Set hours...'/>
                </div>
            </div>
            
            <div className='row'>
                <div className="col-3">
                    <label className='form-label' htmlFor="minutes">Minutes</label>
                </div>
                <div className="offset-1 col">
                    <input onChange={setMinutesHandler} id="minutes" className='form-control' type="number" min="0" max="59" placeholder='Set minutes...'/>
                </div>
            </div>
        </Fragment>
    )
}

export default Time; 