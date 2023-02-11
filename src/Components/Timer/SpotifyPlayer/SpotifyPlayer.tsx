import React, {FC, Fragment, useState, useEffect} from 'react'
import request from '../../Utils/SpotifyPlayerUtils';
import { PlayFill, SkipEndFill, SkipStartFill } from 'react-bootstrap-icons';

interface Prop {
    accessToken: string;
}

const SpotifyPlayer: FC<Prop> = (props) => {
    const [artist, setArtist] = useState('')
    const [track, setTrack] = useState('')
    const [accessToken, setAccessToken] = useState("")
   

    // Get initial track data (on initial load)
    useEffect(() => {
        // Note: will not render immediately 
        setAccessToken(props.accessToken)
        if (props.accessToken !== "") {
            request("GET", "/currently-playing", props.accessToken)
            .then((res) => res.json())
            .then((data) => {
                setTrack(data.item.name)
                setArtist(data.item.artists[0].name)
            })
            .catch((e) => {console.log(e)})
        }
        
    }, [props.accessToken])
 
    return (
        <Fragment>
            <div className="d-flex flex-column align-items-center">
                <img className="w-50 h-50 mb-3" src="https://images.unsplash.com/photo-1515405295579-ba7b45403062?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=580&q=80" alt="" />
                <div className='text-center mb-2'>
                    <div className='text-white'>{track}</div>
                    <div className='text-white fst-italic fw-light'>{artist}</div>
                </div>
                <div>
                    <SkipStartFill className="me-2" color='white' size={20}></SkipStartFill>
                    <PlayFill className="me-1" color='white' size={30}></PlayFill>
                    <SkipEndFill color='white' size={20}></SkipEndFill>
                </div>
            </div>
            {/* <button className="btn btn-success" onClick={getCurrentTrack}>Get Current</button> */}
        </Fragment>
    )
}

export default SpotifyPlayer;