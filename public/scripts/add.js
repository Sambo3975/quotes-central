// Add a quote to the database
function addQuote() {
	console.log("Running script")
	// Collect form data
	var categoryID = $("input[name='category_id']:checked").val();
	var mediumID = $("input[name='medium_id']:checked").val();
	var source = $("#source").val();
	var attribution = $("#attribution").val();
	var quote = $("#quote-contents").val();
	
	$.post("quotes", {
		category_id:    categoryID,
		medium_id:      mediumID,
		source:         source,
		attribution:    attribution,
		user_id:        "0",
		quote:          quote
	}).done(function(data) {
		var res = $("#result");
		res.removeClass("w3-hide")
			.html(data);
		if (data == "Quote added") {
			res.removeClass("w3-red")
				.addClass("w3-green");
		} else {
			res.removeClass("w3-green")
				.addClass("w3-red");
		}
		setTimeout(function(){$("#result").addClass("w3-hide");}, 3000)
	}).fail(function() {
		console.log("FAIL");
	})
}

$(function() {
	$("#quote-contents").change(function() {
		var quote = $("#quote-contents").val();
		$("#quote").text(quote.length > 0 ? quote : "Type something. What are you wating for?");
	});
	$("#source").change(function() {
		var source = $("#source").val();
		$("#src").text(source.length > 0 ? source : "Source");
	});
	$("#attribution").change(function() {
		var att = $("#attribution").val();
		$("#att").text(att.length > 0 ? att : "Attribution");
	});
})
