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

router.get('/:id/:n' ,function (req, res, next) {

    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN', err => {
            if (err){
                res.end(err);
            }

            const queryText = "";
            client.query(queryText, [req.params.id],(err, result) => {
                if (err){
                    result.end(err);
                }
                client.query("select *from projekat.pitanja p, projekat.odgovor o where kviz_id = $1 and o.pitanje_id = p.id;", [req.params.id] ,(err, result) => {
                    if (err){
                        console.log(err);
                    }
                    client.query('COMMIT', err => {
                        if (err) {
                            console.error('Error committing transaction', err.stack)
                        }
                        res.render('pokreni_kviz',{
                            title: 'Kviz',
                            objekti: result.rows,
                            nickname: req.params.n,
                            kviz_id: req.params.id
                        });
                        done();
                    });
                });
            });
        });
    });
});

router.post('/:k/postavi/:id',function (req, res, next) {

    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN', err => {
            if (err){
                res.end(err);
            }

            const queryText = "UPDATE projekat.pitanja set tip = 1, kraj = false;";
            client.query(queryText, (err, result) => {
                if (err){
                    result.end(err);
                }
                const insertNarudjbe = 'UPDATE projekat.pitanja set tip = 2, postavljeno = true, kraj = false WHERE id = $1;';
                client.query(insertNarudjbe,[req.params.id] ,(err, result) => {
                    if (err){
                        console.log(err);
                    }
                    client.query('COMMIT', err => {
                        if (err) {
                            console.error('Error committing transaction', err.stack)
                        }
                        res.redirect('back');
                        done();
                    });
                });
            });
        });
    });

});

router.post('/:k/zavrsi/:id', function (req, res, next) {


    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN TRANSACTION', err => {
            if (err){
                res.end(err);
            }

            const queryText = "update projekat.pitanja set postavljeno = false, kraj = true where kviz_id = $1;";
            client.query(queryText,[req.params.id] ,(err, result) => {
                if (err){
                    result.end(err);
                }
                const insertNarudjbe = "update projekat.kviz set kraj_kviz = true where id = $1;";
                client.query(insertNarudjbe,[req.params.id] ,(err, result) => {
                    if (err){
                        console.log(err);
                    }
                    console.log(req.params.id);
                    client.query('COMMIT', err => {
                        if (err) {
                            console.error('Error committing transaction', err.stack)
                        }
                        res.redirect('back');
                        done();
                    });
                });
            });
        });
    });

});


router.get('/:id/rezultati/:kviz_id' ,function (req, res, next) {
    console.log(req.session.userInfo);
        pool.connect(function (err, client, done) {
            if (err) {
                res.end('{"error" : "Error",' +
                    ' "status" : 500}');
            }
            client.query('BEGIN', err => {
                if (err) {
                    res.end(err);
                }
                client.query("SELECT *from projekat.kviz where id = $1;", [req.params.kviz_id], (err, result) => {
                    if (err) {
                        result.end(err);
                    }
                    const insertNarudjbe = "SELECT * from projekat.pitanja  where kviz_id = $1";
                    client.query(insertNarudjbe, [req.params.kviz_id], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        var objecti = result.rows;
                        var kraj = result.rows[0].kraj;
                        const insertNarudjbe = "select *from projekat.ucesnici where kviz_id = $1 order by bodovi desc;";
                        client.query(insertNarudjbe, [req.params.kviz_id], (err, result) => {
                            if (err) {
                                console.log(err);
                            }

                            client.query('COMMIT', err => {
                                if (err) {
                                    console.error('Error committing transaction', err.stack)
                                }
                                console.log(kraj);
                                if (!kraj) {
                                    res.render('rezultati', {
                                        title: 'Rezultati',
                                        rezultati: result.rows,
                                    });
                            }
                        });
                    });
                });
            });
        });
    });
});

router.get('/:id/pregled/:kviz_id' ,function (req, res, next){
    console.log(req.params.kviz_id);
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("select *from projekat.odgovori_studenti os " +
            "inner join projekat.pitanja p " +
            "on os.pitanje_id = p.id " +
            "where p.kviz_id = $1 order by p.pitanje;",
            [req.params.kviz_id] ,
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                } else {
                    res.render('pregled',{
                        title: 'Odgovori',
                        objekti: result.rows
                    })
                }
            });
    });


});
module.exports = router;

/*
                            client.query("update projekat.kviz set kraj_kviz = true;",(err, result) => {
                                if (err){
                                    console.log(err);
                                }
                                client.query("update projekat.pitanja set postavljeno = false, tip = 1;",(err, result) => {
                                    if (err){
                                        console.log(err);
                                    }
                                    client.query('COMMIT', err => {
                                        if (err) {
                                            console.error('Error committing transaction', err.stack)
                                        }
                                        res.redirect('back');
                                        done();
                                    });
                                });
                            });

*/