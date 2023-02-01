import React from 'react';
import {createRoot} from 'react-dom/client'
import App from './App';
// Order import css before to prevent overwrite 
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min"
import './index.css'

// Set chrome storage variables
chrome.storage.local.set({
    hours: 0,
    minutes: 0,
    seconds: 0,
    description: "",
    isRunning: false,
    setTime: null
})

// Dummy component that will serve as html file
const container = document.createElement('main')
document.body.appendChild(container)

// Root of react project (similar to create-react-app)
const root = createRoot(container)
root.render(
    <App/>
)
