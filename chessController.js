const ChessGame = require('./ChessGame');

// TODO: Handle checkmate, stalemate, draw
//           In place of or in addition to move response, send:
//               "Checkmate. You win/lose!", "Draw.", or "Stalemate"
//           Delete game from JSON
//       Handle promotions
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
                await chessGame.delete();
                res.send('OK');
                return;
            case 'go':
                break;
            case 'moves':
                res.send(chessGame.getMoveHistory());
                return;
            default:
                if (chessGame.validateMove(clientMove) === false) {
                    res.send('ERROR');
                    return;
                } else {
                    await chessGame.move(clientMove);
                }
                break;
        }

        let engineMove = await chessGame.makeEngineMove();
        res.send(engineMove);
    } catch (error) {
        console.log(`Error in play:\n${error}`);
        res.send('Error!');
    }
}

exports.init = init;
exports.play = play;
