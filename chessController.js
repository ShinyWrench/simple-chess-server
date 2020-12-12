const ChessGame = require('./ChessGame');

// TODO:
//       use multiple routes instead of switch-case in controller
//       allow client to change difficulty level
//       allow client to get a list of commands ('/help')
//       '/board' or '/showboard' route
//           show board or toggle whether to include in every move response
//       replace CSV/JSON with actual DB (Mongo?)

function init() {
    ChessGame.initEngine();
}

async function move(req, res) {
    try {
        let chessGame = await ChessGame.resumeOrStart(
            req.connection.remoteAddress
        );
        let clientMove = req.params.move;
        if ((await chessGame.validateMove(clientMove)) === false) {
            res.send('error');
            return;
        } else {
            await chessGame.move(clientMove);
            if (chessGame.isGameOver()) {
                res.send(chessGame.getEndOfGameState());
                return;
            }
        }

        let engineMove = await chessGame.makeEngineMove();
        if (chessGame.isGameOver()) {
            res.send(`${engineMove},${chessGame.getEndOfGameState()}`);
            return;
        } else {
            res.send(engineMove);
            return;
        }
    } catch (err) {
        console.log(`Error in move:\n${err.stack}`);
        res.send('error');
    }
}

async function makeEngineMove(req, res) {
    try {
        let chessGame = await ChessGame.resumeOrStart(
            req.connection.remoteAddress
        );
        let engineMove = await chessGame.makeEngineMove();
        if (chessGame.isGameOver()) {
            res.send(`${engineMove},${chessGame.getEndOfGameState()}`);
            return;
        } else {
            res.send(engineMove);
            return;
        }
    } catch (err) {
        console.log(`Error in makeEngineMove:\n${err.stack}`);
        res.send('error');
    }
}

async function getMoves(req, res) {
    try {
        let chessGame = await ChessGame.resumeOrStart(
            req.connection.remoteAddress
        );
        res.send(chessGame.getMoveHistory());
    } catch (err) {
        console.log(`Error in getMoves:\n${err.stack}`);
        res.send('error');
    }
}

async function resign(req, res) {
    try {
        let chessGame = await ChessGame.resumeOrStart(
            req.connection.remoteAddress
        );
        await chessGame.resign();
        res.send('OK');
    } catch (err) {
        console.log(`Error in resign:\n${err.stack}`);
        res.send('error');
    }
}

exports.init = init;
exports.move = move;
exports.makeEngineMove = makeEngineMove;
exports.getMoves = getMoves;
exports.resign = resign;
