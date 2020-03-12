# MMM-COVID-19
MM module for current COVID-19 virus status.

## Credits
This data is derived from [Johns Hopkins University Center for Systems Science and Engineering (JHU CCSE)](https://github.com/CSSEGISandData/COVID-19)

## Screenshot
![](https://raw.githubusercontent.com/eouia/MMM-COVID-19/master/covid.png)

## New Updates
### **`2.0.0` (2020-03-04)**
- Whole new build. (`npm install` is needed to update)
- Removed: depedency of external API. Data is derived from original source directly.
- Removed: some overspec config options.
- Added: past 7-days bar graph.
- Added: new confirmed, new deaths, new recovered of 1 day before (... of update date)
- Added : info section, last reported time, distance from me.
- Changed : multi pinned. pin key format changed.
- Chagned : more controllable by CSS.

## Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-COVID-19
cd MMM-COVID-19
npm install
```

## Config
### Simple
```js
{
  module: "MMM-COVID-19",
  header: "COVID-19",
  position: "top_left",
  config:{}
}
```
### Detailed & Default
> These values are set as default, you don't need to copy all of these. Just pick what you need only and add it into your `config:{}`

```js
config: {
  debug:false,
  scanInterval: 1000 * 60 * 60 * 3,
  rotateInterval: 1000 * 5, // 0 means no rotate
  pinned: [ "Diamond Princess cruise ship, Others", "Mainland China"],
  myPosition: {latitude:50.0836, longitude:8.4694, metric:"km",}, //or null. // reserved for later.
  reportTimeFormat: "YYYY.MM.DD hh a"
}
```
- **`debug`** : `true` or `false`. To log details.
- **`scanInterval`** : ms. Original data is updated once per day. So too frequent scanning is not needed.
- **`rotateInterval`** : ms. Interval for rotating region infected.
- **`pinned`** : Array of pinned regions. If not `null`, your next slots will show `pinned regions`. The structure is
```js
[
  "PROVINCE_NAME, COUNTRY_NAME", // If some region would have province name. `,`(comma) is separator.
  "COUNTRY_NAME" // OR only country name. When country might have provinces, this will show sum of provinces.
],
```
Example.
```js
pinned: ["Diamond Princess cruise ship, Others", "Mainland China", "South Korea"],
```
> To get `COUNTRY_NAME` and `PROVINCE_NAME`, find it directly from https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports

- **`myPosition`** : `Object`(`{...}`) or `null`. You can set `myPosition` to get the distance to the region.
```js
myPosition: {
  latitude: 50.0836,
  longitude: 8.4694,
  metric: "km", // or `mile`
},
```
- **`reportTimeFormat`** : By example `YYYY.MM.DD h a` will show "2020.03.04 9 am"



#### Deprecated options
> I think this would be overspec. So I removed.

- **`detailProvice`**
- **`logProvinceCountry`**
- **`logOnce`**
- **`sortOrder`**


## Don't Panic! This is not Z-Virus...
