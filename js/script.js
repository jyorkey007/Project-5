// Google maps initial cordinates for San Francisco, CA
var myInitialLatLng = {lat: 26.6387058,lng: -81.8796754};

// List of my favorite places in San Francisco
var Model = [
    {
      "name": "Edison/Ford Estates",
      "latlng": [26.6387058,-81.8796754]
    },
    {
      "name": "Edison Mall",
      "latlng": [26.601260, -81.869204]
    },
    {
      "name": "Calusa Nature Center",
      "latlng": [26.615534, -81.812384]
    },
    {
      "name": "Starbucks",
      "latlng": [26.597553, -81.863244]
    },  
    {
      "name": "Dairy Queen",
      "latlng": [26.598013, -81.845992,]
    },
]


// App View Model
// defines the data and behavior
var AppViewModel =  function() {
  var self = this;
  self.markers = ko.observableArray([]);
  self.allLocations = ko.observableArray([]);
  self.filter =  ko.observable("");
  self.search = ko.observable("");

  var map = initializeMap();
  // if Google Maps is unavailable this alerts the user
  if (map === null) {
    alert("We are sorry, but Google Maps is currently unavailable, please try again later :(");
  }  
  self.map = ko.observable(map);
  callForsquare(self.allLocations, self.map(), self.markers);

  // filters the listview 
  self.filteredArray = ko.computed(function() {
    return ko.utils.arrayFilter(self.allLocations(), function(item) {
      if (item.name.toLowerCase().indexOf(self.filter().toLowerCase()) !== -1) {
        if(item.marker)
          item.marker.setMap(map); 
      } else {
        if(item.marker)
          item.marker.setMap(null);
      }     
      return item.name.toLowerCase().indexOf(self.filter().toLowerCase()) !== -1;
    });
  }, self);

  self.clickHandler = function(data) {
    centerLocation(data, self.map(), self.markers);
  }
};

// initializes Google Map with my custom coordinates
function initializeMap() {
    var mapOptions = {
      center: new google.maps.LatLng(myInitialLatLng.lat, myInitialLatLng.lng),
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    return new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}
/*
  END OF ViewModel
  ============================================================
*/

// get location data from foursquare
function callForsquare(allLocations, map, markers) {
  var myLocationDataArray = [];
  var myFourSquareUrl = "";
  var location = [];
  for (place in Model) {
    foursquareUrl = 'https://api.foursquare.com/v2/venues/search' +
      '?client_id=CUJOFOLBLHU0UZWEWSKMHAKE30RZTFE1W3ASQIOZG3BTGFGT' +
      '&client_secret=B5KLWDU45YR3CYZZCARFKPE3T3WNJRYWY00BB5GOBAAXTHO0' +
      '&v=20130815' +
      '&m=foursquare' +
      '&ll=' + Model[place]["latlng"][0] + ',' + Model[place]["latlng"][1] + 
      '&query=' + Model[place]["name"] + 
      '&intent=match';

    $.getJSON(foursquareUrl, function(data) {         
      if(data.response.venues){
        var item = data.response.venues[0];
        allLocations.push(item);
        location = {lat: item.location.lat, lng: item.location.lng, name: item.name, loc: item.location.address + " " + item.location.city + ", " + item.location.state + " " + item.location.postalCode};
        myLocationDataArray.push(location);
        placeMarkers(allLocations, place, location, map, markers);
      } else {
        alert("We are sorry, but we could not retrieve data from foursquare. Please try again later");
        return;
      }
    });    
  }
}

// place marker for the result locations on the map
  function placeMarkers(allLocations, place, data, map, markers) {
    var latlng = new google.maps.LatLng(data.lat, data.lng);
    var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      animation: google.maps.Animation.DROP,
      content: data.name + "<br>" + data.loc
    });
  
    // create infoWindow for each marker on the map
    var infoWindow = new google.maps.InfoWindow({
      content: marker.content
    });
    marker.infowindow = infoWindow;
    markers.push(marker);
    allLocations()[allLocations().length - 1].marker = marker;

    // show details about location when user clicks on a marker
    google.maps.event.addListener(marker, 'click', function() {
      // close infowindow that is open
      for (var i = 0; i < markers().length; i++) {
        markers()[i].infowindow.close(); 
      }
      infoWindow.open(map, marker);
    });

    // toggle bounce when user clicks on a location marker on google map
    google.maps.event.addListener(marker, 'click', function() {
      toggleBounce(marker);
    });
}

// this function adds bounce to marker
function toggleBounce(marker) {  
  if (marker.setAnimation() != null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
      marker.setAnimation(null);
    }, 600);
  }
}

// clickHandler on location list view
function centerLocation(data, map, markers) {
  // close infowindow that is open  
  for (var i = 0; i < markers().length; i++) {
    markers()[i].infowindow.close(); 
  }  
  map.setCenter(new google.maps.LatLng(data.location.lat, data.location.lng));
  map.setZoom(12);
  for (var i = 0; i < markers().length; i++) {  
    var content = markers()[i].content.split('<br>');
    if (data.name === content[0]) {     
      toggleBounce(markers()[i]);
    }
  }
}

ko.applyBindings(new AppViewModel());
