const express = require('express')
const shajs = require('sha.js')
const bodyParser = require('body-parser')
const mysql = require('mysql')

//import environment variables
require('dotenv').config()

//setup connection to MySQL server
const DB = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  database : process.env.RDS_DATABASE,
});

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json());

//sends JSON response with SHA256 of message sent by client
app.post('/messages', (req, res, next) => {
  let messageString = req.body.message;

  getHash(req.body.message, (err, result) => {
    if (err) {
      console.log(err)
      res.status(500)
      return res.json({'digest': result})
    } else {
        res.status(200)
        return res.json({'digest': result})
    }
  })
});

app.get('/messages/:hash', (req, res, next) => {
  getMessage(req.params.hash, (err, result) => {
    if (err) {
      console.log(err)
      return res.status(500).end()
    } else {
      if (result) {
        res.status(200)
        return res.json(result)
      } else
        res.status(404)
        return res.json({"err_msg": "Message not found"})
    }
  })
});

//returns the original message based on the SHA256 hash passed in
let getMessage = (hash, callback) => {
  let sql = "SELECT message FROM Messages WHERE `hash` = ?";
  DB.query(sql, hash, (error, results, fields) => {
    if (error)
      callback(error, null);
    else
      callback(null, results[0])
  });
};

//returns the SHA256 hash digest of message
//stores the original message and hash into the DB
let getHash = (messageString, callback) => {
  let hashedMessage = shajs('sha256').update(messageString).digest('hex')

  let set = {message: messageString, hash: hashedMessage}

  let sql = "INSERT INTO Messages SET ?";
  DB.query(sql, set, (error, results, fields) => {
    if (error)
      callback(error, hashedMessage)
    else
      callback(null, hashedMessage)
  });
}

app.listen(port, () => {
  console.log("App listening on port " + port)
});
