const express = require('express');
const chessController = require('./chessController');

chessController.init();

const app = express();
const port = 3000;

app.use(chessController.loadGame);

app.get('/go', chessController.makeEngineMove);
app.get('/moves', chessController.getMoves);
app.get('/resign', chessController.resign);
// TODO: replace with regex pattern to match app.get('/e4'), etc.
app.get('/:move', chessController.move);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
