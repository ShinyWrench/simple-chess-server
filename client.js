const fetch = require('node-fetch');
const ChessGame = require('./ChessGame');

// TODO:
//           Clean up / minimize console.logs
//               Control whether to do console.log calls with a ChessGame
//                   constructor object param (?)
//           Handle end of game messages (also create single/few point(s) for S3 insert)
//           See if there are other ways to speed up gameplay
//           Record total piece value differential for each side when game ends (+n or -n)
//           Add timestamps
// TODO: (after all of the above)
//           Run multiple servers, hit with one client
//           Do S3 insert
//           Write tester(s)

ChessGame.initEngine();

const serverAddress = 'http://localhost:3000';

function randomTrueOrFalse() {
    return Math.random() < 0.5;
}

async function playOneGame() {
    // Resign if in the middle of a game
    let status = await (
        await fetch(`${serverAddress}/status?jsonresponse=true&player=Billy`)
    ).json();
    if (status.currentGame != null && status.currentGame.state === 'playing') {
        await fetch(`${serverAddress}/resign?jsonresponse=true&player=Billy`);
    }

    // Set opponent engine skill and depth for player
    await fetch(
        `${serverAddress}/config?jsonresponse=true&skill=17&depth=10&player=Billy`
    );

    // Start a local ChessGame with my color and engine details
    let chessGame = new ChessGame({
        engineSkill: 18,
        engineDepth: 8,
    });

    // Pick a color at random
    let color = randomTrueOrFalse() === true ? 'white' : 'black';
    console.log(`color: ${color}`);

    // Begin the game with the server
    let response = await (
        await fetch(
            `${serverAddress}/start?jsonresponse=true&player=Billy&color=${color}`
        )
    ).json();

    // If we are black, play server's first move in the local ChessGame
    if (color === 'black') {
        await chessGame.move(response.move);
    }

    // Play (the rest of) the game against the server
    while (true) {
        let engineMove = await chessGame.makeEngineMove();
        console.log(`My move: ${engineMove}`);
        let response = await (
            await fetch(
                `${serverAddress}/${engineMove}?jsonresponse=true&player=Billy`
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
