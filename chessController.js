const stockfish = require('stockfish');
const engine = stockfish();
const gameStorage = require('./gameStorage');
const constants = require('./constants');

function stockfishInit() {
    engine.onmessage = function (line) {};
}

function engineCommand(command, parameter) {
    return new Promise((resolve, reject) => {
        engine.onmessage = (line) => {
            if (line.slice(0, 11) !== 'info depth ') {
                console.log(line);
            }
            switch (command) {
                case constants.commands.setMoves:
                    break;
                case constants.commands.display:
                    if (line.slice(0, 17) === 'Legal uci moves: ') {
                        resolve(line.split('Legal uci moves: ')[1].split(' '));
                        break;
                    }
                case constants.commands.requestMove:
                    let match = line.match(
                        /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/
                    );
                    if (match) {
                        resolve(match.slice(1, 3).join(''));
                    }
                    break;
                default:
                    reject(`Invalid command '${command}'`);
                    break;
            }

            // TODO: Match other patterns to handle all possible command values.
            //       Make sure I'm thorough so the request doesn't hang pending the
            //       right engine output.
            //       Set a timeout?
        };
        if (parameter != null) {
            console.log(`[sending \'${command}${parameter}\']`);
            engine.postMessage(`${command}${parameter}`);
        } else {
            console.log(`[sending \'${command}\']`);
            engine.postMessage(`${command}`);
        }
        if (command === constants.commands.setMoves) {
            resolve();
        }
    });
}

// TODO: Handle checkmate, stalemate, draw
//           In place of or in addition to move response, send:
//               "Checkmate. You win/lose!", "Draw.", or "Stalemate"
//           Flag game as completed in JSON
//       Handle promotions
//       ------------------------------
//       Later: replace CSV/JSON with actual DB (Mongo?)

async function play(req, res) {
    try {
        // Retrieve game, set board, and get legal moves
        let game = gameStorage.getGame(req.connection.remoteAddress);
        await engineCommand(constants.commands.setMoves, game.moves);
        let legalMoves = await engineCommand(constants.commands.display, null);
        let clientMove = req.params.move;

        switch (clientMove) {
            case 'reset':
                gameStorage.removeGame(req.connection.remoteAddress);
                await engineCommand(constants.commands.setMoves, '');
                await engineCommand(constants.commands.display, null);
                res.send('OK');
                return;
            case 'go':
                break;
            case 'moves':
                res.send(game.moves);
                return;
            default:
                // Validate client's move
                if (
                    clientMove.length !== 4 ||
                    !legalMoves.includes(clientMove)
                ) {
                    res.send('ERROR');
                    return;
                } else {
                    // Display client's move
                    game.moves += ` ${clientMove}`;
                    await engineCommand(
                        constants.commands.setMoves,
                        game.moves
                    );
                    await engineCommand(constants.commands.display, null);
                }
                break;
        }

        // Get engine's move and save game
        let engineMove = await engineCommand(
            constants.commands.requestMove,
            null
        );
        game.moves += ` ${engineMove}`;
        gameStorage.setGame(req.connection.remoteAddress, game);

        // Display board after engine's move
        await engineCommand(constants.commands.setMoves, game.moves);
        await engineCommand(constants.commands.display, null);

        res.send(engineMove);
    } catch (error) {
        console.log(`Error in play:\n${error}`);
        res.send('Error!');
    }
}

exports.play = play;
exports.stockfishInit = stockfishInit;
