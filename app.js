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
    user: 'team24',
    password: 'team24',
    database: 'team24'
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


// sign in 할 때 세션에 접근한 사용자의 role을 저장해 현재 로그인을 한 사용자가 무슨 user인지 구분해 접근 제어를 한다.

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
                var sql = 'select hospital_name, contact, h_receipt_time, patient_id, patient_name, prsc_unit, C.pill_code, pill_name from (select hospital_name, contact, h_receipt_time, patient_id, patient_name, B.diagnosis_code, prsc_unit, pill_code from (select hospital_name, contact, h_receipt_time, patient_id, patient_name, diagnosis_code, prsc_unit from (select hospital_id, h_receipt_time, patient.patient_id, diagnosis_code, prsc_unit, patient_name from medical_chart join patient on medical_chart.patient_id = patient.patient_id) AS A join hospital on A.hospital_id = hospital.hospital_id) AS B join prescription_guide on B.diagnosis_code = prescription_guide.diagnosis_code) AS C join pill on pill.pill_code = C.pill_code where patient_id = ? ORDER BY h_receipt_time DESC';
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
                var sql = 'select chart_no, p_receipt_time, patient_id, pill.pill_code, pill_name, prsc_unit from prescription_chart join pill on prescription_chart.pill_code = pill.pill_code where pharmacy_id = ? order by p_receipt_time asc';
                var pa = [req.session.nickname];
                connection.query(sql, pa, function(err, results){
                    
                    res.render('prescription_board.ejs', {results: results});
                })
                
            }else{
                res.send('<script type="text/javascript">alert("Permission denied!!");</script>');
            }
        }else{
            if(req.session.role == 'insuranceCompany'){
                var sql='select chart_no, i_receipt_time, patient_id, tot_expense, med_tr_name from insurance_chart join medical_tr on insurance_chart.med_tr_code = medical_tr.med_tr_code where insurance_id = ?';
                var pa = [req.session.nickname];
                connection.query(sql, pa, function(err, results){
                    res.render('view_claims.ejs', {results: results});
                })
            }else{
                res.send('<script type="text/javascript">alert("Permission denied!!");</script>');
            }
        }
            
    }
})


// 각각의 role마다 다른 회원가입 페이지로 이동
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


// sign in 과정 (아이디와 비밀번호를 올바르게 입력하면 index 페이지로 이동, 다르게 입력하면 다시 입력하라는 팝업창 띄워짐)
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


// 로그아웃 기능 (로그아웃을 누르면 현재 로그인 되어 있는 세션 정보를 destroy한다)
app.get('/logout', function(req, res){
    req.session.is_logined = false;
    req.session.destroy(function(err){
        res.redirect('/');
    })
})


// 회원가입 시 데이터베이스에 사용자 정보 저장 (hospital table)
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

// 회원가입 시 데이터베이스에 사용자 정보 저장 (patient table)
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


// 회원가입 시 데이터베이스에 사용자 정보 저장 (pharmacy table)
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

// 회원가입 시 데이터베이스에 사용자 정보 저장 (insurance_company table)
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

