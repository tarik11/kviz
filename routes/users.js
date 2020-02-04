var express = require('express');
var router = express.Router();

/* GET users listing. */
var config = {
    user: 'nnrekfcm',
    database: 'nnrekfcm',
    password: 'i_lGh76cXKoefSWV0vNvA6yCgv5pvotZ', //env var: PGPASSWORD
    host: 'salt.db.elephantsql.com',
    port: 5432,
    max: 100,
    idleTimeoutMillis: 30000
};

/*
*
* komentari na koji nisu odgovoreni cu sve na nulu pa gledat u ejs
*
* */

var pg = require('pg');
var pool = new pg.Pool(config);

const redirectLogin = (req, res, next) =>{
    if(!req.session.userInfo){
        res.redirect('/users/login');
    }else{
        next();
    }
};

const redirectHome = (req, res, next) =>{
    if(req.session.userInfo){
        res.redirect('/users');
    }else{
        next();
    }
};

router.get('/login', redirectHome,function(req, res, next) {
  res.render('users', {
      title: 'student'
  });
});

router.post('/', function(req, res, next) {
    if(req.body.pitanje === "Kviz") {
        pool.connect(function (err, client, done) {
            if (err) {
                res.end('{"error" : "Error",' +
                    ' "status" : 500}');
            }
            client.query('BEGIN', err => {
                if (err) {
                    res.end(err);
                }

                const queryText = 'INSERT INTO projekat.ucesnici(nickname, kviz_id, bodovi) VALUES($1, $2, $3) returning id';
                client.query(queryText, [req.body.nickname, req.body.code, 0], (err, result) => {
                    if (err) {
                        result.end(err);
                    }
                    req.session.userInfo = {
                        nickname: result.rows[0].id,
                        pitanje: req.body.pitanje,
                         code: req.body.code
                    };
                    const nickname = result.rows[0].id;
                    const selectPitanja = 'SELECT p.id, p.pitanje, p.kviz_id, p.tip, p.kraj from projekat.pitanja p, projekat.kviz k where p.kviz_id = $1 and k.id = $2;';

                    client.query(selectPitanja, [req.body.code, req.body.code], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        var kviz_id;
                        if(result.rows[0] === undefined){
                            kviz_id = broj;
                        }else{
                            kviz_id = result.rows[0].kviz_id;
                        }
                        var objecti = result.rows;
                        var kraj = result.rows[0].kraj;
                        const insertNarudjbe = "select *from projekat.ucesnici where kviz_id = $1 order by bodovi desc;";
                        client.query(insertNarudjbe, [parseFloat(req.session.userInfo.code)], (err, result) => {
                            if (err) {
                                console.log(err);
                            }

                            client.query('COMMIT', err => {
                                if (err) {
                                    console.error('Error committing transaction', err.stack)
                                }
                                console.log(kraj);
                                if(!kraj){
                                    res.render('ucesnici',{
                                        title: 'Ucesnici',
                                        nickname: req.session.userInfo.nickname,
                                        objecti: objecti,
                                        rezultati:result.rows,
                                        kviz_id: parseFloat(req.session.userInfo.code)
                                    });
                                }
                                else{
                                    res.render('kraj_kviz',{
                                        title: 'kraj_kviza',
                                        nickname: req.session.userInfo.nickname,
                                        objecti: objecti,
                                        kviz_id: parseFloat(req.session.userInfo.code)
                                    });
                                }
                                done();
                            });
                        });
                    });
                });
            });
        });
    }
    else{
        pool.connect(function (err, client, done) {
            if (err) {
                res.end('{"error" : "Error",' +
                    ' "status" : 500}');
            }
            client.query('BEGIN', err => {
                if (err) {
                    res.end(err);
                }
                var broj = parseFloat(req.body.code);
                const queryText = 'INSERT INTO projekat.student(nickname, kviz_id) VALUES($1, $2) RETURNING id';
                client.query(queryText, [req.body.nickname, broj], (err, result) => {
                    if (err) {
                        result.end(err);
                    }
                    const selectOdgovor = 'SELECT *from projekat.komentari where kviz_id = $1 and odgovoreno = 0 ORDER BY lajk desc;';
                    const nickname = req.body.nickname;
                    req.session.userInfo = {
                        nickname: req.body.nickname,
                        pitanje: req.body.pitanje,
                        code: req.body.code
                    };
                    client.query(selectOdgovor, [broj], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        client.query('COMMIT', err => {
                            if (err) {
                                console.error('Error committing transaction', err.stack)
                            }
                            var kviz_id;
                            if(result.rows[0] === undefined){
                                kviz_id = broj;
                            }else{
                                kviz_id = result.rows[0].kviz_id;
                            }
                            res.render('komentari',{
                                title: 'Komentari',
                                nickname: nickname,
                                objecti: result.rows,
                                kviz_id: kviz_id
                            });
                            done();
                        });
                    });
                });
            });
        });
    }
});


