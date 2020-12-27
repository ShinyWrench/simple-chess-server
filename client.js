const fetch = require('node-fetch');
const ChessGame = require('./ChessGame');

// TODO: Run multiple servers, hit with one client
//       Do S3 insert
//       See if there are other ways to speed up gameplay
//       Write tester(s)

function randomTrueOrFalse() {
    return Math.random() < 0.5;
}

async function playOneGame(params) {
    [
        'clientEngineSkill',
        'clientEngineDepth',
        'serverEngineSkill',
        'serverEngineDepth',
        'name',
    ].forEach((param) => {
        if (!(param in params)) {
            throw `Missing param ${param}`;
        }
    });

    let clientEngineSkill = params.clientEngineSkill;
    let clientEngineDepth = params.clientEngineDepth;
    let serverEngineSkill = params.serverEngineSkill;
    let serverEngineDepth = params.serverEngineDepth;
    let playerName = params.name;

    // Resign if in the middle of a game
    let status = await (
        await fetch(`${serverAddress}/status?player=${playerName}`)
    ).json();
    if (status.currentGame != null && status.currentGame.state === 'playing') {
        await fetch(`${serverAddress}/resign?player=${playerName}`);
    }

    console.log(
        `\nSet server engine skill ${serverEngineSkill} and server engine depth ${serverEngineDepth}.`
    );
    await fetch(
        `${serverAddress}/config?skill=${serverEngineSkill}&depth=${serverEngineDepth}&player=${playerName}`
    );

    // Start a local ChessGame with my color and engine details
    let chessGame = new ChessGame({
        engineSkill: clientEngineSkill,
        engineDepth: clientEngineDepth,
        debugGameLog: true,
    });

    // Pick a color at random
    let color = randomTrueOrFalse() === true ? 'white' : 'black';
    console.log(`\nStart game as ${color}.`);

    // Begin the game with the server
    let response = await (
        await fetch(
            `${serverAddress}/start?player=${playerName}&color=${color}`
        )
    ).json();

    // If we are black, play server's first move in the local ChessGame
    if (color === 'black') {
        await chessGame.move(response.move);
    }

    // Play (the rest of) the game against the server
    while (true) {
        let engineMove = (await chessGame.makeEngineMove()).fromTo;
        let response = await (
            await fetch(`${serverAddress}/${engineMove}?player=${playerName}`)
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

async function playForever(params) {
    while (true) {
        await playOneGame(params);
    }
}

const serverAddress = 'http://localhost:3000';

ChessGame.initEngine();

let userParams = {};
process.argv.forEach((arg) => {
    if (arg.includes('=')) {
        userParams[arg.split('=')[0]] = arg.split('=')[1];
    }
});

playForever(userParams)
    .then(() => {})
    .catch((err) => {
        console.log(
            `Error in calling playForever:\n${err.stack ? err.stack : err}`
        );
    });
