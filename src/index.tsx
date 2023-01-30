import React from 'react';
import {createRoot} from 'react-dom/client'
import App from './App';

// Dummy component that will serve as html file
const container = document.createElement('div')
document.body.appendChild(container)

// Root of react project (similar to create-react-app)
const root = createRoot(container)
root.render(
    <App/>
)
