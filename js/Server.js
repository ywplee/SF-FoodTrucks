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
          menu: t[19] ? t[19].replace(/\:/g,"<br>"): ""
        });
    }
    that.data = listing;
    callback(listing);
    that.filterData();
  });
}
/*
 * Menu filed doesn't really have a valid format. After some data mining, I concluded that there
 * are 3 primary categories for food truck, which are meals, snacks and beverages.
 */
Server.getFilteredData = function(filteredBy, callback) {
	var data = [];
	for (var type in filteredBy) {
		var sub = filteredBy[type];
		for (var i = 0; i < sub.length; i++) {
			data = data.concat(this.filtered[type][sub[i]]);
		}
	}
	console.log(data.length);
	callback(data);
}
Server.getKeywords = function() {
	return {
		"meals": [ 
			"sandwich", "pizza", "salad", "burrito", "hot dogs", "italian", "meat", "soup",
			"mexican", "indian", "filipino", "peruvian", "chicken", "kebab", "curry", "burger", "seafood"
		],
		"snacks": [
			"kettle corn", "ice cream", "dessert", "cupcake", "churros", "watermelon"
		],
		"beverages": [
			"coffee", "espresso", "juice"
		]
	};
}
Server.filterData = function() {
	this.filtered = {};
	var item, keyword, category; 
	var basicKeyword = this.getKeywords();

	var findCategory = function(keyword, categories){
		var found = [];
		if (keyword !== null) {
			var lower = keyword.toLowerCase();
			for (var category in categories) {
				var c = categories[category];
				for (var i = 0; i < c.length; i++) {
					if (lower.indexOf(c[i]) > -1) {
						var t = {"mainCategory": category, "subCategory": c[i]};
						found.push(t);
					}
				}
			}

		}
		return found;
	}
	var findKeyword = function(menu){
		var keyword = "";
		if (menu && menu.indexOf(":") > - 1) {
			keyword = menu.substring(0, menu.indexOf(":"));
		} else if (menu && menu.length > 0) {
			keyword = menu;
		}
		return keyword;
	}
	for (var i = 0; i < this.data.length; i++) {
		item = this.data[i];
		// keyword = findKeyword(item.menu);
		category = findCategory(item.menu, basicKeyword);
		if (category.length > 0) {
			for (var j = 0; j < category.length; j++) {
				var t = category[j];
				if (!this.filtered[t.mainCategory]) {
					this.filtered[t.mainCategory] = {};
				} 
				if (this.filtered[t.mainCategory] && !this.filtered[t.mainCategory][t.subCategory]) {
					this.filtered[t.mainCategory][t.subCategory] = [];
				}
				this.filtered[category[j].mainCategory][category[j].subCategory].push(item);	
			}
		} 
		else {
			// if (!filtered[item.menu]) {
			// 	filtered[item.menu] = [];	
			// }
			// filtered[item.menu].push(item);
			// maybe create an etc category to put this venue
			// console.log(item.menu);
		} 
	}
}