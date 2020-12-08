const stockfish = require('stockfish');
const engine = stockfish();
const gameStorage = require('./gameStorage');

function stockfishInit() {
    engine.onmessage = function (line) {};
}

function engineCommand(command) {
    console.log(`[sending \'${command}\']`);
    engine.postMessage(command);
}

// TODO: Goal: client sends one move (ex. ...:3000/f5g7) and server
//             replies with its move
//       How: Simple CSV or JSON file that tracks each game
//                (last move time, IP addr., and all moves)
//            Ctrlr. algo.: Client sends move
//                          Create row in file for game if it doesn't exist
//                          Retrieve moves from game's row
//                          Send moves to engine, engine calculates its move
//                          Controller writes time, both moves to game's row in file
//                          Controller responds with only its move
//            Handle checkmate, stalemate, draw
//                In place of or in addition to move response, send:
//                    "Checkmate. You win/lose!", "Draw.", or "Stalemate"
//                Append code to end of game's row (values in constants source file)
//                    ex.: "e2e4e7e5DRAW"
//            Handle illegal move
//       Later: replace CSV/JSON with actual DB (Mongo?)
//
function playMoves(moves) {
    return new Promise((resolve, reject) => {
        engine.onmessage = (line) => {
            if (line.slice(0, 11) !== 'info depth ') {
                console.log(line);
            }
            let match = line.match(
                /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/
            );
            if (match) {
                resolve(match.slice(1, 3).join(''));
            }
        };
        engineCommand(`position startpos moves${moves}`);
        engineCommand('d');
        engineCommand('go depth 16');
    });
}

async function play(req, res) {
    try {
        let game = gameStorage.getGame(req.connection.remoteAddress);
        game.moves += ` ${req.params.move}`;
        let engineMove = await playMoves(game.moves);
        game.moves += ` ${engineMove}`;
        gameStorage.setGame(req.connection.remoteAddress, game);
        res.send(engineMove);
    } catch (error) {
        console.log(`Error in play:\n${error}`);
        res.send('Error!');
    }
}

exports.play = play;
exports.stockfishInit = stockfishInit;
