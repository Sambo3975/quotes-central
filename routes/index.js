var express = require('express');
var dotenv = require('dotenv');
var path = require('path');
var router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

require('dotenv').config({path: path.resolve(process.cwd(), 'vars.env')});

var pg = require('pg');
pg.defaults.ssl = true;
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({connectionString: connectionString});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET user data */
router.get('/user', getUserData);

function getUserData(req, res) {
	const id = req.query.id;
	pool.query('SELECT * FROM quote_users WHERE id = $1', [id], (error, result) => {
		if (error) {
			throw error;
		}
		
		res.json(result.rows[0]);
	});
}

/* POST new user */
router.post('/user', addUser);

function addUser(req, res) {
	var formData = req.body;
	var username = formData.username;
	var screenname = formData.screenname;
	var password = formData.password;
	
	bcrypt.hash(password, saltRounds, (err, hash) => {
		if (err)
			throw err;
		pool.query(
			"INSERT INTO quote_users (username, screenname, password, isAdmin, isBanned) values ($1, $2, $3, FALSE, FALSE)",
			[username, screenname, hash],
			(error, result) => {
				if (error)
					throw error;
				
				res.send("User Added");
			}
		)
	})
}

/* DELETE user */
router.delete('/user', removeUser);

function removeUser(req, res) {
	var id = req.body.id;
	
	pool.query("DELETE FROM quote_users WHERE id = $1", [id], (error, result) => {
		if (error)
			throw error;
		
		res.send("User Deleted");
	})
}

/* GET quotes */
router.get('/quotes', searchQuotes);

const fields = ['quote', 'attribution', 'medium_id', 'source', 'submissionDate', 'category_id', 'username']

function searchQuotes(req, res) {
	const query = req.query;
	
	var queryString = 'SELECT q.id, q.quote, q.attribution, q.source, q.submissionDate, m.name AS medium, c.name AS category, u.username, u.screenname FROM quotes q, media m, categories c, quote_users u WHERE q.medium_id = m.id AND q.category_id = c.id AND q.user_id = u.id';
	
	for (var i = 0; i < fields.length; ++i) {
		if (query[fields[i]] !== "") {
			queryString += " AND (" + fields[i] + " = '" + query[fields[i]] + "'";
			if (fields[i] === "username")
				// The user may be searching by username or by screen name, because
				// the username is displayed on quotes when the screen name is not
				// given for the user who submitted a quote.
				queryString += " OR screenname = '" + query[fields[i]] + "'";
			
			queryString += ")"
		}
	}
	
	pool.query(queryString, (error, result) => {
		if (error)
			throw error;
		
		res.json(result.rows);
	})
}

/* POST quote */
router.post('/quotes', addQuote);

const addFields = ['quote', 'source', 'attribution', 'medium_id', 'category_id', 'user_id', 'submissionDate']

function addQuote(req, res) {
	const body = req.body;
	
	var cols = " (";
	var vals = " VALUES (";
	
	var comma = false
	
	for (var i = 0; i < addFields.length; ++i) {
		if (body[addFields[i]] !== "") {
			if (comma) {
				cols += ", ";
				vals += ", ";
			}
			comma = true;
			cols += addFields[i];
			vals += "'" + body[addFields[i]] + "'";
		}
	}
	
	cols += ")";
	vals += ")";
	
	queryString = "INSERT INTO quotes" + cols + vals;
	
	pool.query(queryString, (error, result) => {
		if (error)
			throw error;
		
		res.send("Quote Added");
	})
}

/* DELETE quote */
router.delete('/quotes', removeQuote);

function removeQuote(req, res) {
	var id = req.body.id;
	
	pool.query("DELETE FROM quotes WHERE id = $1", [id], (error, result) => {
		if (error)
			throw error;
		
		res.send("Quote Deleted");
	})
}

module.exports = router;
