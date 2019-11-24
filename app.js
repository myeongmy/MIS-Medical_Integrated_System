var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var mysql = require('mysql');
var bodyparser = require('body-parser')


var app = express();
app.use(bodyparser.urlencoded({extended: false}))
app.use(express.static('public'))

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '101210',
    database: 'mis'
});

app.use(session({
  secret: 'sdfafesafddfsd',  
  resave: false,         
  saveUninitialized: true, 
  store: new FileStore()
}))



app.set('view engine', 'ejs')
app.set('views', './views')

app.get('/', function(req, res){
    //req.session.is_logined = 0;
    if(req.session.is_logined === true)
        res.render('index.ejs', {role: req.session.role, nickname: req.session.nickname});
    else
        res.sendFile(__dirname+'/index.html');
        
})

app.get('/login/:role', function(req, res){
    if(!req.session.is_logined)
        res.render('login.ejs', {role: req.params.role});
    else{
        if(req.params.role === 'hospital'){
            if(req.session.role == 'hospital')
                res.render('create_chart.ejs', {time: Date()});
            else
                res.send('<script type="text/javascript">alert("Permission denied!!");</script>');
        }
        else if(req.params.role === 'patient'){
            if(req.session.role == 'patient'){
                var sql = 'select hospital_name, contact, receipt_time, patient_id, patient_name, prsc_unit, C.pill_code, pill_name from (select hospital_name, contact, receipt_time, patient_id, patient_name, B.diagnosis_code, prsc_unit, pill_code from (select hospital_name, contact, receipt_time, patient_id, patient_name, diagnosis_code, prsc_unit from (select hospital_id, receipt_time, patient.patient_id, diagnosis_code, prsc_unit, patient_name from medical_chart join patient on medical_chart.patient_id = patient.patient_id) AS A join hospital on A.hospital_id = hospital.hospital_id) AS B join prescription_guide on B.diagnosis_code = prescription_guide.diagnosis_code) AS C join pill on pill.pill_code = C.pill_code where patient_id = ?';
            var par = [req.session.nickname];
            connection.query(sql, par, function(err, rows){
                if(rows.length < 1)
                    res.send('<script type="text/javascript">alert("No prescription yet!");</script>');
                else{
                    req.session.results = rows;
                    req.session.save();
                    res.render('view_prescription.ejs', {results: rows});
                }
            })
            }else{
                res.send('<script type="text/javascript">alert("Permission denied!!");</script>');
            }
            
        }else if(req.params.role === 'pharmacy'){
            if(req.session.role == 'pharmacy'){
                res.render('prescription_board.ejs');
            }else{
                res.send('<script type="text/javascript">alert("Permission denied!!");</script>');
            }
        }
            
    }
})

app.get('/sign_up/:role', function(req, res){
    if(req.params.role === 'hospital')
        res.render('signup_hospital.ejs', {role: req.params.role});
    else if(req.params.role === 'patient')
        res.render('signup_patient.ejs', {role: req.params.role});
    else if(req.params.role === 'pharmacy')
        res.render('signup_pharmacy.ejs', {role: req.params.role});
    else if(req.params.role === 'insuranceCompany')
        res.render('signup_insurancecompany.ejs', {role: req.params.role});
})

