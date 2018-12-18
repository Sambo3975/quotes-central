var express = require('express');
var dotenv = require('dotenv');
var path = require('path');
var async = require('async');
var router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

require('dotenv').config({path: path.resolve(process.cwd(), 'vars.env')});

var pg = require('pg');
pg.defaults.ssl = true;
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({connectionString: connectionString});

function getCategories(callback) {
	pool.query('SELECT id, name FROM categories ORDER BY id', (err, res) => {
		if (err)
			return callback(err, null);
		
		callback(null, res.rows);
	});
}

function getMedia(callback) {
	pool.query('SELECT id, name FROM media ORDER BY id', (err, res) => {
		if (err)
			return callback(err, null);
		
		callback(null, res.rows);
	});
}


/* GET home page. */
router.get('/', function(req, res, next) {
	// Get the current year (for copyright year in the footer)
	var today = new Date();
	var year = today.getFullYear();
	
	async.parallel(
		{
			categories: getCategories,
			media: getMedia,
			randomQuote: function(callback) {
				pool.query('SELECT q.id, q.quote, q.attribution, q.source, q.submissionDate, m.name AS medium, c.name AS category, u.username, u.screenname FROM quotes q, media m, categories c, quote_users u WHERE q.medium_id = m.id AND q.category_id = c.id AND q.user_id = u.id ORDER BY RANDOM() LIMIT 1', (err, res) => {
					if (err)
						return callback(err, null);
					
					callback(null, res.rows[0]);
				});
			}
		},
		function(error, results) {
			if (error)
				throw error;

			// Get the screen name of the user who submitted the quote
			// If the screen name is not set, use the username
			var submitter;
			if (results.randomQuote.screenname) {
				submitter = results.randomQuote.screenname;
			} else {
				submitter = results.randomQuote.username;
			}
			
			// Format the date properly
			var date = results.randomQuote.submissiondate;
			var month = date.toLocaleString("en-us", {
				month: "long"
			});
			var day = date.getDate();
			var year = date.getFullYear()
			date = `${month} ${day}, ${year}`;
			
			res.render('index', {
				title:          'Quotes Central',
				year:           year,
				categories:     results.categories,
				media:          results.media,
				quote:          results.randomQuote.quote,
				attribution:    results.randomQuote.attribution,
				source:         results.randomQuote.source,
				submitter:      submitter,
				submissionDate: date
			});
		}
	);
});

/* GET the page for adding a quote */
router.get('/add', function(req, res, next) {
	// Get the current year (for copyright year in the footer)
	var today = new Date();
	var month = today.toLocaleString("en-us", {
		month: "long"
	});
	var day = today.getDate();
	var year = today.getFullYear();
	today = `${month} ${day}, ${year}`;
	
	async.parallel(
		{
			categories: getCategories,
			media: getMedia,
		},
		function(error, results) {
			if (error)
				throw error;
			
			res.render('add', {
				title:          'Add a Quote',
				year:           year,
				categories:     results.categories,
				media:          results.media,
				today:          today
			});
		}
	);
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
		if (query[fields[i]]) {
			var value = query[fields[i]].replace("'", "''");
			queryString += " AND (" + fields[i] + " = '" + value + "'";
			if (fields[i] === "username")
				// The user may be searching by username or by screen name, because
				// the username is displayed on quotes when the screen name is not
				// given for the user who submitted a quote.
				queryString += " OR screenname = '" + value + "'";
			
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

const addFields = ['quote', 'source', 'attribution', 'medium_id', 'category_id', 'user_id']

function addQuote(req, res) {
	const body = req.body;
	
	var cols = " (";
	var vals = " VALUES (";
	
	var comma = false
	
	for (var i = 0; i < addFields.length; ++i) {
		var value = body[addFields[i]];
		if (addFields[i] == 'user_id') { // Temporary until user auth is up.
			value = '0';
		}
		if (value) {
			value = value.replace("'","''");
			if (comma) {
				cols += ", ";
				vals += ", ";
			}
			comma = true;
			cols += addFields[i];
			vals += "'" + value + "'";
		} else {
			res.send(`Failed to add quote. The ${addFields[i]} field must be set.`);
			return;
		}
	}
	
	cols += ", submissionDate)";
	var today = new Date();
	var y = today.getFullYear();
	var m = today.getMonth() + 1;
	var d = today.getDate();
	vals += `, '${y}-${m}-${d}')`;
	
	queryString = "INSERT INTO quotes" + cols + vals;
	
	console.log(queryString);
	
	pool.query(queryString, (error, result) => {
		if (error)
			throw error;
		
		res.send("Quote added")
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
