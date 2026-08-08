const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 3001;

// =====================================================
// HOUSE OF A&R REFERENCE LOCATION
// Nearby River Bank Colony mapped reference point
// =====================================================

const PICKUP_LAT = 26.859829;
const PICKUP_LON = 80.922128;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());


// =====================================================
// DISTANCE API
// =====================================================

app.post("/api/check-distance", async (req, res) => {

    try {

        const { address } = req.body;


        if (!address || address.trim().length < 8) {

            return res.status(400).json({
                success: false,
                message: "Please enter a complete delivery address."
            });

        }


        // -------------------------------------------------
        // Only allow Lucknow addresses
        // -------------------------------------------------

        const searchAddress =
            `${address}, Lucknow, Uttar Pradesh, India`;


        // -------------------------------------------------
        // GEOCODING
        // -------------------------------------------------

        const geocodeURL =
            "https://nominatim.openstreetmap.org/search?" +
            new URLSearchParams({
                q: searchAddress,
                format: "jsonv2",
                limit: "1",
                countrycodes: "in"
            });


        const geoResponse =
            await fetch(
                geocodeURL,
                {
                    headers: {
                        "User-Agent":
                            "HouseOfAR-Fragrance-Store/1.0"
                    }
                }
            );


        if (!geoResponse.ok) {

            throw new Error(
                "Address service unavailable."
            );

        }


        const geoData =
            await geoResponse.json();


        if (
            !geoData ||
            geoData.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "We could not locate this address. Please enter a more complete Lucknow address."
            });

        }


        const customerLocation =
            geoData[0];


        const customerLat =
            parseFloat(
                customerLocation.lat
            );


        const customerLon =
            parseFloat(
                customerLocation.lon
            );


        const displayName =
            customerLocation.display_name || "";


        // -------------------------------------------------
        // CHECK LUCKNOW
        // -------------------------------------------------

        const lowerAddress =
            displayName.toLowerCase();


        if (
            !lowerAddress.includes("lucknow")
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "House of A&R is currently delivering in Lucknow only."
            });

        }


        // -------------------------------------------------
        // ROAD DISTANCE USING OSRM
        // -------------------------------------------------

        const routeURL =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${PICKUP_LON},${PICKUP_LAT};` +
            `${customerLon},${customerLat}` +
            `?overview=false`;


        const routeResponse =
            await fetch(
                routeURL
            );


        if (!routeResponse.ok) {

            throw new Error(
                "Distance service unavailable."
            );

        }


        const routeData =
            await routeResponse.json();


        if (
            routeData.code !== "Ok" ||
            !routeData.routes ||
            !routeData.routes.length
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "We could not calculate the driving distance for this address."
            });

        }


        const distanceMeters =
            routeData.routes[0].distance;


        const distanceKm =
            distanceMeters / 1000;


        // -------------------------------------------------
        // DELIVERY CHARGE
        // -------------------------------------------------

        const deliveryCharge =
            distanceKm <= 7
                ? 59
                : 99;


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({

            success: true,

            distanceKm:
                Number(
                    distanceKm.toFixed(1)
                ),

            deliveryCharge,

            addressFound:
                displayName,

            deliveryArea:
                "Lucknow",

            pickupReference: {
                latitude:
                    PICKUP_LAT,

                longitude:
                    PICKUP_LON
            }

        });

    } catch (error) {

        console.error(
            "Distance error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to calculate delivery distance right now. Please try again."

        });

    }

});


// =====================================================
// SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `House of A&R backend running on http://localhost:${PORT}`
        );

    }
);