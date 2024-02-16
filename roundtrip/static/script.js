function initMap() {
    L.ClickHandler = L.Handler.extend({
        addHooks: function () {
            L.DomEvent.on(document, 'dblclick', this._captureClick, this);
        },

        removeHooks: function () {
            L.DomEvent.off(document, 'dblclick', this._captureClick, this);
        },

        _captureClick: function (event) {
            if (event.target.id != 'map') {
                return;
            }

            locationControl.stop();

            if (gpx) {
                map.removeLayer(gpx);
            }

            locationMarker.removeFrom(map);

            var latlng = map.mouseEventToLatLng(event);
            locationMarker = L.marker(latlng);
            locationMarker.addTo(map);

            document.querySelector('#lon').value = latlng.lng;
            document.querySelector('#lat').value = latlng.lat;
        },
    });

    L.Map.addInitHook('addHandler', 'click', L.ClickHandler);

    let map = L.map('map', { click: true }).fitWorld();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    locationControl = L.control
        .locate({ drawMarker: false, drawCircle: false })
        .addTo(map);
    locationControl.start();
    //locationControl.stopFollowing();

    //map.locate({ setView: true, maxZoom: 16 });
    map.on('locationerror', onLocationError);
    map.on('locationfound', onLocationFound);

    L.control
        .sidepanel('sidepanel', {
            panelPosition: 'right',
        })
        .addTo(map);

    return map;
}

function onLocationFound(e) {
    if (locationMarker) {
        locationMarker.removeFrom(map);
    }
    if (gpx) {
        map.removeLayer(gpx);
    }

    locationMarker = L.marker(e.latlng);
    locationMarker.addTo(map);

    document.querySelector('#lon').value = e.longitude;
    document.querySelector('#lat').value = e.latitude;
}

function onLocationError(e) {
    console.log(e);
}

function drawGPX(map, gpxText) {
    let gpx = new L.GPX(gpxText, {
        async: true,
        marker_options: {
            startIconUrl: '',
            endIconUrl: '',
        },
    });
    gpx.on('loaded', function (e) {
        map.fitBounds(e.target.getBounds());
    });
    gpx.addTo(map);
    return gpx;
}

function downloadGPX(gpxText) {
    var hiddenElement = document.createElement('a');

    hiddenElement.href = 'data:application/gpx+xml,' + encodeURI(gpxText);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'my-route.gpx';
    hiddenElement.click();
}

let locationMarker = null;
let locationControl = null;
let map = initMap();
let gpx = null;
let gpxText = '';

document.querySelector('#length').value = 3;

document.querySelector('#download').addEventListener('click', () => {
    downloadGPX(gpxText);
});

document.forms['generate'].addEventListener('submit', (event) => {
    event.preventDefault();

    if (gpx) {
        map.removeLayer(gpx);
    }
    fetch(event.target.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(event.target)),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then((body) => {
            gpxText = body;
            gpx = drawGPX(map, gpxText);
            document.querySelector('#download').disabled = false;
        })
        .catch((error) => {
            console.log(error);
        });
});
