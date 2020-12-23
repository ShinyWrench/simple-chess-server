const constants = require('./constants');

class Player {
    static GAME_RECORDS_JSON_PATH = './gameRecords.json';

    // Retrieve existing player or create new player (local and storage)
    static getPlayer(ipAddress, name) {
        // TODO: Get player from storage by ip and optional name
        //       (grab code from gameStorage.js)
    }

    // Create new player (local)
    constructor(params) {
        this.ipAddress = params.ipAddress;
        this.name = 'name' in params ? params.name : '';
        this.currentGame = 'currentGame' in params ? params.currentGame : null;
        this.opponentEngineSkill =
            'opponentEngineSkill' in params
                ? params.opponentEngineSkill
                : constants.engine.defaultSkill;
        this.opponentEngineDepth =
            'opponentEngineDepth' in params
                ? params.opponentEngineDepth
                : constants.engine.defaultDepth;
    }

    save() {
        // let records = JSON.stringify({
        //     for(key in this) {
        //     }
        // })
        // TODO: Save member variables to local storage
        //       (grab code from gameStorage.js)
    }

    createNewGame(color, firstWhiteMove = null) {
        this.currentGame = {
            color: color,
            moves: firstWhiteMove ? firstWhiteMove : '',
            state: 'playing',
            engineDepth: this.opponentEngineDepth,
            engineSkill: this.opponentEngineSkill,
        };
        this.save();
    }

    isInGame() {
        return this.isInGame;
    }

    getCurrentGameColor() {
        return this.currentGame.color;
    }

    updateCurrentGame(params) {
        // TODO
        // Allow partial or complete set of params to be set with each call
        this.save();
    }

    resignCurrentGame() {
        this.currentGame = null;
        this.save();
    }

    getCurrentChessGameParams() {
        return this.currentGame;
    }

    getOpponentEngineSkill() {
        return this.opponentEngineSkill;
    }

    setOpponentEngineSkill(skill) {
        this.opponentEngineSkill = skill;
        this.save();
    }

    getOpponentEngineDepth() {
        return this.opponentEngineDepth;
    }

    setOpponentEngineDepth(depth) {
        this.opponentEngineDepth = depth;
        this.save();
    }
}

module.exports = Player;