app.post('/sign_in/:role', function(req, res, next){
    
    //connection.connect();
    if(req.params.role === 'hospital'){
       
        var sql = 'select * from hospital where hospital_id = ? and hospital_pw = ?';
        connection.query(sql, [req.body.id, req.body.password], function(err, rows){
            
            if(rows.length < 1){
                res.send('<script type="text/javascript">alert("Please enter id and password again!");</script>');
            }else{
                req.session.is_logined = true;
                req.session.role = req.params.role;
                req.session.nickname = rows[0].hospital_id;
                //connection.end();
                req.session.save(function(){
                    res.redirect('/');
                })
            }
            
                
        })
    }else if(req.params.role === 'patient'){
        var sql = 'select * from patient where patient_id = ? and patient_pw = ?';
        connection.query(sql, [req.body.id, req.body.password], function(err, rows){
            
            if(rows.length < 1){
                res.send('<script type="text/javascript">alert("Please enter id and password again!");</script>');
            }else{
                req.session.is_logined = true;
                req.session.role = req.params.role;
                req.session.nickname = rows[0].patient_id;
                //connection.end();
                req.session.save(function(){
                    res.redirect('/');
                })
            }
            
                
        })
    }else if(req.params.role === 'pharmacy'){
        var sql = 'select * from pharmacy where pharmacy_id = ? and pharmacy_pw = ?';
        connection.query(sql, [req.body.id, req.body.password], function(err, rows){
            
            if(rows.length < 1){
                res.send('<script type="text/javascript">alert("Please enter id and password again!");</script>');
            }else{
                req.session.is_logined = true;
                req.session.role = req.params.role;
                req.session.nickname = rows[0].pharmacy_id;
                //connection.end();
                req.session.save(function(){
                    res.redirect('/');
                })
            }
            
                
        })
    }else{
        var sql = 'select * from insurance_company where insurance_id = ? and insurance_pw = ?';
        connection.query(sql, [req.body.id, req.body.password], function(err, rows){
            
            if(rows.length < 1){
                res.send('<script type="text/javascript">alert("Please enter id and password again!");</script>');
            }else{
                req.session.is_logined = true;
                req.session.role = req.params.role;
                req.session.nickname = rows[0].insurance_id;
                //connection.end();
                req.session.save(function(){
                    res.redirect('/');
                })
            }
            
                
        })
    }
    
})


app.get('/logout', function(req, res){
    req.session.is_logined = false;
    req.session.destroy(function(err){
        res.redirect('/');
    })
})

app.post('/register/hospital', function(req, res){
    //connection.connect();
    var sql = 'insert into hospital values (?, ?, ?, ?, ?, ?)';
    var par = [req.body.id, req.body.password, req.body.name, req.body.business_reg_num, req.body.location, req.body.contact];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            //connection.end();
            res.redirect('/login/hospital');
        }
    })
})

app.post('/register/patient', function(req, res){
    //connection.connect();
    var sql = 'insert into patient values (?, ?, ?, ?, ?, ?)';
    var par = [req.body.id, req.body.password, req.body.name, req.body.age, req.body.address, req.body.contact];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            //connection.end();
            res.redirect('/login/patient');
        }
    })
})


app.post('/register/pharmacy', function(req, res){
    //connection.connect();
    var sql = 'insert into pharmacy values (?, ?, ?, ?, ?, ?)';
    var par = [req.body.id, req.body.password, req.body.name, req.body.business_reg_num, req.body.location, req.body.contact];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            //connection.end();
            res.redirect('/login/pharmacy');
        }
    })
})


app.post('/register/insuranceCompany', function(req, res){
    //connection.connect();
    var sql = 'insert into insurance_company values (?, ?, ?, ?, ?, ?)';
    var par = [req.body.id, req.body.password, req.body.name, req.body.business_reg_num, req.body.location, req.body.contact];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            //connection.end();
            res.redirect('/login/insuranceCompany');
        }
    })
})


app.post('/create_chart', function(req, res){
    
    var sql = 'insert into medical_chart (hospital_id, receipt_time, patient_id, symptom, diagnosis_code, prsc_unit) values (?, NOW(), ?, ?, ?, ?)';
    var par = [req.session.nickname, req.body.patientid, req.body.symptom, req.body.diagnosiscode, req.body.unit];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            res.send('<script type="text/javascript">alert("Your writing is complete!");</script>');
        }
    })
})

app.get('/view_chart', function(req, res){
    
})

app.get('/view_patient', function(req, res){
    res.render('view_patient.ejs', {session: false});
})

