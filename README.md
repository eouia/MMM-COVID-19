# MMM-COVID-19
MM module for COVID-19 virus pandemic

## Credits
This data is derived from [Johns Hopkins University Center for Systems Science and Engineering (JHU CCSE)](https://github.com/CSSEGISandData/COVID-19) via API by [Laeyoung / COVID-19-API](https://github.com/Laeyoung/COVID-19-API)
Original data is located [here](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports)

## Screenshot
![](https://raw.githubusercontent.com/eouia/MMM-COVID-19/master/covid.png)

## Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-COVID-19
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
  scanInterval: 1000 * 60 * 60 * 12,
  rotateInterval: 1000 * 5,
  detailProvince: false,
  pinned: ["Others", "Diamond Princess cruise ship"],
  logProvinceCountry: false,
  logOnce: true,
  sortOrder: null,
}
```
- **`scanInterval`** : ms. Original data is updated once per day. So too frequent scanning is not needed.
- **`rotateInterval`** : ms. Interval for rotating region infected.
- **`detailProvice`** : If `true`, the data from provinces of country (US, China, Canada) will be shown. If `false`, sum of country will be shown.
- **`pinned`** : If not `null`, your second slot will show `pinned region`. The structure is `[COUNTRY_NAME, PROVINCE_NAME]`. When `PROVINCE_NAME` is omitted or invalid, data(if exists, sum of provinces) of `COUNTRY_NAME` will be shown. (e.g: `null`, `["US"]`, `["US", "Seattle, WA"]`)
> To get `COUNTRY_NAME` and `PROVINCE_NAME`, set `logProvinceCountry:true` then find it from your backend log, or find it directly from https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports

- **`logProvinceCountry`** : If `true`, `COUNTRY_NAME` and `PROVINCE_NAME` will be listed in your backend log.
- **`logOnce`** : If `true`, Just log once on start.
- **`sortOrder`** : Don't mind. but if you want to change the order, assign callback function for sort. Default is ;
```js
(a, b)=> {
  if (b.countryregion !== a.countryregion) return (a.countryregion < b.countryregion) ? -1 : 1
  if (b.provincestate !== a.provincestate) return (a.provincestate < b.provincestate) ? -1 : 1
  if (b.confirmed !== a.confirmed) return b.confirmed - a.confirmed
  if (b.deaths !== a.deaths) return b.deaths - a.deaths
  return b.recover - a.recover
}
```


## Don't Panic! This is not Z-Virus...
