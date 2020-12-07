const fetch = require('node-fetch');

async function request() {
    let response = await fetch('http://localhost:3000/chess/e2e4');
    return await response.text();
}

request()
    .then((text) => {
        console.log(`Response: ${text}`);
    })
    .catch((err) => {
        console.log(`Error: ${err}`);
    });