app.post('/search', function(req, res){
    
    var sql = 'select * from patient where patient_id = ?';
    var par = [req.body.patient_id];
    connection.query(sql, par, function(err, rows, fields){
        if(err){
            res.send('<script type="text/javascript">alert("Please write correct id!!");</script>');
        }else{
            sql = 'SELECT receipt_time, symptom, diagnosis_name, med_tr_name, pill_name, default_quantity FROM medical_chart as MC, patient as P, vDcombMedPrsc as V WHERE MC.diagnosis_code = V.diagnosis_code AND MC.patient_id=P.patient_id AND P.patient_id = ? ORDER BY receipt_time desc';
            par = [req.body.patient_id];
            connection.query(sql, par, function(err, results){
                sql = 'SELECT DISTINCT med_tr_name FROM (SELECT patient_name, age, contact, receipt_time, symptom, diagnosis_name, med_tr_name, pill_name, default_quantity FROM medical_chart as MC, patient as P, vDcombMedPrsc as V WHERE MC.diagnosis_code = V.diagnosis_code AND MC.patient_id=P.patient_id AND P.patient_id = ? ORDER BY receipt_time desc) AS A';
                par = [req.body.patient_id];
                connection.query(sql, par, function(err, trs){
                    sql = 'SELECT DISTINCT pill_name FROM (SELECT patient_name, age, contact, receipt_time, symptom, diagnosis_name, med_tr_name, pill_name, default_quantity FROM medical_chart as MC, patient as P, vDcombMedPrsc as V WHERE MC.diagnosis_code = V.diagnosis_code AND MC.patient_id=P.patient_id AND P.patient_id = ? ORDER BY receipt_time desc) AS A';
                     par = [req.body.patient_id];
                    connection.query(sql, par, function(err, pills){
                        sql = 'SELECT DISTINCT receipt_time FROM (SELECT patient_name, age, contact, receipt_time, symptom, diagnosis_name, med_tr_name, pill_name, default_quantity FROM medical_chart as MC, patient as P, vDcombMedPrsc as V WHERE MC.diagnosis_code = V.diagnosis_code AND MC.patient_id=P.patient_id AND P.patient_id = ? ORDER BY receipt_time desc) AS A';
                        par = [req.body.patient_id];
                        connection.query(sql, par, function(err, time){
                            res.render('view_patient.ejs', {id: req.body.patient_id, name: rows[0].patient_name, contact: rows[0].contact, age: rows[0].age, session: true, results: results, trs: trs, pills: pills, time: time});
                        })
                        
                    })
                })
                
            })
            
        }
    })
})

app.get('/prescription/detail/:i', function(req, res){
    var sql = 'select pharmacy_id from pharmacy';
    connection.query(sql, function(err, rows){
        res.render('prescription_detail.ejs', {result: req.session.results[req.params.i], pharmacies: rows});
    })
    
})

app.post('/pharmacy_tran', function(req, res){
    
    // 약국에게 처방전 전송하는 transaction
    connection.beginTransaction(function(err){
        if(err){
            throw err;
        }
        var sql = 'insert into prescription_chart values (?, NOW(), ?, ?, ?)';
        var pa = [req.body.pharmacy, req.session.nickname, req.body.pillcode, req.body.unit];
        connection.query(sql, pa, function(err, result){
            if(err){
                console.log(err);
                connection.rollback(function(){
                    console.log('rollback error');
                    throw err;
                })
            }
            console.log('insert transaction log');
            connection.commit(function (err) {
                    if (err) {
                        console.error(err);
                        connection.rollback(function () {
                               console.error('rollback error');
                               throw err;
                            });
                    }// if err
                 res.send('<script type="text/javascript">alert("Transaction committed!!!");</script>');
            })
        })
        
    })
})

