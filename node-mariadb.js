//var Client = require('mariasql');
//
//var c = new Client({
//  host: '127.0.0.1',
//  user: 'foo',
//  password: 'bar'
//});
//
//c.query('SHOW DATABASES', function(err, rows) {
//  if (err)
//    throw err;
//  console.dir(rows);
//});
//
//c.end();

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'simbosu',
  password : '1012',
  database : 'mis'
});

connection.connect();

var sql = 'show tables';

connection.query(sql, function(err, rows, fields){
    if(err)
        console.log(err);
    else{
        console.log(rows);
        }
    }
       
)

connection.end();