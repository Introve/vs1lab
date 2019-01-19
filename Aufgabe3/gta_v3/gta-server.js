/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
// var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static('public'));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(name, latitude, longitude, hashtag) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.hashtag = hashtag;
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags. ->CHECK
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate. -> CHECK
 * - Funktion zur Suche von Geo Tags nach Suchbegriff. -> CHECK
 * - Funktion zum hinzufügen eines Geo Tags. -> CHECK
 * - Funktion zum Löschen eines Geo Tags. -> CHECK
 */

var taglist = [];

// returns an array with Geotags within a specific radius
function radiusSearch(latitude, longitude, radius) {

    // filter is true for tags within radius, creates new array with only those tags
    return taglist.filter(geoTag => (distance(geoTag.latitude, geoTag.longitude, latitude, longitude) <= radius) ? true : false)

    // calculate distance between two geocoords, see geodatasource.com
    function distance(lat1, lon1, lat2, lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        } else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) +
                Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            // degree to kilometre
            dist = dist * 1.609344;
            return dist;
        }
    }

}

// returns array only containing searched geoTags
function nameSearch(name) {
    return taglist.filter(geoTag => (geoTag.name.toLowerCase().includes(name.toLowerCase()) ||
        geoTag.hashtag.toLowerCase().includes(name.toLowerCase())) ? true : false)
}

// adds a geoTag to array
function addTag(name, latitude, longitude, hashtag) {
    taglist.push(new GeoTag(name, latitude, longitude, hashtag));
    console.log('create new GeoTag');
}

// overrides old taglist excluding searched geoTags
function removeTag(name) {
    taglist = taglist.filter(geoTag => (geoTag.name.localeCompare(name, undefined, {
        sensitivity: 'case'
    }) === 0 || geoTag.hashtag.localeCompare(name, undefined, {
        sensitivity: 'case'
    }) === 0) ? false : true)
}


/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function (req, res) {

    res.render('gta', {
        taglist: [],
        longitude: '',
        latitude: ''
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging', function (req, res) {

    addTag(req.body.name, req.body.latitude, req.body.longitude, req.body.hashtag);

    res.render('gta', {
        taglist: taglist,
        longitude: req.body.longitude,
        latitude: req.body.latitude
    });
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post('/discovery', function (req, res) {
    var newList;

    if (req.body.discoverybutton === 'remove') {
        removeTag(req.body.searchbox);
    }

    if (req.body.discoverybutton === 'search') {
        newList = nameSearch(req.body.searchbox);

        res.render('gta', {
            taglist: newList,
            longitude: req.body.longitude,
            latitude: req.body.latitude

        });
    } else {
        res.render('gta', {
            taglist: taglist,
            longitude: req.body.longitude,
            latitude: req.body.latitude
        });
    }

    res.render('gta', {
        taglist: taglist,
        longitude: req.body.longitude,
        latitude: req.body.latitude
    });
});

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);