app.post('/insurance_tran/:i', function(req, res){

    
    var sql1 = 'select med_tr_code from medical_tr where med_tr_name = ?';
    var par1 = [req.session.receipts[req.body.box].med_tr_name];
    connection.query(sql1, par1, function(err, rows){
        
    })
    // 보험회사에게 영수증 전송하는 transaction
    connection.beginTransaction(function(err){
        if(err){
            throw err;
        }
        var sql1 = 'select med_tr_code from medical_tr where med_tr_name = ?';
        var par1 = [req.session.receipts[req.body.box].med_tr_name];
        connection.query(sql1, par1, function(err, rows){
            var sql = 'insert into insurance_chart (insurance_id, receipt_time, patient_id, med_tr_code) values (?, NOW(), ?, ?)';
        var pa = [req.body.insurancecompany, req.session.nickname, rows[0].med_tr_code];
        connection.query(sql, pa, function(err, result){
            if(err){
                console.log(err);
                connection.rollback(function(){
                    console.log('rollback error');
                    throw err;
                })
            }
            console.log('insert transaction log');
            connection.commit(function (err) {
                    if (err) {
                        console.error(err);
                        connection.rollback(function () {
                               console.error('rollback error');
                               throw err;
                            });
                    }// if err
                 res.send('<script type="text/javascript">alert("Transaction committed!!!");</script>');
            })
        })
        
        })
        
    })
})
app.get('/view_receipt', function(req, res){
    var sql = 'select * from patient where patient_id = ?';
    connection.query(sql, [req.session.nickname], function(err, result){
        sql = 'select hospital_name, receipt_time, symptom, diagnosis_name, med_tr_name, expense from (select hospital_id, receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_name from (select hospital_id, receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_code from (select hospital_id, receipt_time, symptom, C.diagnosis_code, diagnosis_name, med_tr_name, expense from (select hospital_id, receipt_time, symptom, B.diagnosis_code, diagnosis_name, med_tr_code from (select hospital_id, receipt_time, symptom, A.diagnosis_code, diagnosis_name from (select hospital_id, receipt_time, symptom, diagnosis_code from patient join medical_chart on patient.patient_id = medical_chart.patient_id and patient.patient_id = ?) AS A JOIN diagnosis on A.diagnosis_code = diagnosis.diagnosis_code) AS B JOIN medical_tr_guide on B.diagnosis_code = medical_tr_guide.diagnosis_code) AS C JOIN medical_tr on C.med_tr_code = medical_tr.med_tr_code) AS D JOIN prescription_guide ON D.diagnosis_code = prescription_guide.diagnosis_code) AS E JOIN pill on pill.pill_code = E.pill_code ORDER BY receipt_time DESC) AS E JOIN hospital on hospital.hospital_id = E.hospital_id;';
        connection.query(sql, [req.session.nickname], function(err, results){
            res.render('view_receipt.ejs', {patient: result[0], results: results, i: 0});
        })
        
    })
})

app.get('/send_receipt', function(req, res){
    var sql = 'select * from patient where patient_id = ?';
    connection.query(sql, [req.session.nickname], function(err, result){
        sql = 'select hospital_name, receipt_time, symptom, diagnosis_name, med_tr_name, expense from (select hospital_id, receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_name from (select hospital_id, receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_code from (select hospital_id, receipt_time, symptom, C.diagnosis_code, diagnosis_name, med_tr_name, expense from (select hospital_id, receipt_time, symptom, B.diagnosis_code, diagnosis_name, med_tr_code from (select hospital_id, receipt_time, symptom, A.diagnosis_code, diagnosis_name from (select hospital_id, receipt_time, symptom, diagnosis_code from patient join medical_chart on patient.patient_id = medical_chart.patient_id and patient.patient_id = ?) AS A JOIN diagnosis on A.diagnosis_code = diagnosis.diagnosis_code) AS B JOIN medical_tr_guide on B.diagnosis_code = medical_tr_guide.diagnosis_code) AS C JOIN medical_tr on C.med_tr_code = medical_tr.med_tr_code) AS D JOIN prescription_guide ON D.diagnosis_code = prescription_guide.diagnosis_code) AS E JOIN pill on pill.pill_code = E.pill_code ORDER BY receipt_time DESC) AS E JOIN hospital on hospital.hospital_id = E.hospital_id;';
        connection.query(sql, [req.session.nickname], function(err, results){
            req.session.receipts = results;
            req.session.save();
            connection.query('select insurance_id from insurance_company', function(err, rs){
                res.render('send_receipt.ejs', {patient: result[0], results: results, i: 0, companies: rs});
            })
            
        })
        
    })
    
})

app.listen(3001, function(req, res){
    console.log("Connecting to 3001 port!!!");
})