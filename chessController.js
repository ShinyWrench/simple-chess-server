const ChessGame = require('./ChessGame');

// TODO: Handle castling
//       ------------------------------
//       Later: replace CSV/JSON with actual DB (Mongo?)

function init() {
    ChessGame.initEngine();
}

async function play(req, res) {
    try {
        let chessGame = await ChessGame.getGame(req.connection.remoteAddress);

        let clientMove = req.params.move;
        switch (clientMove) {
            case 'reset':
                await chessGame.deleteStorage();
                res.send('OK');
                return;
            case 'go':
                break;
            case 'moves':
                res.send(chessGame.getMoveHistory());
                return;
            default:
                if (chessGame.validateMove(clientMove) === false) {
                    res.send('error');
                    return;
                } else {
                    await chessGame.move(clientMove);
                    if (chessGame.isGameOver()) {
                        await chessGame.deleteStorage();
                        res.send(chessGame.getEndOfGameState());
                        return;
                    }
                }
                break;
        }

        let engineMove = await chessGame.makeEngineMove();
        if (chessGame.isGameOver()) {
            await chessGame.deleteStorage();
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