// 병원이 medical chart를 작성하면 작성한 내역을 medical_chart table에 저장
app.post('/create_chart', function(req, res){
    
    var sql = 'insert into medical_chart (hospital_id, h_receipt_time, patient_id, symptom, diagnosis_code, prsc_unit) values (?, NOW(), ?, ?, ?, ?)';
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


// 병원은 자신이 작성한 medical chart를 열람한다.
app.get('/view_chart', function(req, res){
    
    var sql = 'SELECT h_receipt_time, patient_name, symptom, diagnosis_name, med_tr_name, pill_name, prsc_unit FROM medical_chart NATURAL JOIN patient as MP JOIN vDcombMedPrsc using (diagnosis_code) where hospital_id = ? ORDER BY h_receipt_time DESC';
    var pa = [req.session.nickname];
    
    connection.query(sql, pa, function(err, rows){
        sql = 'select patient_name from patient';
        connection.query(sql, function(err, names){
            res.render('view_chart.ejs', {results: rows, names: names});
        })
        
    })
   
    
})


// medical_chart 열람 시 환자별로 선택해서 열람할 수 있는 기능
app.post('/view_chart/patient', function(req, res){
    
    var sql = 'SELECT h_receipt_time, patient_name, symptom, diagnosis_name, med_tr_name, pill_name, prsc_unit FROM medical_chart NATURAL JOIN patient as MP JOIN vDcombMedPrsc using (diagnosis_code) where hospital_id = ? and patient_name = ? ORDER BY h_receipt_time DESC';
    var pa = [req.session.nickname, req.body.patient];
    
    connection.query(sql, pa, function(err, rows){
        sql = 'select patient_name from patient';
        connection.query(sql, function(err, names){
            res.render('view_chart.ejs', {results: rows, names: names});
        })
        
    })
   
    
})


// 병원은 환자의 기본 정보와 그간의 medical history 내역을 확인 가능 (vDcombMedPrsc view table 이용)
app.get('/view_patient', function(req, res){
    res.render('view_patient.ejs', {session: false});
})

app.post('/search', function(req, res){
    var sql = 'SELECT hospital_id, patient_name, age, contact, h_receipt_time, symptom, diagnosis_name, med_tr_name, pill_name, default_quantity FROM medical_chart as MC, patient as P, vDcombMedPrsc as V WHERE MC.diagnosis_code = V.diagnosis_code AND MC.patient_id=P.patient_id AND P.patient_id = ? ORDER BY h_receipt_time desc';
    var pa = [req.body.patient_id];
    
    connection.query(sql, pa, function(err, rows){
        res.render('view_patient.ejs', {session: true, results: rows});
    })
    
})

// 환자는 자신이 처방받은 처방전 하나하나에 대한 각각의 상세정보 확인 가능
app.get('/prescription/detail/:i', function(req, res){
    var sql = 'select pharmacy_id from pharmacy';
    connection.query(sql, function(err, rows){
        res.render('prescription_detail.ejs', {result: req.session.results[req.params.i], pharmacies: rows});
    })
    
})


// 환자가 약국에게 자신의 처방전을 전달 (transaction 이용)
app.post('/pharmacy_tran', function(req, res){
    
    // 약국에게 처방전 전송하는 transaction
    connection.beginTransaction(function(err){
        if(err){
            throw err;
        }
        var sql = 'insert into prescription_chart (pharmacy_id, p_receipt_time, patient_id, pill_code, prsc_unit) values (?, NOW(), ?, ?, ?)';
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


// 환자가 자신의 의료 영수증을 보험회사에게 전달하는 기능 (transaction 이용)
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
            var sql = 'insert into insurance_chart (insurance_id, i_receipt_time, patient_id, med_tr_code, med_ch_time, tot_expense) values (?, NOW(), ?, ?, NOW() - 10, ?)';
        var pa = [req.body.insurancecompany, req.session.nickname, rows[0].med_tr_code, req.session.receipts[req.body.box].expense];
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

// 환자는 자신의 의료 기록에 대한 영수증을 열람할 수 있다.
app.get('/view_receipt', function(req, res){
    var sql = 'select * from patient where patient_id = ?';
    connection.query(sql, [req.session.nickname], function(err, result){
        sql = 'select hospital_name, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_name from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_code from (select hospital_id, h_receipt_time, symptom, C.diagnosis_code, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, B.diagnosis_code, diagnosis_name, med_tr_code from (select hospital_id, h_receipt_time, symptom, A.diagnosis_code, diagnosis_name from (select hospital_id, h_receipt_time, symptom, diagnosis_code from patient join medical_chart on patient.patient_id = medical_chart.patient_id and patient.patient_id = ?) AS A JOIN diagnosis on A.diagnosis_code = diagnosis.diagnosis_code) AS B JOIN medical_tr_guide on B.diagnosis_code = medical_tr_guide.diagnosis_code) AS C JOIN medical_tr on C.med_tr_code = medical_tr.med_tr_code) AS D JOIN prescription_guide ON D.diagnosis_code = prescription_guide.diagnosis_code) AS E JOIN pill on pill.pill_code = E.pill_code ORDER BY h_receipt_time DESC) AS E JOIN hospital on hospital.hospital_id = E.hospital_id ORDER BY h_receipt_time DESC';
        
        // Total expense 뽑아내기 위한 aggregation 함수
        var sql1 = 'select SUM(expense) from (select hospital_name, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_name from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_code from (select hospital_id, h_receipt_time, symptom, C.diagnosis_code, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, B.diagnosis_code, diagnosis_name, med_tr_code from (select hospital_id, h_receipt_time, symptom, A.diagnosis_code, diagnosis_name from (select hospital_id, h_receipt_time, symptom, diagnosis_code from patient join medical_chart on patient.patient_id = medical_chart.patient_id and patient.patient_id = ?) AS A JOIN diagnosis on A.diagnosis_code = diagnosis.diagnosis_code) AS B JOIN medical_tr_guide on B.diagnosis_code = medical_tr_guide.diagnosis_code) AS C JOIN medical_tr on C.med_tr_code = medical_tr.med_tr_code) AS D JOIN prescription_guide ON D.diagnosis_code = prescription_guide.diagnosis_code) AS E JOIN pill on pill.pill_code = E.pill_code ORDER BY h_receipt_time DESC) AS E JOIN hospital on hospital.hospital_id = E.hospital_id ORDER BY h_receipt_time DESC) AS A GROUP BY h_receipt_time';
        connection.query(sql, [req.session.nickname], function(err, results){
            res.render('view_receipt.ejs', {patient: result[0], results: results, i: 0});
        })
        
    })
})


// 환자는 자신의 영수증을 보험회사에게 전달 가능
app.get('/send_receipt', function(req, res){
    var sql = 'select * from patient where patient_id = ?';
    connection.query(sql, [req.session.nickname], function(err, result){
        sql = 'select hospital_name, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_name from (select hospital_id, h_receipt_time, symptom, diagnosis_name, med_tr_name, expense, pill_code from (select hospital_id, h_receipt_time, symptom, C.diagnosis_code, diagnosis_name, med_tr_name, expense from (select hospital_id, h_receipt_time, symptom, B.diagnosis_code, diagnosis_name, med_tr_code from (select hospital_id, h_receipt_time, symptom, A.diagnosis_code, diagnosis_name from (select hospital_id, h_receipt_time, symptom, diagnosis_code from patient join medical_chart on patient.patient_id = medical_chart.patient_id and patient.patient_id = ?) AS A JOIN diagnosis on A.diagnosis_code = diagnosis.diagnosis_code) AS B JOIN medical_tr_guide on B.diagnosis_code = medical_tr_guide.diagnosis_code) AS C JOIN medical_tr on C.med_tr_code = medical_tr.med_tr_code) AS D JOIN prescription_guide ON D.diagnosis_code = prescription_guide.diagnosis_code) AS E JOIN pill on pill.pill_code = E.pill_code ORDER BY h_receipt_time DESC) AS E JOIN hospital on hospital.hospital_id = E.hospital_id;';
        connection.query(sql, [req.session.nickname], function(err, results){
            req.session.receipts = results;
            req.session.save();
            connection.query('select insurance_id from insurance_company', function(err, rs){
                res.render('send_receipt.ejs', {patient: result[0], results: results, i: 0, companies: rs});
            })
            
        })
        
    })
    
})


//환자는 자신의 개인 정보(프로필)를 업데이트
app.get('/update', function(req, res){
    var sql = 'select * from patient where patient_id = ?';
    var pa = [req.session.nickname];
    connection.query(sql, pa, function(err, result){
        if(err)
            console.log(err);
        res.render('update_profile.ejs', {result: result});
    })
})


// 최종업데이트 버튼을 누르면 작성한 정보가 post method로 전달되어 update 쿼리문 실행
app.post('/update_fin', function(req, res){
    var sql = 'update patient set patient_id = ?, patient_pw = ?, patient_name = ?, age = ?, contact = ? where patient_id = ?';
    var pa = [req.body.patientid, req.body.patientpw, req.body.patientname, req.body.patientage, req.body.patientcontact, req.session.nickname];
    connection.query(sql, pa, function(err, result){
        req.session.nickname = req.body.patientid;
        req.session.save();
        res.send('<script type="text/javascript">alert("Updated!!!");</script>');
    })
})

// 약국에서 조제가 끝난 처방전은 finish 버튼을 눌러 내역에서 삭제한다.
app.post('/delete_pres', function(req, res){
    var sql = 'delete from prescription_chart where chart_no = ?';
    var pa = [req.body.id];
    connection.query(sql, pa, function(err, result){
        if(err)
            console.log(err);
        res.redirect('/login/pharmacy')
    })
})
app.listen(3001, function(req, res){
    console.log("Connecting to 3001 port!!!");
})