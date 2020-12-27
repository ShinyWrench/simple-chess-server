const ChessGame = require('./ChessGame');
const Player = require('./Player');
const { validationResult } = require('express-validator');
// TODO:
//       allow client to get a list of commands ('/help')
//       '/board' or '/showboard' route
//           show board or toggle whether to include in every move response
//       use POST requests instead of GET
//       replace CSV/JSON with actual DB (Mongo?)

function init() {
    ChessGame.initEngine();
}

async function loadPlayer(req, res, next) {
    try {
        req.player = Player.getPlayer(
            req.connection.remoteAddress,
            'player' in req.query ? req.query.player : null
        );
        next();
    } catch (err) {
        console.log(`Error in loadGame:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

async function startGame(req, res) {
    try {
        // Validate GET route parameters
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(
                `Client sent bad parameters:\n${JSON.stringify(errors.array())}`
            );
            res.json({ error: 'invalid parameters' });
            return;
        }

        // Don't allow start-game if already in game
        if (req.player.isInGame() === true) {
            console.log(
                `Player '${req.player.name}' at ${req.player.ipAddress} tried to start a new game, but they are already in a game`
            );
            res.json({ error: 'error' });
            return;
        }

        // Tell the player object it's in a new game
        let color;
        if ('color' in req.query) {
            color = req.query.color;
        } else {
            color = 'white';
        }
        if (color === 'white') {
            // Respond with 'OK' if white
            req.player.createNewGame(color);
            res.json({ message: 'OK' });
            return;
        } else if (color === 'black') {
            // Otherwise, do the engine's move and respond with it
            let chessGame = new ChessGame({
                engineSkill: req.player.getOpponentEngineSkill(),
                engineDepth: req.player.getOpponentEngineDepth(),
            });
            let engineMoveInfo = await chessGame.makeEngineMove();
            req.player.createNewGame(color, engineMoveInfo);
            res.json({ move: engineMoveInfo.fromTo });
            return;
        }
    } catch (err) {
        console.log(`Error in startNewGame:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

async function config(req, res) {
    try {
        // Validate GET route parameters
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(
                `Client sent bad parameters:\n${JSON.stringify(errors.array())}`
            );
            res.json({ error: 'invalid parameters' });
            return;
        }

        // Don't allow set-config if already in game
        if (req.player.isInGame() === true) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to set config, but they are currently in a game`
            );
            res.json({ error: 'error' });
            return;
        }

        // Set any config found in query params
        if ('skill' in req.query) {
            req.player.setOpponentEngineSkill(req.query.skill);
        }
        if ('depth' in req.query) {
            req.player.setOpponentEngineDepth(req.query.depth);
        }
        res.json({ status: 'OK' });
    } catch (err) {
        console.log(`Error in config:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

async function move(req, res) {
    try {
        let clientFromTo = req.params.move;

        // Don't allow move if not in game
        if (req.player.isInGame() === false) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to move '${clientFromTo}', but they are not currently in a game`
            );
            res.json({ error: 'error' });
            return;
        }

        // Get the ChessGame instance for the player's current game
        let chessGame = new ChessGame(req.player.getCurrentChessGameParams());

        // Validate the move
        if (chessGame.validateMove(clientFromTo) === false) {
            res.json({ error: 'invalid move' });
            return;
        }

        // Do the move
        let clientMoveInfo = chessGame.move(clientFromTo);

        // Game is over: update the player record, respond, and log it
        if (chessGame.isGameOver()) {
            req.player.updateCurrentGame({
                moves: [clientMoveInfo],
                state: chessGame.getEndOfGameState(),
            });
            res.json({
                status: chessGame.getEndOfGameState(),
            });
            let gameReport = req.player.getCurrentGameReport();
            logGameReport(gameReport);
            // TODO: Push to S3
            return;
        }

        // Do the engine's move
        let engineMoveInfo = await chessGame.makeEngineMove();

        // Game is over: update the player record, respond, and log it
        if (chessGame.isGameOver()) {
            req.player.updateCurrentGame({
                moves: [clientMoveInfo, engineMoveInfo],
                state: chessGame.getEndOfGameState(),
            });
            res.json({
                move: engineMoveInfo.fromTo,
                status: chessGame.getEndOfGameState(),
            });
            let gameReport = req.player.getCurrentGameReport();
            logGameReport(gameReport);
            // TODO: Push to S3
            return;
        } else {
            req.player.updateCurrentGame({
                moves: [clientMoveInfo, engineMoveInfo],
            });
            res.json({ move: engineMoveInfo.fromTo });
            return;
        }
    } catch (err) {
        console.log(`Error in move:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

async function resign(req, res) {
    try {
        // Don't allow resign if not in game
        if (req.player.isInGame() === false) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to resign', but they are not currently in a game`
            );
            res.json({ error: 'error' });
            return;
        }
        await req.player.resignCurrentGame();
        res.json({ status: 'OK' });
    } catch (err) {
        console.log(`Error in resign:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

async function getStatus(req, res) {
    try {
        res.json(req.player.getProperties());
    } catch (err) {
        console.log(`Error in getStatus:\n${err.stack ? err.stack : err}`);
        res.json({ error: 'error' });
    }
}

function logGameReport(report) {
    let logObject = {
        playerColor: report.color,
        numMoves: Math.floor((report.moves.length + 1) / 2),
        startTime_ms: report.moves[0].time_ms,
        endTime_ms: report.moves[report.moves.length - 1].time_ms,
        result: report.state,
    };
    if (report.state === 'checkmate') {
        logObject.winner = report.moves[report.moves.length - 1].color;
    }
    for (key in report) {
        if (key !== 'moves' && key !== 'state' && key !== 'color') {
            logObject[key] = report[key];
        }
    }
    // TODO: replace JSON.stringify() with pretty-print
    console.log(JSON.stringify(logObject));
}

exports.init = init;
exports.loadPlayer = loadPlayer;
exports.startGame = startGame;
exports.config = config;
exports.resign = resign;
exports.getStatus = getStatus;
exports.move = move;
