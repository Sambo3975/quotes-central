SELECT q.id, q.quote, q.attribution, q.source, q.submissionDate, m.name, c.name, u.username, u.screenname FROM quotes q, media m, categories c, quote_users u
	WHERE q.medium_id = m.id AND q.category_id = c.id AND q.user_id = u.id
	AND q.id = 1;

SELECT q.id, q.quote, q.attribution, q.source, q.submissionDate, m.name, c.name, u.username, u.screenname FROM quotes q, media m, categories c, quote_users u
	WHERE q.medium_id = m.id AND q.category_id = c.id AND q.user_id = u.id
	AND q.user_id = 0;

SELECT q.id, q.quote, q.attribution, q.source, q.submissionDate, m.name AS medium, c.name AS category, u.username, u.screenname FROM quotes q, media m, categories c, quote_users u
	WHERE q.medium_id = m.id AND q.category_id = c.id AND q.user_id = u.id
	AND q.category_id = 1 AND q.medium_id = 5;
