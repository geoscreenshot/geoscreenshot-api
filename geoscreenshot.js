/**
 * GeoScreenshot API Sample
 * Captures a URL for every available location
 * Follows API standards found here: https://www.geoscreenshot.com/docs/
 */

/* jshint node: true */
"use strict";


// Check if running in CLI mode
const CLI =  (require.main === module);

// Log suppressed by default
var _log = () => {};

const request = require("request");
const async = require("async");
const fs = require("fs");
const path = require("path");

/** 
 * Base API URL.
 * @constant {string} API_BASE
 * @default https://www.geoscreenshot.com
 */
const API_BASE = process.env.GS_API_BASE || "https://www.geoscreenshot.com";
/** 
 * API base path.
 * @constant {string} PATH_BASE
 * @default /api/ws/
 */
const PATH_BASE = "/api/ws/";

/** 
 * Limit API for simultaneous screenshots
 * 3 is optimal for most requests, please do not exceed 5.
 * @constant {string} API_LIMIT
 * @default 3
 */
const API_LIMIT = 3;



/** 
 * Default location, high availability server
 * @constant {object} DEFAULT_LOC
 */
const DEFAULT_LOC = {
    "name": "us-ny-nwy",
    "city": "New York",
    "state": "NY",
    "country_code": "US",
    "country": "United States",
    "lat": 40.7143,
    "lon": -74.006,
    "plan": "free",
    "timezone": "America/New_York"
};

/**
 * Samples random elements from array
 * @param {Array} arr items The array containing the items.
 * @param {Number} len items The array containing the items.
 * @returns {Array} Returns a shuffled array
 */
function utilSample(arr, len) {
    let j, x, i;
    for (i = arr.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = arr[i - 1];
        arr[i - 1] = arr[j];
        arr[j] = x;
    }

    if (len) {
        arr = arr.splice(0, len);
    }
    return arr;
}

/**
 * Creates a metadata json file
 * @param {Object} Capture Result
 */
function utilMetadata(a) {
    let obj = {
        date: Date.now(),
        id: a.id,
        url: a.url,
        location: a.location,
        request: a.request,
        size: a.image.length,
        error: a.error
    };
    return JSON.stringify(obj, null, 2);
}

/**
 * Wrapper around GS Functions
 * @param {Object} opts Initial options
 * 
 * url - Default url for all future requests
 * username - username (for testing only, not safe, use ENV)
 * password - password (for testing only, not safe, use ENV)
 */
 
