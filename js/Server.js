var Server = {};
Server.getAll = function(callback) {
	var that = this;
	$.getJSON("assets/foodtrucks.json", function(d) {
    var data = d.data;
    var listing = [];
    for (var i = 0; i < data.length; i++) {
        var t = data[i];
        listing.push({
          type: t[10],
          title: t[9],
          lat: t[22],
          lng: t[23],
          menu: t[19],

        });
    }
    that.data = listing;
    callback(listing);
    that.filterData();
  });
}
Server.getSortedByFilter = function(filter, callback) {
	for (var i = 0; i < this.data.length; i++) {
		console.log(this.data);
	}
}
Server.filterData = function() {
	var filtered = {};
	var item; 
	var keyword = ["sandwich", "barbecue", "pizza", "salad", "drink", "coffee", "dessert", "hot dog",
		"indian", "american", "italian", "mexican"]
	for (var i = 0; i < this.data.length; i++) {
		item = this.data[i];
		if (item.menu && item.menu.indexOf(":") > - 1) {
			keyword = item.menu.substring(0, item.menu.indexOf(":"));
		} else {
			keyword = item.menu;
		} 
		if (filtered[keyword]) {
			filtered[keyword].push(this.data[i]);
		} else {
			filtered[keyword] = [this.data[i]];
		}
	}
	console.log(filtered);
}