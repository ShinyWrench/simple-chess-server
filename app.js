const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/', (req, res) => {
    res.send('Hiya buddy!');
});

app.post('/json/', jsonParser, (req, res) => {
    res.send(`Decoding JSON: ${JSON.stringify(req.body)}`);
});

app.post('/urlencoded/', urlencodedParser, (req, res) => {
    res.send(`Decoding urlencoded: ${JSON.stringify(req.body)}`);
});

app.listen(port);
