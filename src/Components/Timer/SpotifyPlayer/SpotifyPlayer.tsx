import React, {FC, Fragment, useState, useEffect} from 'react'
import request from '../../Utils/SpotifyPlayerUtils';
import { PlayFill, SkipEndFill, SkipStartFill } from 'react-bootstrap-icons';

const SpotifyPlayer: FC = (props) => {
    const [artist, setArtist] = useState('')
    const [track, setTrack] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [accessToken, setAccessToken] = useState("")

    // Get accesstoken and initial track data (on initial load
    // - issue: multiple calls to spotify api
    //  - possible solutions:
    //      - save artist data into storage? 
    //          - issue: what if change track on diff device
    useEffect(() => {
        chrome.storage.local.get(["accessToken", "endTime", "signedIn"], (res) => {
            const currTime = new Date().getTime()
            if (res.signedIn && currTime < res.endTime) {
                request("GET", "/player/currently-playing", res.accessToken)
                .then((res) => res.json())
                .then((data) => {
                    setTrack(data.item.name)
                    setArtist(data.item.artists[0].name)
                    setImageUrl(data.item.album.images[0].url)
                    console.log(res.accessToken)
                    setAccessToken(res.accessToken)
                })
                .catch((e) => {console.log(e)})
            } 
        })
    }, [])

    const playHandler = () => {
        console.log("Playerhandler")
        request("PUT", "/player/pause", accessToken).then((res) => {console.log(res.json())}).catch((e) => {console.log(e)})
    }

    return (
        <Fragment>
            <div className="d-flex flex-column align-items-center">
                <img className="w-50 h-50 mb-3" src={imageUrl} alt="" />
                <div className='text-center mb-2'>
                    {/* <div className='text-white'>{track}</div> */}
                    <div className='text-white fst-italic fw-light'>{artist}</div>
                </div>
                <div>
                    <SkipStartFill className="me-2" color='white' size={20}></SkipStartFill>
                    <PlayFill onClick={playHandler} className="me-1" color='white' size={30}></PlayFill>
                    <SkipEndFill color='white' size={20}></SkipEndFill>
                </div>
            </div>
            {/* <button className="btn btn-success" onClick={getCurrentTrack}>Get Current</button> */}
        </Fragment>
    )
}

export default SpotifyPlayer;