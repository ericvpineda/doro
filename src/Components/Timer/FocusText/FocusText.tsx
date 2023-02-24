import React, {FC, useState, Fragment, useContext} from 'react'
import styles from './FocusText.module.css'
import DescriptContext from '../../../hooks/DescriptContext'

const FocusText: FC = () => {

    const [description, setDescription] = useState("")
    const ctx = useContext(DescriptContext)
    
    // Note: Will be rerendered by App.tsx when change window 
    chrome.storage.local.get(["description"], (res) => {
        setDescription(res.description)
    })

    return (
            <Fragment>
                {ctx.showDescript ?
                <footer className={styles.focusBox}>Doro</footer> :
                <footer className={styles.focusBox}>Task: <span className={styles.description}>{description}</span></footer>
                }
            </Fragment>
    )
}

export default FocusText