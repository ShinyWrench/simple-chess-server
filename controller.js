function addNumbers(req, res, next) {
    // res.send(`req.body = ${JSON.stringify(req.body)}\n`);
   res.send(`${parseInt(req.body.a) + parseInt(req.body.b)}`);
}

exports.addNumbers = addNumbers;