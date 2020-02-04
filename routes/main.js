var express = require('express');
var router = express.Router();
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var multer = require('multer');


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
var upload = multer({ //multer settings
    storage: storage,
    fileFilter : function(req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

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

const redirectLogin = (req, res, next) =>{
    if(!req.session.userID){
        res.redirect('/login');
    }else{
        next();
    }
};

const redirectHome = (req, res, next) =>{
    if(req.session.userID){
        res.redirect('/');
    }else{
        next();
    }
};


router.get('/login', redirectHome ,function (req, res, next) {
    console.log(req.session.userID + 'home');
    res.render('main', {
        title: 'LOG IN'
    })
});

router.get('/', redirectLogin, function (req, res, next) {
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
            client.query(queryText, (err, result)=> {
                if (err){
                    result.end(err);
                }
                const insertNarudjbe = 'Select * from projekat.predmet where predavac_id = $1';
                client.query(insertNarudjbe,[req.session.userID] ,(err, result) => {
                    if (err){
                        console.log(err);
                    }
                    var objecti = result.rows;
                    const insertNarudjbe = 'Select * from projekat.kviz where predavac_id = $1 order by id asc;';
                    client.query(insertNarudjbe,[req.session.userID] ,(err, result) => {
                        if (err){
                            console.log(err);
                        }
                        client.query('COMMIT', err => {
                            if (err) {
                                console.error('Error committing transaction', err.stack)
                            }res.render('index', {
                                title: req.body.uname,
                                objekti: objecti,
                                kvizovi: result.rows,
                                kvi: false,
                                predavac_id: req.session.userID
                            });
                            done();
                        });
                    });
                });
            });
        });
    });

});




router.post('/', function (req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN', err => {
            if (err){
                res.end(err);
            }

            const queryText = "select *from projekat.predavac where ime = $1 and password = $2;";
            client.query(queryText,[req.body.uname, req.body.psw], (err, result)=> {
                if (err){
                    result.end(err);
                }
                console.log(result.rows[0].id);
                req.session.userID = result.rows[0].id;
                const insertNarudjbe = 'Select * from projekat.predmet where predavac_id = $1';
                client.query(insertNarudjbe,[result.rows[0].id] ,(err, result) => {
                    if (err){
                        console.log(err);
                    }
                    var objecti = result.rows;
                    const insertNarudjbe = 'Select * from projekat.kviz where predavac_id = $1 order by id asc;';
                    client.query(insertNarudjbe,[req.session.userID] ,(err, result) => {
                        if (err){
                            console.log(err);
                        }
                        client.query('COMMIT', err => {
                            if (err) {
                                console.error('Error committing transaction', err.stack)
                            }res.render('index', {
                                title: req.body.uname,
                                objekti: objecti,
                                kvizovi: result.rows,
                                kvi: false,
                                predavac_id: req.session.userID
                            });
                            done();
                        });
                    });
                });
            });
        });
    });

});


router.get('/kviz', redirectHome, function (req, res, next) {
    res.render('main', {
        title: 'LOG IN'
    })});


router.get('/kviz/:kviz/:id', redirectLogin,function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query(
            "select *from projekat.pitanja p, projekat.odgovor o where kviz_id = $1 and o.pitanje_id = p.id;",[req.params.kviz],
            function (err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(400);
                } else {
                    console.log(result.rows);
                    res.render('pitanja', {
                        title: 'pitanje',
                        kviz_id: req.params.kviz,
                        nickname: req.params.id,
                        objekti: result.rows
                    })
                }

            });
    });
});

