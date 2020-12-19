const stockfish = require('stockfish');
const engine = stockfish();
const gameStorage = require('./gameStorage');
const constants = require('./constants');

// https://github.com/jhlywa/chess.js
const { Chess } = require('chess.js');

class ChessGame {
    static initEngine() {
        engine.onmessage = (line) => {};
    }

    static async resumeOrStartOnline(ipAddress) {
        try {
            let moves = gameStorage.getMovesFromCurrentGame(ipAddress);
            if (moves == null) {
                moves = '';
            }
            let chessGame = new ChessGame({
                ipAddress: ipAddress,
                useStorage: true,
                moveHistory: moves,
            });
            await engineCommand(
                constants.commands.setMoves,
                chessGame.moveHistory
            );
            return chessGame;
        } catch (err) {
            throw err;
        }
    }

    static async startNewLocalGame() {
        try {
            let chessGame = new ChessGame();
            await engineCommand(
                constants.commands.setMoves,
                chessGame.moveHistory
            );
            return chessGame;
        } catch (err) {
            throw err;
        }
    }

    constructor(params = {}) {
        this.ipAddress = 'ipAddress' in params ? params.ipAddress : null;
        this.useStorage = 'useStorage' in params ? params.useStorage : false;
        this.moveHistory = 'moveHistory' in params ? params.moveHistory : '';
        this.positionReporter = new Chess();
        this.updatePositionReporter({ moves: this.moveHistory });
    }

    getMoveHistory() {
        return this.moveHistory;
    }

    async validateMove(move) {
        let legalMoves = await engineCommand(constants.commands.display, null);
        return (
            (move.length === 4 || move.length === 5) &&
            legalMoves.includes(move)
        );
    }

    async resign() {
        if (this.useStorage === true) {
            gameStorage.closeCurrentGame(this.ipAddress, 'resign');
        }
        this.moveHistory = '';
        this.positionReporter = new Chess();
        await engineCommand(constants.commands.setMoves, '');
        await engineCommand(constants.commands.display, null);
    }

    async move(move) {
        this.moveHistory += ` ${move}`;
        this.updatePositionReporter({ move: move });
        if (this.useStorage === true) {
            gameStorage.addMove(this.ipAddress, move);
            if (this.isGameOver()) {
                gameStorage.closeCurrentGame(
                    this.ipAddress,
                    this.getEndOfGameState()
                );
            }
        }
        await engineCommand(constants.commands.setMoves, this.moveHistory);
        await engineCommand(constants.commands.display, null);
    }

    async makeEngineMove(params = {}) {
        await engineCommand(
            constants.commands.setSkillLevel,
            'skill' in params ? params.skill : constants.engine.defaultSkill
        );
        let engineMove = await engineCommand(
            constants.commands.requestMove,
            'depth' in params ? params.depth : constants.engine.defaultDepth
        );
        await this.move(engineMove);
        return engineMove;
    }

    updatePositionReporter(update) {
        if ('move' in update) {
            this.positionReporter.move(update.move, { sloppy: true });
        } else if ('moves' in update) {
            update.moves.split(' ').forEach((move) => {
                if (move.length !== 4 && move.length !== 5) {
                    return;
                }
                this.positionReporter.move(move, { sloppy: true });
            });
        } else {
            throw `updatePositionReporter(${JSON.stringify(
                update
            )}):\nInvalid key(s) in update`;
        }
    }

    isGameOver() {
        return this.positionReporter.game_over();
    }

    getEndOfGameState() {
        if (this.positionReporter.in_checkmate()) {
            return 'checkmate';
        }
        if (this.positionReporter.in_draw()) {
            return 'draw';
        }
        if (this.positionReporter.in_stalemate()) {
            return 'stalemate';
        }
        if (this.positionReporter.in_threefold_repetition()) {
            return 'draw';
        }
        if (this.positionReporter.insufficient_material()) {
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
                // break after cases with no engine console output
                case constants.commands.setMoves:
                case constants.commands.setSkillLevel:
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
        // resolve right away if we don't have expected output to trigger it
        if (
            command === constants.commands.setMoves ||
            command === constants.commands.setSkillLevel
        ) {
            resolve();
        }
    });
}

module.exports = ChessGame;
