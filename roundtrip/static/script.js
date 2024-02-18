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
            lon = latlng.lng;
            lat = latlng.lat;
            locationMarker = L.marker(latlng);
            locationMarker.addTo(map);
            drawPopup();
        },
    });

    L.Map.addInitHook('addHandler', 'click', L.ClickHandler);

    let map = L.map('map', {
        click: true,
        closePopupOnClick: false,
    }).fitWorld();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.doubleClickZoom.disable();
    locationControl = L.control
        .locate({ drawMarker: false, drawCircle: false })
        .addTo(map);
    locationControl.start();

    map.on('locationerror', onLocationError);
    map.on('locationfound', onLocationFound);

    return map;
}

function drawPopup() {
    let div = document.createElement('div');

    let input = document.createElement('input');
    input.id = 'length';
    input.type = 'number';
    input.min = 1;
    input.max = 100;
    div.appendChild(input);

    let generateButton = document.createElement('button');
    generateButton.id = 'generate';
    //generateButton.innerHTML = 'Generate';
    generateButton.onclick = generateGPX;

    let downloadButton = document.createElement('button');
    downloadButton.id = 'download';
    //downloadButton.innerHTML = 'Download';
    downloadButton.disabled = true;
    downloadButton.onclick = downloadGPX;

    div.append(' km');
    div.appendChild(document.createElement('br'));

    div.appendChild(generateButton);
    div.appendChild(downloadButton);

    locationMarker
        .bindPopup(div, {
            closeButton: false,
            autoClose: false,
            closeOnEscapeKey: false,
        })
        .openPopup();
}

function onLocationFound(e) {
    locationControl.stopFollowing();

    lon = e.longitude;
    lat = e.latitude;
    console.log(lat, lon);

    if (locationMarker) {
        locationMarker.removeFrom(map);
    }
    if (gpx) {
        map.removeLayer(gpx);
    }

    locationMarker = L.marker(e.latlng);
    locationMarker.addTo(map);

    drawPopup();
}

function onLocationError(e) {
    console.log(e);
}

function drawGPX(map, gpxText) {
    if (gpx) {
        map.removeLayer(gpx);
    }

    gpx = new L.GPX(gpxText, {
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
}

function generateGPX() {
    let formData = new FormData();
    formData.append('longitude', lon);
    formData.append('latitude', lat);
    formData.append('length', document.querySelector('#length').value);

    fetch('/', {
        method: 'POST',
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then((body) => {
            gpxText = body;
            drawGPX(map, gpxText);
            document.querySelector('#download').disabled = false;
        });
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
let lon = null;
let lat = null;
let map = initMap();
let gpx = null;
let gpxText = '';
