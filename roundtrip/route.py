import random
import sys
from typing import Optional

import requests
from environs import Env

env = Env()

ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-hiking/gpx"
ORS_TOKEN = env.str("ORS_TOKEN")


def generate_gpx(
    start_end_location: list[float],
    length: float,
    num_points: Optional[int] = None,
    seed: Optional[int] = None,
) -> str:
    if num_points is None:
        num_points = random.randint(2, 32768)  # figure out what the max value is

    if seed is None:
        seed = random.randint(0, sys.maxsize)

    data = {
        "coordinates": [start_end_location],
        "options": {"round_trip": {"length": length, "points": num_points, "seed": seed}},
    }

    resp = requests.post(ORS_URL, json=data, headers={"Authorization": ORS_TOKEN})
    resp.raise_for_status()

    return resp.text
