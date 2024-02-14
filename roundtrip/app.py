from flask import Flask, Response, render_template, request

from .route import generate_gpx

app = Flask(__name__)


@app.route("/", methods=("GET", "POST"))
def index():
    if request.method == "POST":
        longitude = request.form["longitude"]
        latitude = request.form["latitude"]
        length = request.form["length"]

        gpx_data = generate_gpx([float(longitude), float(latitude)], int(length) * 1000)
        return Response(gpx_data, mimetype="application/gpx+xml")

    return render_template("index.html")