router.get('/', redirectLogin, function(req, res, next) {
    console.log(req.session.userInfo);
    if(req.session.userInfo.pitanje === "Kviz") {
        pool.connect(function (err, client, done) {
            if (err) {
                res.end('{"error" : "Error",' +
                    ' "status" : 500}');
            }
            client.query('BEGIN', err => {
                if (err) {
                    res.end(err);
                }
                client.query("SELECT *from projekat.kviz where id = $1;", [parseFloat(req.session.userInfo.code)], (err, result) => {
                    if (err) {
                        result.end(err);
                    }
                    const insertNarudjbe = "SELECT * from projekat.pitanja  where kviz_id = $1";
                    client.query(insertNarudjbe, [parseFloat(req.session.userInfo.code)], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        var objecti = result.rows;
                        var kraj = result.rows[0].kraj;
                        const insertNarudjbe = "select *from projekat.ucesnici where kviz_id = $1 order by bodovi desc;";
                        client.query(insertNarudjbe, [parseFloat(req.session.userInfo.code)], (err, result) => {
                            if (err) {
                                console.log(err);
                            }

                            client.query('COMMIT', err => {
                                if (err) {
                                    console.error('Error committing transaction', err.stack)
                                }
                                console.log(kraj);
                                if(!kraj){
                                    res.render('ucesnici',{
                                        title: 'Ucesnici',
                                        nickname: req.session.userInfo.nickname,
                                        objecti: objecti,
                                        rezultati:result.rows,
                                        kviz_id: parseFloat(req.session.userInfo.code)
                                    });
                                }
                                else{
                                    res.render('kraj_kviz',{
                                        title: 'kraj_kviza',
                                        nickname: req.session.userInfo.nickname,
                                        objecti: objecti,
                                        kviz_id: parseFloat(req.session.userInfo.code)
                                    });
                                }
                                done();
                            });
                        });
                    });
                });
            });
        });
    }
    else{
        pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("SELECT *from projekat.komentari where kviz_id = $1 and odgovoreno=0 ORDER BY lajk desc;", [parseFloat(req.session.userInfo.code)],
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                    res.sendStatus(400);
                } else {
                    res.render('komentari',{
                        title: 'Komentari',
                        nickname: req.session.userInfo.nickname,
                        objecti: result.rows,
                        kviz_id: parseFloat(req.session.userInfo.code)
                    });
                }
            });
    });
    }
});





router.post('/lajk/:id/:lajk', function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("UPDATE projekat.komentari set lajk = $1" +
            "WHERE id = $2;", [parseFloat(req.params.lajk) +1, req.params.id],
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                    res.sendStatus(400);
                } else {
                    res.sendStatus(200);
                }
            });
    });
});


router.post('/:nickname/:id', function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("insert into projekat.komentari(kviz_id, komentar, nickname, odgovoreno, lajk)" +
            "values($1, $2, $3, 0, 0);", [req.params.id, req.body.komentar, req.params.nickname],
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                    res.redirect('back');
                } else {
                    res.redirect('back');
                }
            });
    });
});


router.post('/odgovor/:pitanje_id/:id/:kviz_id', function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN', err => {
            if (err) {
                res.end(err);
            }
            client.query("insert into projekat.odgovori_studenti(pitanje_id, ucesnik_id, odgovor)" +
                "values($1, $2, $3);", [req.params.pitanje_id, req.params.id, req.body.odgovor], (err, result) => {
                if (err) {
                    result.end(err);
                }

                const insertNarudjbe = 'select *from projekat.pitanja p, projekat.odgovor o where kviz_id = $1 and o.pitanje_id = p.id and p.id = $2;';

                client.query(insertNarudjbe, [req.params.kviz_id, req.params.pitanje_id], (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    var bodovi = 0;
                    if(req.body.odgovor.trim() === result.rows[0].tekst.trim()){
                        bodovi = 100;
                    }
                    client.query("update projekat.ucesnici set bodovi = bodovi + $1 where id = $2 ", [bodovi, req.params.id], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        client.query("UPDATE projekat.pitanja set tip = 1;", (err, result) => {
                            if (err) {
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
    });
});

router.get('/odgovori/:kviz_id/:id', function (req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("select *from projekat.odgovori_studenti os " +
            "inner join projekat.pitanja p " +
            "on os.pitanje_id = p.id " +
            "where p.kviz_id = $1 and    ucesnik_id = $2;",
            [req.params.kviz_id,req.params.id] ,
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
