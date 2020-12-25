const Player = require('./Player');

let player = Player.getPlayer('192.168.0.1');
//player.createNewGame('white');
player.resignCurrentGame();
player.setOpponentEngineDepth(4);
//player.updateCurrentGame({ moves: ['e2e4', 'e7e5'] });
console.log(player.print());
