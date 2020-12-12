const fs = require('fs');

const GAME_RECORDS_JSON_PATH = './gameRecords.json';

function getMovesFromCurrentGame(remoteIP) {
    if (!fs.existsSync(GAME_RECORDS_JSON_PATH)) {
        fs.writeFileSync(GAME_RECORDS_JSON_PATH, JSON.stringify({}));
    }
    let gameRecords = JSON.parse(fs.readFileSync(GAME_RECORDS_JSON_PATH));
    if (!(remoteIP in gameRecords)) {
        return null;
    } else {
        return (clientGames = gameRecords[remoteIP].currentGame.moves);
    }
}

function addMove(remoteIP, move) {
    let gameRecords = JSON.parse(fs.readFileSync(GAME_RECORDS_JSON_PATH));
    if (!(remoteIP in gameRecords)) {
        gameRecords[remoteIP] = {
            currentGame: { moves: ` ${move}` },
            pastGames: [],
            lastUpdate_ms: new Date().getTime(),
        };
    } else {
        gameRecords[remoteIP].currentGame.moves += ` ${move}`;
    }
    fs.writeFileSync(GAME_RECORDS_JSON_PATH, JSON.stringify(gameRecords));
}

function closeCurrentGame(remoteIP, endOfGameState) {
    if (!fs.existsSync(GAME_RECORDS_JSON_PATH)) {
        return;
    }
    let gameRecords = JSON.parse(fs.readFileSync(GAME_RECORDS_JSON_PATH));
    if (!(remoteIP in gameRecords)) {
        return;
    }
    gameRecords[remoteIP].currentGame.result = endOfGameState;
    gameRecords[remoteIP].pastGames.push(gameRecords[remoteIP].currentGame);
    gameRecords[remoteIP].currentGame = { moves: '' };
    fs.writeFileSync(GAME_RECORDS_JSON_PATH, JSON.stringify(gameRecords));
}

exports.getMovesFromCurrentGame = getMovesFromCurrentGame;
exports.addMove = addMove;
exports.closeCurrentGame = closeCurrentGame;
