const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

let postParams = new URLSearchParams();
postParams.append('message', 'Whats up!');

fetch('http://localhost:3000/urlencoded', {
    method: 'POST',
    body: postParams,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
})
    .then((res) => res.text())
    .then((text) => {
        console.log(`text: ${text}`);
    })
    .catch((err) => {
        console.log(`Error: ${err}`);
    });

fetch('http://localhost:3000/json', {
    method: 'POST',
    body: JSON.stringify({ message: 'Howdy!' }),
    headers: { 'Content-Type': 'application/json' },
})
    .then((res) => res.text())
    .then((text) => {
        console.log(`text: ${text}`);
    })
    .catch((err) => {
        console.log(`Error: ${err}`);
    });

// http.request(
//     {
//         hostname: 'localhost',
//         port: 3000,
//         path: '/',
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'Content-Length': postData.length,
//         },
//     },
//     (res) => {
//         // console.log(`statusCode = ${res.statusCode}`);
//         res.on('data', (d) => {
//             console.log(`Response: ${d}`);
//         });
//     }
// )
//     .on('error', (err) => {
//         console.log('Error with http request');
//         console.log(`${err}`);
//     })
//     .write(postData);
