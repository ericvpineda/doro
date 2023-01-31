import React from 'react'
import {FC} from 'react'
import UserInput from './Components/UserInput/UserInput/UserInput'
import styles from './App.module.css'

const App: FC = () => {
    
    return (
        <div className={styles.body}>
            <UserInput></UserInput>
        </div>
    )
} 

export default App; 