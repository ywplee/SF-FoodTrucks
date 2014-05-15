"use strict";
Number.prototype.toRad = function () { return this * Math.PI / 180; };

var App = {};
App.APIEndpoint =  "http://ec2-54-84-43-41.compute-1.amazonaws.com/";
// App.APIEndpoint =  "http://localhost:8080/";
App.Location = Backbone.GoogleMaps.Location.extend();
App.LocationCollection = Backbone.GoogleMaps.LocationCollection.extend({
  model: App.Location,
  curLocation: App.curLocation || {lat: 37.790947, lng: -122.393246},
  // from http://stackoverflow.com/questions/2855189/sort-latitude-and-longitude-coordinates-into-clockwise-ordered-quadrilateral
  distance: function(lat2, lng2) {
    var R = 6371; // km
    var dLat = (lat2-this.curLocation.lat).toRad();
    var dLon = (lng2-this.curLocation.lng).toRad();
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.curLocation.lat.toRad()) * Math.cos(lat2.toRad()) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  setCurLocation: function(p) {
    this.curLocation = {lat: p.lat(), lng: p.lng()};
  },
  comparator: function(a, b) {
    var p1 = a.getLatLng();
    var p2 = b.getLatLng();
    a = this.distance(p1.lat(), p1.lng());
    b = this.distance(p2.lat(), p2.lng());
    return a > b ?  1 : a < b ? -1 : 0;
  }
});

App.InfoWindow = Backbone.GoogleMaps.InfoWindow.extend({
  template: '#infoWindow-template',
  render: function() {
    this.$el.addClass("info-window");
    Backbone.GoogleMaps.InfoWindow.prototype.render.call(this);
  }
});

App.MarkerView = Backbone.GoogleMaps.MarkerView.extend({
  infoWindow: App.InfoWindow,
  toggleSelect: function() {
    this.model.toggleSelect();
    // I don't think it's a good idea to center to the marker position
    // App.map.setCenter(this.model.getLatLng());
  },

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
    _.bindAll(this, 'render', 'selectItem', 'deselectItem');
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
    this.model.select();
    this.$el.attr("class", "selected");
  },

  deselectItem: function() {
    this.model.deselect();
    this.$el.attr("class", "not-selected");
  }
});

App.ListView = Backbone.View.extend({
  el: "#listDiv",
  initialize: function() {
    _.bindAll(this, "refresh", "addChild");

    this.collection.on("reset sort", this.refresh, this);
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
// got this keywords by mining the menuitem property
App.keywords = {
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

App.init = function() {
  this.createMap();
  this.createFilterMenu();
  this.readData();  
};
App.createFilterMenu = function() {
  this.filterBy = {};
  var keywords = this.keywords;
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
  };
  $.getJSON(this.APIEndpoint + "all", function(d) {
    applyData(d);
  });
};
// is this reliable? current location for me is off by 30 miles.
App.setCurrentLocation = function() {
  var that = this;
  var initialLocation;
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      that.map.setCenter(initialLocation);
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
    if (errorFlag === true) {
      console.log("Geolocation service failed.");
      initialLocation = newyork;
    } else {
      console.log("Your browser doesn't support geolocation. We've placed you in Siberia.");
      initialLocation = siberia;
    }
    that.map.setCenter(initialLocation);
  }
};
App.createMap = function() {
  var that = this;
  var markers = [];
  var uberHQ = new google.maps.LatLng(37.790947, -122.393246);
  var mapOptions = {
    center: uberHQ,
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
  };
  // Instantiate map
  this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
  // Add current location marker
  var currentLocMarker = new google.maps.Marker({
    map:this.map,
    draggable:true,
    icon: "assets/ajax-loader.gif",
    animation: google.maps.Animation.DROP,
    position: uberHQ
  });
  google.maps.event.addListener(currentLocMarker, 'click', function(){
    if (currentLocMarker.getAnimation() !== null) {
      currentLocMarker.setAnimation(null);
    } else {
      currentLocMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
  });
  // drag event for the current location marker
  google.maps.event.addListener(currentLocMarker, 'dragend', function(ev) {
    that.map.panTo(ev.latLng);
    that.sortByDistance(ev.latLng);
  });
  // click event registerd to the map
  google.maps.event.addListener(this.map, 'click', function(ev) {
    // that.map.setZoom(17);
    that.map.panTo(ev.latLng);
    currentLocMarker.setPosition(ev.latLng);
    // resort the item list by distance
    that.sortByDistance(ev.latLng);
  });
  // initially bounce pacman to inform user where they are
  currentLocMarker.setAnimation(google.maps.Animation.BOUNCE);
};
App.sortByDistance = function(p) {
  this.places.curLocation = {lat: p.lat(), lng: p.lng()};
  this.places.sort();
};
App.filterData = function(){
  var style = event.target.style;
  var item = event.target.innerHTML;
  var type = event.target.parentElement.id;
  var that = this;
  if (style.color == "white") {
    style["background-color"] = "transparent";
    style.color = "black";
    var index = that.filterBy[type].indexOf(item);
    that.filterBy[type].splice(index, 1);

  } else {
    style["background-color"] = "rgba(0,0,0,0.9)";
    style.color = "white";
    if (!that.filterBy[type]) {
      that.filterBy[type] = [];
    }
    that.filterBy[type].push(item);
  }
  var applyData = function(data) {
    // var d = new that.LocationCollection(data)
    that.places.set(data);
  };
  $.ajax({
    datatype: "json",
    url: this.APIEndpoint + "userFilter/" + JSON.stringify(this.filterBy),
    success:function(d) {
      applyData(d);
    }
  });
};