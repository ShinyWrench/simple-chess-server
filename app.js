const express = require('express');
const chessController = require('./chessController');
const { query } = require('express-validator');

chessController.init();

const app = express();
const port = 3000;

app.use(chessController.loadGame);

app.get(
    '/go',
    [query('depth').optional().isInt(), query('skill').optional().isInt()],
    chessController.makeEngineMove
);
app.get('/moves', chessController.getMoves);
app.get('/resign', chessController.resign);
// TODO: replace with regex pattern to match app.get('/e4'), etc.
app.get(
    '/:move',
    [query('depth').optional().isInt(), query('skill').optional().isInt()],
    chessController.move
);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
