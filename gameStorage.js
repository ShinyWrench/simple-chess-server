const fs = require('fs');

const GAME_RECORDS_JSON_PATH = './gameRecords.json';

function getGame(remoteIP) {
    if (!fs.existsSync(GAME_RECORDS_JSON_PATH)) {
        fs.writeFileSync(GAME_RECORDS_JSON_PATH, JSON.stringify({}));
    }
    let gameRecords = JSON.parse(fs.readFileSync(GAME_RECORDS_JSON_PATH));
    if (!(remoteIP in gameRecords)) {
        console.log(`No game found for ${remoteIP}`);
        return (gameRecords[remoteIP] = {
            remoteIP: remoteIP,
            lastUpdate_ms: new Date().getTime(),
            moves: '',
        });
    } else {
        console.log(`Load game ${JSON.stringify(gameRecords[remoteIP])}`);
        return gameRecords[remoteIP];
    }
}

function setGame(remoteIP, game) {
    let gameRecords = JSON.parse(fs.readFileSync(GAME_RECORDS_JSON_PATH));
    gameRecords[remoteIP] = game;
    fs.writeFileSync(GAME_RECORDS_JSON_PATH, JSON.stringify(gameRecords));
    console.log(`Save game ${JSON.stringify(gameRecords[remoteIP])}`);
}

exports.getGame = getGame;
exports.setGame = setGame;