router.post('/kviz/:id', function(req, res, next) {
    console.log(req.body.pitanje);
    console.log(req.body.odgovor);
    var tekst = "";
    for(let i = 0; i < req.body.odgovor.length; i++){
        tekst +=  req.body.odgovor[i];
        tekst += " ";
    }

    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }
        client.query('BEGIN', err => {
            if (err){
                res.end(err);
            }

            const queryText = 'INSERT INTO projekat.pitanja(pitanje, kviz_id, tip, postavljeno, kraj) VALUES($1, $2, $3, $4, $5) RETURNING id';
            client.query(queryText, [req.body.pitanje, req.params.id, 1, false, false], (err, result) => {
                if (err){
                    result.end(err);
                }
                var insertNarudjbe = 'INSERT INTO projekat.odgovor(pitanje_id, tekst) VALUES';
                var tabela = [];
                for(let i = 0; i <req.body.odgovor.length; i++){
                    if(req.body.odgovor[i] !== ''){
                        tabela.push(req.body.odgovor[i])
                    }
                }
                for(let i = 0; i < tabela.length; i++) {
                    if (i === tabela.length - 1) {
                        insertNarudjbe += ' (' + `${result.rows[0].id}` + ',' + '\'' + `${tabela[i]}` + '\'' + ');';
                    } else {
                        insertNarudjbe += ' (' + `${result.rows[0].id}` + ',' + '\'' + `${tabela[i]}` + '\'' + '),';
                    }
                }
                client.query(insertNarudjbe,(err, result) => {
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

router.delete('/kviz/:id_kviz/brisi/:id', function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("DELETE FROM projekat.pitanja " +
            "WHERE id = $1;", [req.params.id],
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

router.get('/kviz/:id', redirectLogin, function(req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("SELECT *from projekat.komentari where kviz_id = $1 ORDER BY lajk desc;", [req.params.id],
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                    res.sendStatus(400);
                } else {
                    res.render('komentari_predavac',{
                        title: 'Komentari',
                        objecti: result.rows,
                        kviz_id: req.params.id
                    });
                }
            });
    });

});

router.post('/kviz/odgovor/:id',function (req,res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("UPDATE projekat.komentari set odgovoreno = $1" +
            "WHERE id = $2;", [1, req.params.id],
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


router.post('/kviz/:id/pokreni/:kviz_id', function (req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("SELECT *from projekat.pitanja where kviz_id = $1;", [req.params.kviz_id],
            function (err, result) {
                done();

                if (err) {
                    console.info(err);
                    res.sendStatus(400);
                } else {
                    res.render('komentari_predavac',{
                        title: 'Komentari',
                        objecti: result.rows,
                        kviz_id: req.params.kviz_id
                    });
                }
            });
    });
});


/*https://ciphertrick.com/read-excel-files-convert-json-node-js/*/

router.post('/upload/:id', function(req, res) {
    var exceltojson; //Initialization
    upload(req,res,function(err){
        if(err){
            res.json({error_code:1,err_desc:err});
            return;
        }
        /** Multer gives us file info in req.file object */
        if(!req.file){
            res.json({error_code:1,err_desc:"No file passed"});
            return;
        }
        //start convert process
        /** Check the extension of the incoming file and
         *  use the appropriate module
         */
        if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
            exceltojson = xlsxtojson;
        } else {
            exceltojson = xlstojson;
        }
        try {
            exceltojson({
                input: req.file.path, //the same path where we uploaded our file
                output: null, //since we don't need output.json
                lowerCaseHeaders:true
            }, function(err,result){
                if(err) {
                    return res.json({error_code:1,err_desc:err, data: null});
                }
                var tabela = result;
                queryText = 'INSERT INTO projekat.pitanja(pitanje, kviz_id, tip, postavljeno, kraj) VALUES ';
                for(let i = 0; i < result.length; i++){
                    if(i === result.length-1){
                        queryText += ' ('+ '\'' + `${result[i].pitanje}` + '\'' +','+`${req.params.id}`+ ',' +'1, false, false) returning id;';
                    }else {
                       queryText += ' ('+ '\'' +`${result[i].pitanje}`+ '\'' + ','+`${req.params.id}`+ ',' +'1, false, false),';
                    }
                    }
                console.log(queryText);
                pool.connect(function (err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error",' +
                                ' "status" : 500}');
                        }
                        client.query('BEGIN', err => {
                            if (err){
                                res.end(err);
                            }

                            client.query(queryText, (err, result) => {
                                if (err){
                                    result.end(err);
                                }
                                console.log(result.rows);
                                var insertNarudjbe = 'INSERT INTO projekat.odgovor(pitanje_id, tekst) VALUES';
                                for(let i = 0; i < tabela.length; i++){
                                    if(i === tabela.length-1){
                                        insertNarudjbe += ' (' + `${result.rows[i].id}`  +',' + '\'' +`${tabela[i].odgovor}`+'\''+ ');';
                                    }else {
                                        insertNarudjbe += ' ('+ `${result.rows[i].id}`+  ','+ '\'' +`${tabela[i].odgovor}` +  '\'' + '),';
                                    }
                                }
                                console.log(insertNarudjbe);
                                client.query(insertNarudjbe,(err, result) => {
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
        } catch (e){
            res.json({error_code:1,err_desc:"Corupted excel file"});
        }
    });

});
module.exports = router;


router.post('/predmet/:id', function (req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("insert into projekat.predmet(naziv, prikaz, predavac_id) values($1, true, $2);", [req.body.predmet, req.params.id],
            function (err, result) {
                done();
                if (err) {
                    console.info(err);
                } else {
                    res.redirect('back')
                }
            });
    });
});


router.post('/kreirajKviz/:id', function (req, res, next) {
    pool.connect(function (err, client, done) {
        if (err) {
            res.end('{"error" : "Error",' +
                ' "status" : 500}');
        }

        client.query("insert into projekat.kviz(ime, kraj_kviz, predavac_id, predmet_id) values($1, true, $2, $3);", [req.body.name, req.params.id, req.body.predmet],
            function (err, result) {
                done();
                if (err) {
                    console.info(err);
                } else {
                    res.redirect('back')
                }
            });
    });
});

/*
/kreirajKviz/<%=predavac_id%>
* <form class="md-form"  id        =  "uploadForm"
              enctype   =  "multipart/form-data"
              action    =  "/upload/<%=kviz_id%>"
              method    =  "post"
        >
            <div class="file-field">
                <div class="btn btn-primary btn-sm float-left">
                    <span>Choose files</span>
                    <input type="file" multiple>
                </div>
                    <input type="submit" value="Upload" name="submit">
            </div>
        </form>*/