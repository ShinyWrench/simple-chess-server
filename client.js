const ChessGame = require('./ChessGame');
ChessGame.initEngine();
const fetch = require('node-fetch');
const { engine } = require('./constants');

// TODO:
//           Identify players in storage record with
//               name(in addition to ip address)-- use compound key?
//           Control whether to do console.log calls with a ChessGame
//               constructor object param
//           See if there are other ways to speed up gameplay
//           Keep track of black, white (?)
// TODO: (after all of the above)
//           Run multiple servers, hit with one client

const serverAddress = 'http://localhost:3000';

async function playOneGame() {
    // Resign if in the middle of a game
    let existingMoves = (
        await (await fetch(`${serverAddress}/moves?jsonresponse=true`)).json()
    ).moves;
    if (existingMoves.length > 0) {
        await fetch(`${serverAddress}/resign`);
    }

    // Start a ChessGame
    let chessGame = await ChessGame.startNewLocalGame();

    // Play a game against the server
    while (true) {
        let engineMove = await chessGame.makeEngineMove({
            depth: 8,
            skill: 20,
        });
        console.log(`My move: ${engineMove}`);
        let response = await (
            await fetch(
                `${serverAddress}/${engineMove}?jsonresponse=true&skill=18&depth=6`
            )
        ).json();
        if ('move' in response) {
            console.log(`Server move: ${response.move}`);
        }
        if ('status' in response) {
            console.log(`Server reports status '${response.status}'`);
            return;
        }
        await chessGame.move(response.move);
        if (chessGame.isGameOver()) {
            console.log(`${chessGame.getEndOfGameState()}`);
            return;
        }
    }
}

playOneGame()
    .then(() => {})
    .catch((err) => {
        console.log(
            `Error in calling playOneGame:\n${err.stack ? err.stack : err}`
        );
    });
