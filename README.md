# MMM-COVID-19
MM module for current COVID-19 virus status.

## Credits
This data is derived from [Johns Hopkins University Center for Systems Science and Engineering (JHU CCSE)](https://github.com/CSSEGISandData/COVID-19)

## Screenshot
![](https://raw.githubusercontent.com/eouia/MMM-COVID-19/master/covid.png)

## New Updates
### **`2.1.1` (2020-03-22)**
- Fixed: Minor fix for safe initialization for regions which has no data.
- Added: thousands separator for numbers


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
  pinned: ["World", "China Total"],
  myPosition: null,
  //myPosition: {latitude:50.0836, longitude:8.4694, metric:"km",}, //or null. // reserved for later.
  reportTimeFormat: "YYYY.MM.DD hh a",
  drawGraph: true,
  logTerritory: true,
  thousandsSeparator: "",
}
```
- **`debug`** : `true` or `false`. To log details.
- **`scanInterval`** : ms. Original data is updated once per day. So too frequent scanning is not needed.
- **`rotateInterval`** : ms. Interval for rotating region infected.
- **`pinned`** : Array of pinned regions. If not `null`, your next slots will show `pinned regions`. See territory name section.
- **`myPosition`** : `Object`(`{...}`) or `null`. You can set `myPosition` to get the distance to the region.
```js
myPosition: {
  latitude: 50.0836,
  longitude: 8.4694,
  metric: "km", // or `mile`
},
```
- **`reportTimeFormat`** : By example `YYYY.MM.DD h a` will show "2020.03.04 9 am"
- **`drawGraph`** : `true` for draw graph. `false` for not. If you feel some CPU burden, set this to `false`.
- **`logTerritory`** : `true` for log territory name. Sometimes Original data source format is changed. So, will log in every scan time.
- **`thousandsSeparator`** : By default, none. If you set `,`, `123456` will be displayed like `123,456`


### Territory naming rule (since 2020.03.16)
0. You can get name from log with `logTerritory:true` option.
1. Normal countries like `Vietnam` : Just use `"Vietnam"`. But some country name is changed. (e.g: `"South Korea"` => `"Korea, South"`)
2. Some countries can have provinces. And the rule is very.... WEIRD.
For example, `"United Kingdom"` has 3 provinces(or colonies) reported at this moment.(2020.03.16)
- `'Channel Islands, United Kingdom'` : If you want to get `Channel Islands` data, use this.
- `'Gibraltar, United Kingdom'`
- `'United Kingdom'` : This is for MAINLAND of `United Kingdom`, not total of UK territories.
- `'United Kingdom Total'` : So, If you want to display total UK, use the name `'United Kingdom Total'`
- `'Guernsey'` : But `Guernsey` is not categorized as UK at this moment. Is it an independent state? I don't know. Maybe someday this will be included to UK data. At that time, `United Kingdom Total` will accumulate `Guernsey` data also.
3. `France` and `Denmark` are the same cases. `'France'` means Mainland of France. `'France Total'` is sum of all France territories.
4. But, `US`, `Canada`, `China`, `Australia`, `Cruise Ship`has no `MAINLAND`. To show summary, use `'US Total'` or `'Canada Total'`, ...
5. `Hong Kong` and `Macau` are included into `China`. So use `"Hong Kong, China"`.
6. `Cruise Ship` is new born country!!! Use `'Cruise Ship Total'` or `'Diamond Princess, Cruise Ship'`
7. To get total of world, use `'World'`.

```js
pinned: [
  "World",
  "Germany",
  "US Total",
  "District of Columbia, US"
],
```


### If you think too high CPU Used and thermal issue
I've refactored to reduce CPU and memory usage. But if you still feel some issues,
- Not too often scan. Set `scanInterval` long enough. Original data would be updated once per day. So I think 6 hours or 12 hours are enough.
- Not too often rotate. Set `rotateInterval` long enough. I think 5 sec is enough, but if you want, set it long.
- Disable rotate animation. In your `css/custom.css` add this.
```css
.covid .item.rotate {
  animation-name: none;
}
```
- Disable `drawGraph`. Set it `false`




#### Deprecated options
> I think this would be overspec. So I removed.

- **`detailProvice`**
- **`logProvinceCountry`**
- **`logOnce`**
- **`sortOrder`**

## UPDATE HISTORY
### **`2.1.0` (2020-03-16)**
- Whole refactored. (Orignial source format is changed.)
- Changed: the territory name rule is changed. (See configuration section)
- Changed: reduction of CPU usage (I hope. See note section also)
- added: `drawGraph` option to show graph or not.
- added: `logTerritory` option to log territory names.

### **`2.0.0` (2020-03-04)**
- Whole new build. (`npm install` is needed to update)
- Removed: depedency of external API. Data is derived from original source directly.
- Removed: some overspec config options.
- Added: past 7-days bar graph.
- Added: new confirmed, new deaths, new recovered of 1 day before (... of update date)
- Added : info section, last reported time, distance from me.
- Changed : multi pinned. pin key format changed.
- Chagned : more controllable by CSS.




## Don't Panic! This is not Z-Virus...
