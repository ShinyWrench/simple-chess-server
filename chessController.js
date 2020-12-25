const ChessGame = require('./ChessGame');
const Player = require('./Player');
const { validationResult } = require('express-validator');
// TODO:
//       allow client to get a list of commands ('/help')
//       '/board' or '/showboard' route
//           show board or toggle whether to include in every move response
//       replace CSV/JSON with actual DB (Mongo?)

function init() {
    ChessGame.initEngine();
}

function respond(req, res, message) {
    if ('jsonresponse' in req.query && req.query.jsonresponse === 'true') {
        res.json(message);
    } else {
        let output = '';
        Object.keys(message).forEach((key) => {
            output += `${message[key]},`;
        });
        if (output.length > 0) {
            output = output.slice(0, -1);
        }
        res.send(output);
    }
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
        respond(req, res, { error: 'error' });
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
            respond(req, res, { error: 'invalid parameters' });
            return;
        }

        // Don't allow start-game if already in game
        if (req.player.isInGame() === true) {
            console.log(
                `Player '${req.player.name}' at ${req.player.ipAddress} tried to start a new game, but they are already in a game`
            );
            respond(req, res, { error: 'error' });
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
            respond(req, res, { message: 'OK' });
            return;
        } else if (color === 'black') {
            // Otherwise, do the engine's move and respond with it
            let chessGame = new ChessGame({
                color: 'black',
                engineSkill: req.player.getOpponentEngineSkill(),
                engineDepth: req.player.getOpponentEngineDepth(),
            });
            let engineMove = await chessGame.makeEngineMove();
            req.player.createNewGame(color, engineMove);
            respond(req, res, { move: engineMove });
            return;
        }
    } catch (err) {
        console.log(`Error in startNewGame:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
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
            respond(req, res, { error: 'invalid parameters' });
            return;
        }

        // Don't allow set-config if already in game
        if (req.player.isInGame() === true) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to set config, but they are currently in a game`
            );
            respond(req, res, { error: 'error' });
            return;
        }

        // Set any config found in query params
        if ('skill' in req.query) {
            req.player.setOpponentEngineSkill(req.query.skill);
        }
        if ('depth' in req.query) {
            req.player.setOpponentEngineDepth(req.query.depth);
        }
    } catch (err) {
        console.log(`Error in config:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function move(req, res) {
    try {
        let clientMove = req.params.move;

        // Don't allow move if not in game
        if (req.player.isInGame() === false) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to move '${clientMove}', but they are not currently in a game`
            );
            respond(req, res, { error: 'error' });
            return;
        }

        // Get the ChessGame instance for the player's current game
        let chessGame = new ChessGame(req.player.getCurrentChessGameParams());

        // Validate the move
        // TODO: replace with sync Chess().moves() legal moves lister
        if ((await chessGame.validateMove(clientMove)) === false) {
            respond(req, res, { error: 'invalid move' });
            return;
        }

        // Do the move
        chessGame.move(clientMove);

        // Respond if the game is over
        if (chessGame.isGameOver()) {
            req.player.updateCurrentGame({
                moves: [clientMove],
                state: chessGame.getEndOfGameState(),
            });
            respond(req, res, {
                status: chessGame.getEndOfGameState(),
            });
            return;
        }

        // Do the engine's move
        let engineMove = await chessGame.makeEngineMove();

        // Respond
        if (chessGame.isGameOver()) {
            req.player.updateCurrentGame({
                moves: [clientMove, engineMove],
                state: chessGame.getEndOfGameState(),
            });
            respond(req, res, {
                move: engineMove,
                status: chessGame.getEndOfGameState(),
            });
            return;
        } else {
            req.player.updateCurrentGame({ moves: [clientMove, engineMove] });
            respond(req, res, { move: engineMove });
            return;
        }
    } catch (err) {
        console.log(`Error in move:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function resign(req, res) {
    try {
        // Don't allow resign if not in game
        if (req.player.isInGame() === false) {
            console.log(
                `Player ${req.player.name} at ${req.player.ipAddress} tried to resign', but they are not currently in a game`
            );
            respond(req, res, { error: 'error' });
            return;
        }
        await req.player.resignCurrentGame();
        respond(req, res, { status: 'OK' });
    } catch (err) {
        console.log(`Error in resign:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function getStatus(req, res) {
    try {
        respond(req, res, req.player.getProperties());
    } catch (err) {
        console.log(`Error in getStatus:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

exports.init = init;
exports.loadPlayer = loadPlayer;
exports.startGame = startGame;
exports.config = config;
exports.resign = resign;
exports.getStatus = getStatus;
exports.move = move;
