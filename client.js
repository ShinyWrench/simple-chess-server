const fetch = require('node-fetch');
const ChessGame = require('./ChessGame');

// TODO:
//           Handle end of game messages (also create single/few point(s) for S3 insert)
//           Record total piece value differential for each side when game ends (+n or -n)
//           See if there are other ways to speed up gameplay
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
        await fetch(`${serverAddress}/status?player=Billy`)
    ).json();
    if (status.currentGame != null && status.currentGame.state === 'playing') {
        await fetch(`${serverAddress}/resign?player=Billy`);
    }

    // Set opponent engine skill and depth for player
    let serverEngineSkill = 17;
    let serverEngineDepth = 6;

    console.log(
        `Set server engine skill ${serverEngineSkill} and server engine depth ${serverEngineDepth}.`
    );
    await fetch(
        `${serverAddress}/config?skill=${serverEngineSkill}&depth=${serverEngineDepth}&player=Billy`
    );

    // Start a local ChessGame with my color and engine details
    let chessGame = new ChessGame({
        engineSkill: 18,
        engineDepth: 5,
        debugGameLog: true,
    });

    // Pick a color at random
    let color = randomTrueOrFalse() === true ? 'white' : 'black';
    console.log(`Start game as ${color}.`);

    // Begin the game with the server
    let response = await (
        await fetch(`${serverAddress}/start?player=Billy&color=${color}`)
    ).json();

    // If we are black, play server's first move in the local ChessGame
    if (color === 'black') {
        await chessGame.move(response.move);
    }

    // Play (the rest of) the game against the server
    while (true) {
        let engineMove = (await chessGame.makeEngineMove()).fromTo;
        let response = await (
            await fetch(`${serverAddress}/${engineMove}?player=Billy`)
        ).json();
        if ('move' in response) {
            await chessGame.move(response.move);
        }
        if (chessGame.isGameOver()) {
            let lastMove = chessGame.getLastMoveInfo();
            if (lastMove.result === 'checkmate') {
                if (color === lastMove.color) {
                    console.log('Client won.');
                } else {
                    console.log('Client lost.');
                }
            }
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
