const stockfish = require('stockfish');
const engine = stockfish();
const constants = require('./constants');

// https://github.com/jhlywa/chess.js
const { Chess } = require('chess.js');

class ChessGame {
    static initEngine() {
        engine.onmessage = (line) => {};
    }

    constructor(params = {}) {
        // this.moveHistory is an array of objects with info on one move in each
        this.moveHistory = 'moves' in params ? params.moves : [];
        this.engineSkill =
            'engineSkill' in params
                ? params.engineSkill
                : constants.engine.defaultSkill;
        this.engineDepth =
            'engineDepth' in params
                ? params.engineDepth
                : constants.engine.defaultDepth;
        this.positionReporter = new Chess();
        this.updatePositionReporter({ moves: this.moveHistory });
        this.numNextMove = 1 + Math.floor(this.moveHistory.length / 2);
        this.toMove = this.positionReporter.turn() === 'w' ? 'white' : 'black';
        this.debugEngine = 'debugEngine' in params ? params.debugEngine : false;
    }

    getMoveHistory() {
        return this.moveHistory;
    }

    getMoveHistoryString() {
        let historyString = '';
        for (let i = 0; i < this.moveHistory.length; i++) {
            historyString += ` ${this.moveHistory[i].fromTo}`;
        }
        return historyString;
    }

    validateMove(fromTo) {
        // Trim promotion character
        if (fromTo.length === 5) {
            fromTo = fromTo.slice(0, 4);
        }

        // Handle moves with improper length
        if (fromTo.length !== 4) {
            return false;
        }

        // Search for the move among the legal moves
        let legalMoves = this.positionReporter.moves({ verbose: true });
        for (let i = 0; i < legalMoves.length; i++) {
            if (fromTo === `${legalMoves[i].from}${legalMoves[i].to}`) {
                return true;
            }
        }

        // Return false if move not found among legal moves
        return false;
    }

    move(fromTo) {
        // Log the move in algebraic notation
        console.log(
            `${this.numNextMove}. ${
                this.toMove === 'white' ? '' : '       '
            }${fromTo}`
        );

        // Build and store an object containing all move info
        let moveObject = {
            fromTo: fromTo,
            number: this.numNextMove,
            color: this.toMove,
            time_ms: new Date().getTime(),
            // TODO: any other info here?

            // TODO: Finish log stuff (start and end of game)
            // TODO: move on to client.js TODOs
        };
        this.moveHistory.push(moveObject);

        // Update other instance properties/object
        this.updatePositionReporter({ fromTo: fromTo });
        this.toMove = this.positionReporter.turn() === 'w' ? 'white' : 'black';
        if (this.toMove === 'white') {
            this.numNextMove++;
        }

        return moveObject;
    }

    async makeEngineMove() {
        await this.engineCommand(
            constants.commands.setMoves,
            this.getMoveHistoryString()
        );
        await this.engineCommand(
            constants.commands.setSkillLevel,
            this.engineSkill
        );
        let engineMove = await this.engineCommand(
            constants.commands.requestMove,
            this.engineDepth
        );
        return this.move(engineMove);
    }

    updatePositionReporter(update) {
        if ('fromTo' in update) {
            this.positionReporter.move(update.fromTo, { sloppy: true });
        } else if ('moves' in update) {
            for (let i = 0; i < update.moves.length; i++) {
                let fromTo = update.moves[i].fromTo;
                if (fromTo.length !== 4 && fromTo.length !== 5) {
                    return;
                }
                this.positionReporter.move(fromTo, { sloppy: true });
            }
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

    engineCommand(command, parameter) {
        return new Promise((resolve, reject) => {
            engine.onmessage = (line) => {
                if (line.slice(0, 11) !== 'info depth ') {
                    if (this.debugEngine === true) {
                        console.log(line);
                    }
                }
                switch (command) {
                    // break after cases with no engine console output
                    case constants.commands.setMoves:
                    case constants.commands.setSkillLevel:
                        break;
                    case constants.commands.display:
                        if (line.slice(0, 17) === 'Legal uci moves: ') {
                            resolve(
                                line.split('Legal uci moves: ')[1].split(' ')
                            );
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
                if (this.debugEngine === true) {
                    console.log(`[sending \'${command}${parameter}\']`);
                }
                engine.postMessage(`${command}${parameter}`);
            } else {
                if (this.debugEngine === true) {
                    console.log(`[sending \'${command}\']`);
                }
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
}

module.exports = ChessGame;
