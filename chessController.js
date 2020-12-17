const ChessGame = require('./ChessGame');

// TODO:
//       allow client to change difficulty level
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
        output = `${output}${message.error ? message.error + ',' : ''}`;
        output = `${output}${message.move ? message.move + ',' : ''}`;
        output = `${output}${message.moves ? message.moves + ',' : ''}`;
        output = `${output}${message.status ? message.status + ',' : ''}`;
        if (output.length > 0) {
            output = output.slice(0, -1);
        }
        res.send(output);
    }
}

async function loadGame(req, res, next) {
    try {
        req.chessGame = await ChessGame.resumeOrStartOnline(
            req.connection.remoteAddress
        );
        next();
    } catch (err) {
        console.log(`Error in loadGame:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function move(req, res) {
    try {
        let clientMove = req.params.move;
        if ((await req.chessGame.validateMove(clientMove)) === false) {
            respond(req, res, { error: 'invalid move' });
            return;
        } else {
            await req.chessGame.move(clientMove);
            if (req.chessGame.isGameOver()) {
                respond(req, res, {
                    status: req.chessGame.getEndOfGameState(),
                });
                return;
            }
        }
        await makeEngineMove(req, res);
    } catch (err) {
        console.log(`Error in move:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function makeEngineMove(req, res) {
    try {
        let engineMove = await req.chessGame.makeEngineMove();
        if (req.chessGame.isGameOver()) {
            respond(req, res, {
                move: engineMove,
                status: req.chessGame.getEndOfGameState(),
            });
            return;
        } else {
            respond(req, res, { move: engineMove });
            return;
        }
    } catch (err) {
        console.log(`Error in makeEngineMove:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function getMoves(req, res) {
    try {
        respond(req, res, { moves: req.chessGame.getMoveHistory() });
    } catch (err) {
        console.log(`Error in getMoves:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

async function resign(req, res) {
    try {
        await req.chessGame.resign();
        respond(req, res, { state: 'OK' });
    } catch (err) {
        console.log(`Error in resign:\n${err.stack ? err.stack : err}`);
        respond(req, res, { error: 'error' });
    }
}

exports.init = init;
exports.loadGame = loadGame;
exports.move = move;
exports.makeEngineMove = makeEngineMove;
exports.getMoves = getMoves;
exports.resign = resign;
