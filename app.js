const express = require('express');
const chessController = require('./chessController');

chessController.init();

const app = express();
const port = 3000;

// TODO: replace with regex pattern to match app.get('/e4'), etc.
app.get('/chess/:move', chessController.play);

app.listen(port);
