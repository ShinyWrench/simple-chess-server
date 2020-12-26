const constants = require('./constants');
const fs = require('fs');

class Player {
    static GAME_RECORDS_JSON_PATH = './gameRecords.json';
    static DEFAULT_NAME = '';

    static getUniqueKey(ipAddress, name) {
        return `${ipAddress} ${name}`;
    }

    static loadGameRecords() {
        if (!fs.existsSync(Player.GAME_RECORDS_JSON_PATH)) {
            fs.writeFileSync(Player.GAME_RECORDS_JSON_PATH, JSON.stringify({}));
        }
        return JSON.parse(fs.readFileSync(Player.GAME_RECORDS_JSON_PATH));
    }

    static saveGameRecords(gameRecords) {
        fs.writeFileSync(
            Player.GAME_RECORDS_JSON_PATH,
            JSON.stringify(gameRecords)
        );
    }

    // Retrieve existing player or create new player (local and storage)
    static getPlayer(ipAddress, name = Player.DEFAULT_NAME) {
        let gameRecords = Player.loadGameRecords();
        let uniqueKey = this.getUniqueKey(ipAddress, name);
        if (!(uniqueKey in gameRecords)) {
            let player = new Player({ ipAddress: ipAddress, name: name });
            player.save();
            return player;
        } else {
            return new Player(gameRecords[uniqueKey]);
        }
    }

    static updatePlayerRecord(ipAddress, name, storageObject) {
        let gameRecords = Player.loadGameRecords();
        gameRecords[Player.getUniqueKey(ipAddress, name)] = storageObject;
        Player.saveGameRecords(gameRecords);
    }

    // Create new player (local)
    constructor(params) {
        this.ipAddress = params.ipAddress;
        this.name = 'name' in params ? params.name : Player.DEFAULT_NAME;
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
        let storageObject = {};
        Object.keys(this).forEach((key) => {
            storageObject[key] = this[key];
        });
        Player.updatePlayerRecord(this.ipAddress, this.name, storageObject);
    }

    createNewGame(color, firstWhiteMoveInfo = null) {
        this.currentGame = {
            color: color,
            moves: firstWhiteMoveInfo ? [firstWhiteMoveInfo] : [],
            state: 'playing',
            engineDepth: this.opponentEngineDepth,
            engineSkill: this.opponentEngineSkill,
        };
        this.save();
    }

    isInGame() {
        return (
            this.currentGame !== null && this.currentGame.state === 'playing'
        );
    }

    getCurrentGameColor() {
        return this.currentGame.color;
    }

    updateCurrentGame(params) {
        if ('moves' in params) {
            this.currentGame.moves.concat(params.moves);
        }
        if ('state' in params) {
            this.currentGame.state = params.state;
        }
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

    getProperties() {
        return JSON.parse(JSON.stringify(this));
    }

    print() {
        return JSON.stringify(this);
    }
}

module.exports = Player;