const gsModule = function(opts) {

    opts = opts || {};
    
    // Suppress log messages for non-CLI
    _log = CLI || opts.verbose ? console.log : ()=>{}; 


    /** 
     * The target url for the demo.
     * Make sure it is a valid url format
     * @constant {string} URL
     * @default http://weather.yahoo.com
     */
    const URL = opts.url || "http://weather.yahoo.com";


    /** 
     * Username for the main account info, it should be kept protected.
     * @constant {string} CRED_USERNAME 
     * @default testapi
     */
    const CRED_USERNAME = process.env.GS_USERNAME || opts.username || false;
    
    /** 
     * Password for the main account info, it should be kept protected.
     * @constant {string} CRED_PASSWORD
     * @default testapi
     */
    const CRED_PASSWORD = process.env.GS_PASSWORD || opts.username || false;
    
    if (!(CRED_USERNAME && CRED_PASSWORD))
    {
        throw "GeoScreenshot API Credentials not specified. Env variables: GS_USERNAME, GS_PASSWORD"
    }
    

    /** 
     * Encoded Basic Auth using base64 encoding.
     * @constant {string} AUTH
     */
    const AUTH = 'Basic ' + new Buffer(CRED_USERNAME + ':' + CRED_PASSWORD).toString('base64');


    /** 
     * Location for images
     * @constant {string} IMAGE_DIR
     * @default ./ 
     */
    const IMAGE_DIR = opts.imageDir || './out';
    
    // Create if not there
    if (!fs.existsSync(IMAGE_DIR)){
        fs.mkdirSync(IMAGE_DIR);
    }
    
    /**
     * Send a capture request to the API.
     * @function
     * @name gsCapture
     * @param {string} url URL to capture.
     * @param {object} location Target location.
     * @returns {Promise} Returns a promise containing the request's response.
     */
    function gsCapture(url, location) {
        // Default to initial url
        url = url || URL;
        location = location || DEFAULT_LOC;

        const endpoint = 'capture';
        _log("Capturing URL:", url," Location:", location.name);
        let reqBody = {
            'url': url,
            'viewport': '1336x1400',
            'delay': '5',
            'location': location.name,
            'useragent': 'chrome',
            'fullpage': 0,
            'no_images': 0,
            'no_cache': 0
        };
        let options = {
            method: 'POST',
            url: API_BASE + PATH_BASE + endpoint,
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'authorization': AUTH
            },
            body: reqBody,
            json: true
        };


        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error || response.statusCode !== 200 || body.error) {
                    delete body.image;
                    return reject(body.error);
                }

                //Add metadata
                body.location = location;
                body.request = reqBody;
                _log("Done Capturing URL:", url," Location:", location.name);
                return resolve(body);
            });
        });
    }

    /**
     * Retrieves all the locations
     * @function
     * @name gsLocations
     * @returns {Promise} Returns array of location objects.
     */
    function gsLocations() {
        const endpoint = 'locations';
        _log("Retrieving all locations");
        let options = {
            method: 'GET',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'authorization': AUTH
            },
            url: API_BASE + PATH_BASE + endpoint
        };

        return new Promise((resolve, reject) => {
            request(options, function(error, response, body) {
                let result = {};
                try {
                    result = JSON.parse(body);
                } catch (e) {
                    throw "Error getting locations "+e;
                }
                if (error || response.statusCode !== 200 || result.error) {
                    return reject(result.error);
                }
                return resolve(result);
            });
        });

    }
    
    /**
     * Select location that match country_code
     * @function
     * @param {string} listLocs - The list of locations.
     * @param {string} country_code - Alpha2 Country Code, defaults to US
     * @returns {Function} Returns a function that returns a promise
     */
    function helperFilterByCountry(country_code) 
    {
        country_code = (typeof country_code === "string") ? country_code.trim().toUpperCase() : "US";
        return function (listLocs) {
            return Promise.resolve(listLocs.filter((loc)=>{
                return loc.country_code === country_code;
            }));
        };
    }
    
    /**
     * Issues multiple capture requests
     * @function
     * @param {string} listLocs - The list of locations.
     * @param {Function} allDone - The callback function for async (optional)
     * @returns {Promise} Returns a promise
     */
    function gsMultiCapture(listLocs, allDone) {
        _log("Capturing ",listLocs.length);
        // Default to initial url
        let url = URL;
        return new Promise((resolve, reject) => {
            async.eachLimit(listLocs, API_LIMIT, (location, singleDone) => {
                gsCapture(url, location)
                    .then(gsProcess)
                    .then((res) => {
                        singleDone(null, res);
                    });
            }, (err, allLocs) => {
                if (err) {
                    reject(err);
                    console.error("gsMultiCapture", err);
                }
                else
                {
                    resolve(allLocs);
                }
                if (allDone) {
                    allDone(null, allLocs);
                }
            });
            
        });
    }

    /**
     * Process generated screenshots from PNG64 to file
     * Saves metadata as {id}.json
     * @function
     * @param {string} result - The base64 string for the png screenshot.
     */
    function gsProcess(result) {
        return new Promise((resolve, reject) => {
            if (result.image) {
                var pngData = result.image.replace(/^data:image\/png;base64,/, "");
                var pngPath = path.join(IMAGE_DIR ,result.id + ".png");
                var metaPath = path.join(IMAGE_DIR , result.id + ".json");
                let opts = {
                    mode: "644",
                    encoding: "base64"
                };
                fs.writeFile(pngPath, pngData, opts, function(err, data) {
                    if (err) {
                        _log("Unable to save to ", pngPath);
                    }
                    else {
                        _log("Processed", result.id, "Saved file to ", pngPath);
                        // Send to chat.
                        resolve();
                    }
                });
                fs.writeFileSync(metaPath, utilMetadata(result), "utf8");
            }
            else {
                reject(result.screenshot.error);
            }
        });
    }

    return {
        utils: {
            sample: utilSample
        },
        capture: gsCapture,
        locations: gsLocations,
        process: gsProcess,
        filter: helperFilterByCountry,
        multicapture: gsMultiCapture
    };


};

if (CLI) {
    _log("CLI Mode");
    
    const args = process.argv.slice(2);

    var test = args[0] || "single";
    var url = args[1] || null;

    const gs = gsModule({
        url: url
    });

    switch (test) {

        case "random":
            // Capture random 5 locations
            _log("CLI", "Capturing 5 Random locations");
            let filterRandom = function(allLocs) {
                return Promise.resolve(gs.utils.sample(allLocs, 5));
            };

            gs.locations().then(filterRandom)
                .then(gs.multicapture)
                .then((results) => {
                    _log("Captured ", results.length, "locations");
                }, (error) => {
                    console.error("random", "There was an error", error);
                });
            break;
        case "multi":
            // Capturing all locations
            _log("CLI", "Capturing 5 Random locations");
            gs.locations().then(gs.multicapture)
                .then((results) => {
                    _log("Captured ", results.length, "locations");
                }, (error) => {
                    console.error("multi", "There was an error", error);
                });
            break;
        case "single":
            // Capture single location
            _log("CLI", "Capturing Single");

            let filterOne = function(allLocs) {
                return Promise.resolve(gs.utils.sample(allLocs, 1)[0]);
            };

            // Always call gs.locations() before every request to ensure location is up
            gs.locations().then(filterOne)
                .then((loc) => {
                    // User specified URL, instead of global one
                    return gs.capture(url, loc);
                })
                .then(gs.process).then((result) => {
                    _log("Retrieved base 64 image of length: ", result.image.length);
                }, (error) => {
                    console.error("There was an error", error);
                });
            break;
    }

}
else {
    module.exports = gsModule;
}