var App = {};


App.Location = Backbone.GoogleMaps.Location.extend();

App.LocationCollection = Backbone.GoogleMaps.LocationCollection.extend({
  model: App.Location
});

App.InfoWindow = Backbone.GoogleMaps.InfoWindow.extend({
  template: '#infoWindow-template',

  events: {
    'mouseenter h2': 'logTest'
  },

  logTest: function() {
    console.log('test in InfoWindow');
  }
});

App.MarkerView = Backbone.GoogleMaps.MarkerView.extend({
  infoWindow: App.InfoWindow,

  initialize: function() {
    _.bindAll(this, 'handleDragEnd');
  },

  mapEvents: {
    'dragend': 'handleDragEnd'
  },

  handleDragEnd: function(e) {
    alert('Dropped at: \n Lat: ' + e.latLng.lat() + '\n lng: ' + e.latLng.lng());
  },

  tellTheWorldAboutIt: function() {
    console.assert(this instanceof App.MarkerView);
    alert('You done gone and double-clicked me!');
    this.logIt('I hope you know that this will go down on your permanent record.')
  },

  logIt: function(message) {
    console.assert(this instanceof App.MarkerView);
    console.log(message);
  }
});

App.BarMarker = App.MarkerView.extend({
  overlayOptions: {
    draggable: false
  }
});

App.MarkerCollectionView = Backbone.GoogleMaps.MarkerCollectionView.extend({
  markerView: App.MarkerView,

  addChild: function(model) {
    this.markerView = model.get('type') === 'museum' ?
            App.MuseumMarker :
            App.BarMarker;

    Backbone.GoogleMaps.MarkerCollectionView.prototype.addChild.apply(this, arguments);
  }
});

App.init = function() {
  this.createMap();
  this.readData();

  
}
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
    center: new google.maps.LatLng(37.775, -122.4183333),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  // Instantiate map
  this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
  var input = /** @type {HTMLInputElement} */(
      document.getElementById('pac-input'));
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  var searchBox = new google.maps.places.SearchBox(
    /** @type {HTMLInputElement} */(input));
  // [START region_getplaces]
  // Listen for the event fired when the user selects an item from the
  // pick list. Retrieve the matching places for that item.
  var that = this;
  google.maps.event.addListener(searchBox, 'places_changed', function() {
    var places = searchBox.getPlaces();

    for (var i = 0, marker; marker = markers[i]; i++) {
      marker.setMap(null);
    }

    // For each place, get the icon, place name, and location.
    markers = [];
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0, place; place = places[i]; i++) {
      var image = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: that.map,
        icon: image,
        title: place.name,
        position: place.geometry.location
      });

      markers.push(marker);

      bounds.extend(place.geometry.location);
    }

    that.map.fitBounds(bounds);
  });
}


/**
 * List view
 */
App.ItemView = Backbone.View.extend({
  template: '<%=title %>',
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
    var html = _.template(this.template, this.model.toJSON());
    this.$el.html(html);

    return this;
  },

  close: function() {
    this.$el.remove();
  },

  selectItem: function() {
    this.model.select();
  },

  deselectItem: function() {
    this.model.deselect();
  }
});

App.ListView = Backbone.View.extend({
  // tagName: 'li',
  className: 'overlay',
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