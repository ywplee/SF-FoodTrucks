SF-FoodTrucks
=============

Features
--------
* SF-FoodTrucks provides locations of food trucks on a particular area. The current location can be modified by clicking on the map or dragging the "PAC-MAN" around the map.

* Bottom horizontal menu provides a way to filter food trucks. 

* Right vertical menu provides a list of food trucks sorted by distance from the current location. This list gets updated constantly as the current location gets updated. 

* Hosted on [HERE](http://ec2-54-85-249-221.compute-1.amazonaws.com/SF-FoodTrucks/)


Full Stack Development
----------------------
* FrontEnd: Since it was discouraged to use a heavy front-end framework, I used Backbone.js. SF-FoodTrucks is single page application. I've never used Backbone.js for front-end framework.

* BackEnd: Since I do not have an extensive experience with python, I chose Node.js for the backend solution. Since this project does not contain any CPU intensive computation and relational databases, it turned out nicely. It  is my second time building a server with Node.js.

* Host: Backend server and website itself are both hosted on Amazon EC2, because it is relatively cheap, reliable and fast.

### Dependencies

* Google Maps API. 
* BackBone GoogleMap Library developed by [eschwartz](https://github.com/eschwartz/backbone.googlemaps)
* DataSF: Food Trucks


Trade-offs
----------
### Finding keywords (categories) - Mining vs Parsing
* The data from SFData did not provide a category of each food trucks. I had to parse the keywords - or category - from the menu of each food trucks. There were 2 approaches I could take; programmatically parse the keywords every time server gets data from the SFData or mine data and figure out the relevant keywords and keep the keywords table statically on the server or the client side. I chose the second approach, because the data was relatively static and didn't have enough time to build a perfect parser to get all the relevant keywords and the data lacked proper formatting.

### Searchbox vs Pinpoint
* I originally implemented search feature with a search box for users to search for a place or an address, but it required more input from the users. Instead, I created a current location marker with PAC-MAN image so that users can drag the marker or touch anywhere in the map to move the current location marker.

### Food trucks list view - sorted by distance vs name
* Since the name of food trucks in the dataset was just the name of the applicant, it did not provide meaning to the users. Therefore, the food trucks list get sorted by the distance from the current location (where PAC-MAN is).

### Keep the data on server or not
* As I mentioned before, the data is relatively static, therefore, I decided to update the data every one hour.


Possible future features
------------------------
* Direction
* Current location of user
* Provides hours of food trucks
* Review system
* Account logic


Anything I want to do differently If I do it again
--------------------------------------------------
* More testings, should've used TDD development process


Profile
-------
* [Linkdin](https://www.linkedin.com/profile/view?id=107308560)
