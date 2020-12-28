const express = require('express');
const chessController = require('./chessController');
const { query } = require('express-validator');

chessController.init();

const app = express();
const port = parseInt(process.argv[2]);

app.use(chessController.loadPlayer);

// Start a new game
app.get(
    '/start',
    [query('player').optional()],
    [query('color').optional().isIn(['white', 'black'])],
    chessController.startGame
);

// Set opponent engine depth and skill for ip address or player at ip address
app.get(
    '/config',
    [
        [query('player').optional()],
        [query('skill').optional().isInt()],
        [query('depth').optional().isInt()],
    ],
    chessController.config
);

// Resign the current game for ip address or player at ip address
app.get('/resign', [query('player').optional()], chessController.resign);

// Get current status for ip address or player at ip address
app.get('/status', [query('player').optional()], chessController.getStatus);

// Move a piece in the current game for ip address or player at ip address
// TODO: replace with regex pattern to match app.get('/e4'), etc.
app.get('/:move', [query('player').optional()], chessController.move);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
