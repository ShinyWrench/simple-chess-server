const ChessGame = require('./ChessGame');
ChessGame.initEngine();
const fetch = require('node-fetch');
const { engine } = require('./constants');

// TODO: Clean and commit current work
// TODO (next commit):
//          Fix this: when server responds with "move,endofgamestate", the
//          engine command after right here isn't working (and that's why
//          the last move is not displayed in the log. Fix this by doing a
//          JSON response from the server with move and state instead of a
//          string.
//          (temp fix is in place for now: replace as described above)
// TODO: (spread across commits after last commit):
//           Identify players in storage record with
//               name(in addition to ip address)-- use compound key?
//           Control whether to do console.log calls with a ChessGame
//               constructor object param
//           Make move request with optional query params
//              .../e2e4&depth=7&error=...
//           See if there are other ways to speed up gameplay
//           Keep track of black, white (?)
// TODO: (after all of the above)
//           Run multiple servers, hit with one client

const serverAddress = 'http://localhost:3000';

async function playOneGame() {
    // Resign if in the middle of a game
    let existingMoves = await (await fetch(`${serverAddress}/moves`)).text();
    if (existingMoves.length > 0) {
        await fetch(`${serverAddress}/resign`);
    }

    // Start a ChessGame
    let chessGame = await ChessGame.startNewLocalGame();

    // Play a game against the server
    while (true) {
        let engineMove = await chessGame.makeEngineMove(7);
        console.log(`My move: ${engineMove}`);
        let serverMove = await (
            await fetch(`${serverAddress}/${engineMove}`)
        ).text();
        console.log(`Server move: ${serverMove}`);
        if (serverMove.includes(',')) {
            serverMove = serverMove.split(',')[0];
        }
        serverMove = await chessGame.move(serverMove);
        if (chessGame.isGameOver()) {
            console.log(`${chessGame.getEndOfGameState()}`);
            return;
        }
    }
}

playOneGame()
    .then(() => {})
    .catch((err) => {
        console.log(`Error in calling playOneGame:\n${err}`);
    });
