import React, {FC, Fragment} from 'react'

interface Prop {
    accessToken: string;
}

const SpotifyPlayer: FC<Prop> = (props) => {
    const [artist, setArtist] = React.useState('')
    const [title, setTitle] = React.useState('')


    // const getState = async (method: string, path: string) => {
    //     const url = new URL("https://api.spotify.com/v1/me/player" + path);
    //     const headers = {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer ${props.accessToken}`
    //       };
    //     return await fetch(url.href, {method , headers})
    //       .then((res) => res.json())
    //       .then((data) => console.log(data))
    //       .catch((e) => console.log(e));
    // }

    return (
        <Fragment>
            <div>Spotify Player</div>
            {/* <button className="btn btn-success"onClick={() => getState("GET", "")}>Get state</button> */}
        </Fragment>
    )
}

export default SpotifyPlayer;