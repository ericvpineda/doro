const request = async (method: string, path: string, accessToken: string) => {
    const url = new URL("https://api.spotify.com/v1/me/player" + path);
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      };
    return await fetch(url.href, {method , headers})
    
}

export default request;