const fetch = require('node-fetch');
const ChessGame = require('./ChessGame');

// TODO:
//           Have ChessGame keep track of player names and black and white
//               whoever calls ChessGame.move should provide the player name
//                   (whether from outside the class or within another method)
//           Also track engine skill and depth
//           Identify players in storage record with
//               name(in addition to ip address)-- use compound key?
//           Control whether to do console.log calls with a ChessGame
//               constructor object param
//           See if there are other ways to speed up gameplay
//           Record total piece value differential for each side when game ends (+n or -n)
// TODO: (after all of the above)
//           Run multiple servers, hit with one client

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
