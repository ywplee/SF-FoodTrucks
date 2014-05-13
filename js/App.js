var App = {};


App.Location = Backbone.GoogleMaps.Location.extend();

App.LocationCollection = Backbone.GoogleMaps.LocationCollection.extend({
  model: App.Location
});

App.InfoWindow = Backbone.GoogleMaps.InfoWindow.extend({
  template: '#infoWindow-template'
});

App.MarkerView = Backbone.GoogleMaps.MarkerView.extend({
  infoWindow: App.InfoWindow
});

App.MarkerCollectionView = Backbone.GoogleMaps.MarkerCollectionView.extend({
  markerView: App.MarkerView,
  addChild: function(model) {
    Backbone.GoogleMaps.MarkerCollectionView.prototype.addChild.apply(this, arguments);
  }
});

/**
 * List view
 */
App.ItemView = Backbone.View.extend({
  tagName: 'li',
  events: {
    'click': 'selectItem',
    'mouseleave': 'deselectItem'
  },

  initialize: function() {
    _.bindAll(this, 'render', 'selectItem', 'deselectItem')
    this.model.on("remove", this.close, this);
  },

  render: function() {
    var html = _.template($("#foodtruck-listview-template").html(), this.model.toJSON());
    this.$el.html(html);
    return this;
  },

  close: function() {
    this.$el.remove();
  },

  selectItem: function() {
    console.log(this.model);
    this.model.select();
  },

  deselectItem: function() {
    this.model.deselect();
  }
});

App.ListView = Backbone.View.extend({
  el: "#listDiv",
  initialize: function() {
    _.bindAll(this, "refresh", "addChild");

    this.collection.on("reset", this.refresh, this);
    this.collection.on("add", this.addChild, this);

    this.$el.appendTo("#listDiv");
  },
  render: function() {
    this.collection.each(this.addChild);
  },
  addChild: function(childModel) {
    var childView = new App.ItemView({ model: childModel });
    childView.render().$el.appendTo(this.$el);
  },
  refresh: function() {
    this.$el.empty();
    this.render();
  }
});

App.init = function() {
  this.createMap();
  this.createFilterMenu();
  this.readData();  
}
App.createFilterMenu = function() {
  this.filterBy = {};
  var keywords = Server.getKeywords();
  var menu = $("#filterMenu");
  for (var m in keywords) {
    menu.append(m);
    menu.append("<div id=" + m + ">");
    var c = keywords[m];
    var child = $("#" + m);
    for (var i = 0; i < c.length; i++) {
      child.append("<button class='filter-menu-button' onclick='App.filterData()'>" + c[i] + "</button>");
    }
    menu.append("</div>");
  }

},
App.readData = function() {
  var that = this;
  var applyData = function(data) {
    that.places = new that.LocationCollection(data);
    // Render Markers
    var markerCollectionView = new that.MarkerCollectionView({
      collection: that.places,
      map: that.map
    });
    markerCollectionView.render();

    // Render ListView
    var listView = new App.ListView({
      collection: that.places
    });
    listView.render();
  }
  Server.getAll(applyData);    
}
App.createMap = function() {
  var markers = [];
  var mapOptions = {
    center: new google.maps.LatLng(37.790947, -122.393246),
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
  }

  // Instantiate map
  this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
  // var input = ($('#pac-input')[0]);
  // this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // var searchBox = new google.maps.places.SearchBox(input);
  // [START region_getplaces]
  // Listen for the event fired when the user selects an item from the
  // pick list. Retrieve the matching places for that item.
  var that = this;
  // register a listener for a place_changed event
  // google.maps.event.addListener(searchBox, 'places_changed', function() {
  //   var places = searchBox.getPlaces();

  //   for (var i = 0, marker; marker = markers[i]; i++) {
  //     marker.setMap(null);
  //   }

  //   // For each place, get the icon, place name, and location.
  //   markers = [];
  //   var bounds = new google.maps.LatLngBounds();
  //   for (var i = 0, place; place = places[i]; i++) {
  //     var image = {
  //       url: place.icon,
  //       size: new google.maps.Size(71, 71),
  //       origin: new google.maps.Point(0, 0),
  //       anchor: new google.maps.Point(17, 34),
  //       scaledSize: new google.maps.Size(25, 25)
  //     };

  //     // Create a marker for each place.
  //     var marker = new google.maps.Marker({
  //       map: that.map,
  //       icon: image,
  //       title: place.name,
  //       position: place.geometry.location
  //     });

  //     markers.push(marker);

  //     bounds.extend(place.geometry.location);
  //   }

  //   that.map.fitBounds(bounds);
  // });
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      this.map.setCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }

  function handleNoGeolocation(errorFlag) {
    if (errorFlag == true) {
      console.log("Geolocation service failed.");
      initialLocation = newyork;
    } else {
      console.log("Your browser doesn't support geolocation. We've placed you in Siberia.");
      initialLocation = siberia;
    }
    this.map.setCenter(initialLocation);
  }
}
App.filterData = function(){
  var c = Server.getKeywords();
  var style = event.target.style;
  var item = event.target.innerHTML;
  var type = event.target.parentElement.id;
  var that = this;
  if (style.color == "white") {
    style["background-color"] = "transparent";
    style["color"] = "black";
    var index = that.filterBy[type].indexOf(item);
    that.filterBy[type].splice(index, 1);

  } else {
    style["background-color"] = "rgba(0,0,0,0.9)";
    style["color"] = "white";
    if (!that.filterBy[type]) {
      that.filterBy[type] = [];
    }
    that.filterBy[type].push(item);
  }
  // $("#" + type + " > .filter-menu-button").each(function(){
  //   if (this.style.color == "white") {
  //     if (!that.filterBy[type]) {
  //       that.filterBy[type] = [];
  //     }
  //     that.filterBy[type].push(event.target.innerHTML);
  //   }
  // });
  // var that = this;
  var applyData = function(data) {
    var d = new that.LocationCollection(data)
    that.places.set(data);
  }
  Server.getFilteredData(this.filterBy, applyData); 
}