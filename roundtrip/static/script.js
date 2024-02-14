function initMap() {
    let map = L.map('map').fitWorld();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationerror', onLocationError);
    map.on('locationfound', onLocationFound);
    return map;
}

function onLocationFound(e) {
    L.marker(e.latlng).addTo(map);

    document.querySelector('#lon').value = e.longitude;
    document.querySelector('#lat').value = e.latitude;
    document.querySelector('#length').value = 5;
}

function onLocationError(e) {
    alert(e.message);
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

let map = initMap();
let gpx = null;
let gpxText = '';

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
            // TODO handle error
        });
});
