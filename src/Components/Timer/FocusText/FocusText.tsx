import React, {FC, useState, Fragment} from 'react'
import styles from './FocusText.module.css'

const FocusText: FC = () => {

    const [description, setDescription] = useState("")
    
    // Note: Will be rerendered by App.tsx when change window 
    chrome.storage.local.get(["description"], (res) => {
        setDescription(res.description)
    })

    return (
            <Fragment>
                {description === undefined ?
                <footer className={styles.focusBox}>Doro</footer> :
                <footer className={styles.focusBox}>Task: <span className={styles.description}>{description}</span></footer>
                }
            </Fragment>
    )
}

export default FocusText