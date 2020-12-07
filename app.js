const express = require('express');
const bodyParser = require('body-parser');
const chessController = require('./chessController');

const app = express();
const port = 3000;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

chessController.stockfishInit();

app.get('/', (req, res) => {
    res.send('Hiya buddy!');
});

app.post('/json/', jsonParser, (req, res) => {
    let response = `Decoded JSON: ${JSON.stringify(req.body)}`;
    console.log(response);
    res.send(response);
});

app.post('/urlencoded/', urlencodedParser, (req, res) => {
    let response = `Decoded urlencoded: ${JSON.stringify(req.body)}`;
    console.log(response);
    res.send(response);
});

// TODO: replace with regex pattern to match app.get('/e4'), etc.
app.get('/chess/:moves', chessController.play);

app.listen(port);
