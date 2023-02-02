import React from 'react'
import {FC, ChangeEvent} from 'react';

interface DescriptFunction {
    setDescript: (param: string) => void;
}

const Description: FC<DescriptFunction> = (props): JSX.Element => {

    const setDescriptHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {
        props.setDescript(event.target.value)
    }

    return (
        <div className='row text-nowrap'>
            <div className="col-3">
                <label className='form-label' htmlFor="description">Focus plan?</label>
            </div>
            <div className="offset-1 col">
                <textarea onChange={setDescriptHandler} className='form-control' name='description' cols={20} rows={1} placeholder='Studying for exam...'></textarea>
            </div>
        </div>
    )
}

export default Description; 