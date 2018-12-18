// Run a search through the quotes table
function runSearch() {
	// Collect form data
	var categoryID = $("input[name='category_id']:checked").val();
	var mediumID = $("input[name='medium_id']:checked").val();
	var source = $("#source").val();
	var attribution = $("#attribution").val();
	var submissionDate = $("#submissionDate").val();
	var username = $("#username").val();
	var quote = $("#quote-contents").val();
	
	// Send get request
	$.get("quotes", {
		category_id:    categoryID,
		medium_id:      mediumID,
		source:         source,
		attribution:    attribution,
		submissionDate: submissionDate,
		username:       username,
		quote:          quote
	}).done(function(data) {
		// prepare output html
		html = "";
		
		for (i = 0; i < data.length; ++i) {
			
			// Get the screen name of the user who submitted the quote
			// If the screen name is not set, use the username
			var submitter;
			if (data[i].screenname) {
				submitter = data[i].screenname;
			} else {
				submitter = data[i].username;
			}
			
			// Format the date properly
			var date = new Date(data[i].submissiondate);
			console.log(date);
			var month = date.toLocaleString("en-us", {
				month: "long"
			});
			var day = date.getDate();
			var year = date.getFullYear()
			date = `${month} ${day}, ${year}`;
			
			html += 
			`<div class="w3-panel w3-leftbar w3-sand w3-card-4 quote-box">
				<p class="w3-xlarge w3-serif quote">${data[i].quote}</p>
				<div class="w3-bar">
					<p class="w3-left">${data[i].attribution}, <i>${data[i].source}</i></p>
					<p class="w3-right">Submitted by ${submitter} on ${date}</p>
				</div>
			</div>`;
			
			$("#search-results").html(html);
		}
	}).fail(function() {
		// prepare failure message
		console.log("FAIL");
	});
	
}