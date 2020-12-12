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

async function getMoves(req, res) {
    let chessGame = await ChessGame.resumeOrStart(req.connection.remoteAddress);
    res.send(chessGame.getMoveHistory());
}

async function resign(req, res) {
    let chessGame = await ChessGame.resumeOrStart(req.connection.remoteAddress);
    await chessGame.resign();
    res.send('OK');
}

async function play(req, res) {
    try {
        let chessGame = await ChessGame.resumeOrStart(
            req.connection.remoteAddress
        );

        let clientMove = req.params.move;
        switch (clientMove) {
            case 'go':
                break;
            default:
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
                break;
        }

        let engineMove = await chessGame.makeEngineMove();
        if (chessGame.isGameOver()) {
            res.send(`${engineMove},${chessGame.getEndOfGameState()}`);
            return;
        } else {
            res.send(engineMove);
            return;
        }
    } catch (error) {
        console.log(`Error in play:\n${error.stack}`);
        res.send('error');
    }
}

exports.init = init;
exports.play = play;
exports.getMoves = getMoves;
exports.resign = resign;
