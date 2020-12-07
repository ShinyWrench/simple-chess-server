const stockfish = require('stockfish');
const engine = stockfish();

function stockfishInit() {
    engine.onmessage = function (line) {};
}

function spaceMoves(unspacedMoves) {
    let spacedMoves = '';
    for (let i = 0; i < unspacedMoves.length; i += 4) {
        spacedMoves += unspacedMoves.substring(i, i + 4);
        if (i !== unspacedMoves.length - 4) {
            spacedMoves += ' ';
        }
    }
    return spacedMoves;
}

function engineCommand(command) {
    console.log(`[sending \'${command}\']`);
    engine.postMessage(command);
}

function playMoves(moves) {
    return new Promise((resolve, reject) => {
        engine.onmessage = (line) => {
            console.log(line);
            let match = line.match(
                /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/
            );
            if (match) {
                resolve(JSON.stringify(match));
            }
        };
        engineCommand(`position startpos moves ${moves}`);
        engineCommand('d');
        engineCommand('go depth 16');
    });
}

async function play(req, res) {
    res.send(await playMoves(spaceMoves(req.params.moves)));
}

exports.play = play;
exports.stockfishInit = stockfishInit;
