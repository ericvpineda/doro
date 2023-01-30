import React from 'react'
import Description from '../Description/Description';
import Time from '../Time/Time';

const UserInput: React.FC = () => {
    return (
        <div>
            {/* FIX: How to use forms in react  */}
            <form action="">
                <Time></Time>
                <Description></Description>
                <button></button>
            </form>
        </div>
    )
}

export default UserInput; 