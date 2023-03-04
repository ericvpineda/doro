import React from 'react';
import {render, screen} from "@testing-library/react"
import "@testing-library/jest-dom"
import AlbumArt from '../../../Components/Timer/SpotifyPlayer/AlbumArt/AlbumArt';
import {chrome} from "jest-chrome"
import { PlayerStatus } from '../../../Utils/SpotifyUtils';
import userEvent from "@testing-library/user-event"

//Test Points
// - player status loading
// - player status require webpage 
// - player status success 

describe("Test AlbumArt component", () => {
    
    it("player status loading shows the loading screen", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.LOADING}></AlbumArt>)
        const loadingText = screen.getByText("Loading...");
        expect(loadingText).toBeVisible();
    })

    it("player status success show correct album art link", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.SUCCESS}></AlbumArt>)
        const albumArt = screen.getByTestId("album-art");
        expect(albumArt).toBeVisible();
    })
    it("player status require webpage shows requirement prompt into webpage and play song", () => {
        render(<AlbumArt albumUrl={""} playerStatus={PlayerStatus.REQUIRE_WEBPAGE}></AlbumArt>)
        const signInPromptP1 = screen.getByText("Sign in");
        const signInPromptP4 = screen.getByText("PLAY a song");

        expect(signInPromptP1).toBeVisible();
        expect(signInPromptP4).toBeVisible();
    })
})