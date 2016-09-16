# GeoScreenshot API Example

This is an example for the early release GS API Alpha.
It captures Yahoo Weather Pages from several locations.

## Usage

This simple script calls the GS API and generates PNG files.

For a given URL, it will simultaneously request screenshots for 1 or more locations and outputs PNGs and JSON Metadata in the specified directory.

The documentation for the web service can be found here:
[https://www.geoscreenshot.com/docs/](https://www.geoscreenshot.com/docs/)

## Examples


#### Capture from all locations of a country

```javascript
"use strict";

const config = {
    'url': 'http://news.google.com',
    'imageDir': './out/',
    'verbose': true
};

const gs = require('./geoscreenshot')(config);

gs.locations()
    .then(gs.filter('IN')) // Filter by country code
    .then(gs.multicapture)
    .then((results) => {
        console.log("Captured ", results.length, "locations");
    }, (error) => {
        // Handle error
    });
    

```


#### Capture a single location

In your `.js` file:

```javascript
// Set default URL, defaults to Yahoo Weather and current dir respectively
const config = {
'url': 'http://www.example.com',
'imageDir': './out/'
};
const gs = require('./geoscreenshot')(config);
gs.gsCapture('http://www.example.com').then((result) => {
    console.log("Retrieved base 64 image of length: ", result.image.length);
}, (error) => {
    // Handle error
});
```

#### Capture from all available locations

In your `.js` file:

```javascript
"use strict";

const config = {
    'url': 'http://weather.yahoo.com',
    'imageDir': './out/',
    'verbose': true
};

const gs = require('./geoscreenshot')(config);

gs.locations().then(gs.multicapture)
    .then((results) => {
        console.log("Captured ", results.length, "locations");
    }, (error) => {
        // Handle error
    });
```

### CLI Usage

#### Capture single screenshot

```bash
node geoscreenshot
```

 or 
 
```bash
node geoscreenshot single <url>
```

#### Capture 5 random locations

```bash
node geoscreenshot random <url>
```

#### Capture all locations

```bash
node geoscreenshot multi <url>
```

### Output 

The script will generate 2 files per capture

`<id>.json`, example:

```
{
  "date": 1474044949580,
  "id": "ws_0a986wrvn29_1474044949443",
  "location": {
    "name": "lv-rix-riga",
    "city": "Riga",
    "state": "RIX",
    "country_code": "LV",
    "country": "Latvia",
    "lat": 56.95,
    "lon": 24.1,
    "plan": "plus",
    "timezone": "Europe/Riga"
  },
  "request": {
    "url": "http://www.example.com",
    "viewport": "1336x1400",
    "delay": "5",
    "location": "lv-rix-riga",
    "useragent": "chrome",
    "fullpage": 0,
    "no_images": 0,
    "no_cache": 0
  },
  "size": 46284
}

```

and `<id>.png`


## Getting Started

### Sign up for an account

**Note: As of 9/15/2016, GeoScreenshot API is still in beta, API access is disabled by default. To request access, send an email to [contact@geoscreenshot.com](mailto:contact@geoscreenshot.com) with your use case and we will upgrade your account to have this feature**

1. Sign up for an account at [https://www.geoscreenshot.com/register](https://www.geoscreenshot.com/register)
2. Set a unique password, it will serve as an API key until OAuth is implemented
3. Upgrade to Plus

### Installation

#### Requirements

- Node.js > v4.5

#### Install scripts

```bash
git clone https://github.com/geoscreenshot/geoscreenshot-api-example.git
npm install 
```

#### Configure your environment

**Use a strong *alphanumeric* password generator for added security**
**DO NOT store credentials in source code**
**DO NOT re-use credentials you use for other accounts**

```bash
export GS_API_BASE="" // Optional, custom for advanced users
export GS_USERNAME="<YOURUSERNAME>" // Username used on WebUI
export GS_PASSWORD="<ALPHANUMERICPASSWORD>" // Password used on WebUI
```
Check if it works

```bash
node geoscreenshot.js
```

## API Reference

The RESTful API is documented here:
[https://www.geoscreenshot.com/docs/](https://www.geoscreenshot.com/docs/)


## Tips

* The public API is rate limited and your IP maybe temporarily blocked if you exceed 30 reqs / minute


## Contributors

If you have a problem with this sample, please file an [issue here](https://github.com/geoscreenshot/geoscreenshot-api-example/issues/new).
If you would like to contribute code you can do so through GitHub by forking the repository and sending a pull request.

Any issues related to API / Web Service, please send an email to [contact@geoscreenshot.com](mailto:contact@geoscreenshot.com). We are still in beta and appreciate all feedback.

## License

Copyright 2016 TE Web Solutions

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
