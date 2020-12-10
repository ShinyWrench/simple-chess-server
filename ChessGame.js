const stockfish = require('stockfish');
const engine = stockfish();
const gameStorage = require('./gameStorage');
const constants = require('./constants');

const { Chess } = require('chess.js');

class ChessGame {
    static initEngine() {
        engine.onmessage = (line) => {};
    }

    // Retrieve game, set board, and get legal moves
    static async getGame(ipAddress) {
        try {
            let chessGame = new ChessGame(
                ipAddress,
                gameStorage.getGameMoves(ipAddress)
            );
            chessGame.loadMovesIntoChessJS(chessGame.moveHistory);
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

    constructor(ipAddress, moveHistory) {
        this.ipAddress = ipAddress;
        this.moveHistory = moveHistory;
        this.chessJS = null;
    }

    async deleteStorage() {
        gameStorage.removeGame(this.ipAddress);
        await engineCommand(constants.commands.setMoves, '');
        await engineCommand(constants.commands.display, null);
    }

    getMoveHistory() {
        return this.moveHistory;
    }

    validateMove(move) {
        return (
            (move.length === 4 || move.length === 5) &&
            this.legalMoves.includes(move)
        );
    }

    async move(move) {
        this.moveHistory += ` ${move}`;
        this.loadMovesIntoChessJS(move);
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
        this.loadMovesIntoChessJS(engineMove);
        gameStorage.setGameMoves(this.ipAddress, this.moveHistory);

        // Display board after engine's move
        await engineCommand(constants.commands.setMoves, this.moveHistory);
        await engineCommand(constants.commands.display, null);

        return engineMove;
    }

    loadMovesIntoChessJS(moves) {
        this.chessJS = new Chess();
        this.moveHistory.split(' ').forEach((move) => {
            if (move.length !== 4 && move.length !== 5) {
                return;
            }
            this.chessJS.move(move, { sloppy: true });
        });
    }

    isGameOver() {
        return this.chessJS.game_over();
    }

    getEndOfGameState() {
        if (this.chessJS.in_checkmate()) {
            return 'checkmate';
        }
        if (this.chessJS.in_draw()) {
            return 'draw';
        }
        if (this.chessJS.in_stalemate()) {
            return 'stalemate';
        }
        if (this.chessJS.in_threefold_repetition()) {
            return 'draw';
        }
        if (this.chessJS.insufficient_material()) {
            return 'draw';
        }
        return 'unknown';
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
                        resolve(match.slice(1, 4).join(''));
                    }
                    break;
                default:
                    reject(`Invalid command '${command}'`);
                    break;
            }

            // TODO: Make sure I'm matching patterns to handle all possible command
            //       values so the request doesn't hang pending the right engine output.
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
