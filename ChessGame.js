const stockfish = require('stockfish');
const engine = stockfish();
const gameStorage = require('./gameStorage');
const constants = require('./constants');

const { Chess } = require('chess.js');
const chess = new Chess();

class ChessGame {
    static initEngine() {
        engine.onmessage = (line) => {};
    }

    // Retrieve game, set board, and get legal moves
    static async getGame(ipAddress) {
        try {
            let chessGame = new ChessGame(ipAddress);
            chessGame.moveHistory = gameStorage.getGameMoves(
                chessGame.ipAddress
            );
            await engineCommand(
                constants.commands.setMoves,
                chessGame.moveHistory
            );
            chessGame.legalMoves = await engineCommand(
                constants.commands.display,
                null
            );
            return chessGame;
        } catch (err) {
            throw err;
        }
    }

    constructor(ipAddress) {
        this.ipAddress = ipAddress;
    }

    async delete() {
        gameStorage.removeGame(this.ipAddress);
        await engineCommand(constants.commands.setMoves, '');
        await engineCommand(constants.commands.display, null);
    }

    getMoveHistory() {
        return this.moveHistory;
    }

    validateMove(move) {
        return move.length === 4 && this.legalMoves.includes(move);
    }

    async move(move) {
        this.moveHistory += ` ${move}`;
        await engineCommand(constants.commands.setMoves, this.moveHistory);
        await engineCommand(constants.commands.display, null);
    }

    async makeEngineMove() {
        // Get engine's move and save game
        let engineMove = await engineCommand(
            constants.commands.requestMove,
            null
        );
        this.moveHistory += ` ${engineMove}`;
        gameStorage.setGameMoves(this.ipAddress, this.moveHistory);

        // Display board after engine's move
        await engineCommand(constants.commands.setMoves, this.moveHistory);
        await engineCommand(constants.commands.display, null);

        return engineMove;
    }
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

module.exports = ChessGame;
