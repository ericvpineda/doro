import React, {FC, useState, useEffect} from 'react'
import styles from './FocusText.module.css'

const FocusText: FC = () => {

    const [description, setDescription] = useState("")
    
    // Note: Will be rerendered by App.tsx when change window 
    chrome.storage.local.get(["description"], (res) => {
        setDescription(res.description)
    })

    return (
        <footer className={styles.focusBox}>
            <div>Task: <span className={styles.description}>{description}</span></div>
        </footer>
    )
}

export default FocusText