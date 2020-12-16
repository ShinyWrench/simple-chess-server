const ChessGame = require('./ChessGame');

// TODO:
//       set up default 'keepAlive' arg in ChessGame move & resign methods
//           controls whether 'positionReporter' is updated, engine moves are updated
//       '/board' or '/showboard' route
//           show board or toggle whether to include in every move response
//       allow client to change difficulty level
//       allow client to get a list of commands ('/help')
//       replace CSV/JSON with actual DB (Mongo?)

function init() {
    ChessGame.initEngine();
}

async function loadGame(req, res, next) {
    try {
        req.chessGame = await ChessGame.resumeOrStartOnline(
            req.connection.remoteAddress
        );
        next();
    } catch (err) {
        console.log(`Error in loadGame:\n${err.stack ? err.stack : err}`);
        res.send('error');
    }
}

async function move(req, res) {
    try {
        let clientMove = req.params.move;
        if ((await req.chessGame.validateMove(clientMove)) === false) {
            res.send('error');
            return;
        } else {
            await req.chessGame.move(clientMove);
            if (req.chessGame.isGameOver()) {
                res.send(req.chessGame.getEndOfGameState());
                return;
            }
        }
        await makeEngineMove(req, res);
    } catch (err) {
        console.log(`Error in move:\n${err.stack ? err.stack : err}`);
        res.send('error');
    }
}

async function makeEngineMove(req, res) {
    try {
        let engineMove = await req.chessGame.makeEngineMove();
        if (req.chessGame.isGameOver()) {
            res.send(`${engineMove},${req.chessGame.getEndOfGameState()}`);
            return;
        } else {
            res.send(engineMove);
            return;
        }
    } catch (err) {
        console.log(`Error in makeEngineMove:\n${err.stack ? err.stack : err}`);
        res.send('error');
    }
}

async function getMoves(req, res) {
    try {
        res.send(req.chessGame.getMoveHistory());
    } catch (err) {
        console.log(`Error in getMoves:\n${err.stack ? err.stack : err}`);
        res.send('error');
    }
}

async function resign(req, res) {
    try {
        await req.chessGame.resign();
        res.send('OK');
    } catch (err) {
        console.log(`Error in resign:\n${err.stack ? err.stack : err}`);
        res.send('error');
    }
}

exports.init = init;
exports.loadGame = loadGame;
exports.move = move;
exports.makeEngineMove = makeEngineMove;
exports.getMoves = getMoves;
exports.resign = resign;
