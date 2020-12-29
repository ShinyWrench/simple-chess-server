const fetch = require('node-fetch');
const ChessGame = require('../common/ChessGame');
const fs = require('fs');
let argv = require('minimist')(process.argv.slice(2));

const SERVER_LIST_JSON_DEFAULT_PATH = 'serverList_default.json';
const SERVER_LIST_JSON_USER_PATH = 'serverList.json';

// TODO: Do S3 insert
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

async function playServers(params) {
    let servers = params.servers;

    // Prepare each server
    for (let i = 0; i < servers.length; i++) {
        // Resign if player has a game in progress
        let status = await (
            await fetch(
                `${servers[i].address}/status?player=${servers[i].clientName}`
            )
        ).json();
        if (
            status.currentGame != null &&
            status.currentGame.state === 'playing'
        ) {
            await fetch(
                `${servers[i].address}/resign?player=${servers[i].clientName}`
            );
        }

        // Set server engine skill and depth for player
        console.log(
            `On server '${servers[i].address}', set server engine skill ${servers[i].serverEngine.engineSkill} and server engine depth ${servers[i].serverEngine.engineDepth}.`
        );
        await fetch(
            `${servers[i].address}/config?skill=${servers[i].serverEngine.engineSkill}&depth=${servers[i].serverEngine.engineDepth}&player=${servers[i].clientName}`
        );
    }

    while (true) {
        for (let i = 0; i < servers.length; i++) {
            if (
                !servers[i].chessGame ||
                servers[i].chessGame == null ||
                servers[i].chessGame.isGameOver()
            ) {
                // If game is over, start a new game
                let chessGame = new ChessGame({
                    engineSkill: servers[i].clientEngine.engineSkill,
                    engineDepth: servers[i].clientEngine.engineDepth,
                    debugGameLog: true,
                });

                servers[i].chessGame = chessGame;

                // Pick a color at random
                let playerColor =
                    randomTrueOrFalse() === true ? 'white' : 'black';
                servers[i].playerColor = playerColor;
                console.log(
                    `On server '${servers[i].address}', start game as ${playerColor}.`
                );
                // Begin the game with the server
                let response = await (
                    await fetch(
                        `${servers[i].address}/start?player=${servers[i].clientName}&color=${playerColor}`
                    )
                ).json();
                // If we are black, play server's first move in the local ChessGame
                if (playerColor === 'black') {
                    await chessGame.move(response.move);
                }
            } else {
                // Otherwise, play a move
                let chessGame = servers[i].chessGame;
                let engineMove = (await chessGame.makeEngineMove()).fromTo;
                let response = await (
                    await fetch(
                        `${servers[i].address}/${engineMove}?player=${servers[i].clientName}`
                    )
                ).json();
                if ('move' in response) {
                    await chessGame.move(response.move);
                }
                if (chessGame.isGameOver()) {
                    let lastMove = chessGame.getLastMoveInfo();
                    if (lastMove.result === 'checkmate') {
                        if (servers[i].playerColor === lastMove.color) {
                            console.log(
                                `Against server '${servers[i].address}', client won.`
                            );
                        } else {
                            console.log(
                                `Against server '${servers[i].address}', client lost.`
                            );
                        }
                    } else {
                        console.log(
                            `Against server '${servers[i].address}', game ended in a ${lastMove.result}.`
                        );
                    }
                }
            }
        }
    }
}

ChessGame.initEngine();

// playForever(argv)
//     .then(() => {})
//     .catch((err) => {
//         console.log(
//             `Error in calling playForever:\n${err.stack ? err.stack : err}`
//         );
//     });

let serverJSONPath = fs.existsSync(SERVER_LIST_JSON_USER_PATH)
    ? SERVER_LIST_JSON_USER_PATH
    : SERVER_LIST_JSON_DEFAULT_PATH;

playServers({ servers: JSON.parse(fs.readFileSync(serverJSONPath)) })
    .then(() => {})
    .catch((err) => {
        console.log(`playServers() error:\n${err.stack ? err.stack : err}`);
    });
