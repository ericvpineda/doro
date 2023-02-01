import React from 'react'
import {FC} from 'react';

interface DescriptFunction {
    setDescript: (param: string) => void;
}

const Description: FC<DescriptFunction> = (prop): JSX.Element => {
    return (
        <div className='row text-nowrap'>
            <div className="col-3">
                <label className='form-label' htmlFor="description">Focus plan?</label>
            </div>
            <div className="offset-1 col">
                <textarea className='form-control' name='description' cols={20} rows={1} placeholder='Studying for exam...'></textarea>
            </div>
        </div>
    )
}

export default Description; 