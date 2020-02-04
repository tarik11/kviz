var express = require('express');
var router = express.Router();



var config = {
  user: 'nnrekfcm',
  database: 'nnrekfcm',
  password: 'i_lGh76cXKoefSWV0vNvA6yCgv5pvotZ', //env var: PGPASSWORD
  host: 'salt.db.elephantsql.com',
  port: 5432,
  max: 100,
  idleTimeoutMillis: 30000
};

var pg = require('pg');
var pool = new pg.Pool(config);

router.get('/', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("SELECT * FROM projekat.predmet where $1 = id;",[req.body.predmet_id] ,
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
                res.render('index', {

                 });
          }
        });
  });
});



module.exports = router;
