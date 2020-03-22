const GithubContent = require('github-content')
const C2J = require('csvtojson')
const moment = require('moment')


class Covid19 {
  constructor(options=null) {
    this.regions = {}
    this.options = options
    this.repo = {
      owner: 'CSSEGISandData',
      repo: 'COVID-19',
      branch: 'master'
    }
  }

  log(...args) {
    if (this.options.debug) {
      console.log("[COVID:CORE]", ...args)
    }
  }

  extractRegionKey(obj) {
    return obj["Country/Region"].trim() + ":" + obj["Province/State"].trim()
  }

  scan(finish=()=>{}) {
    this.log("Scan starts.")
    var lastDay = moment.utc().add(-1, "day").startOf("day")
    var regions = {}
    var ci = new Set()
    var pi = []
    var latest = lastDay.format("MM-DD-YYYY") + ".csv"
    var days = [7, 6, 5, 4, 3, 2, 1, 0].map((d)=>{
      return moment(lastDay).subtract(d, "day").format("M/D/YY")
    })
    var initSeries = () => {
      var ret = {}
      for (var i of days) {
        ret[i] = {
          confirmed:0,
          deaths:0,
          recovered:0
        }
      }
      return ret
    }
    var sources = [
      'csse_covid_19_data/csse_covid_19_daily_reports/' + latest,
      'csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
      'csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
      'csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv',
    ]
    var gc = new GithubContent(this.repo)
    gc.files(sources, async (err, files) => {
      this.log("Access to data source.")
      if (err) {
        this.log("Error:", err)
        finish({error:err})
      }
      var lastUpdates = files.find((f)=>{return f.path == sources[0]})
      var confirmed = files.find((f)=>{return f.path == sources[1]})
      var deaths = files.find((f)=>{return f.path == sources[2]})
      var recovered = files.find((f)=>{return f.path == sources[3]})
      var csvtxt = lastUpdates.contents.toString()
      var jsonObj = await C2J().fromString(csvtxt)
      for (var r of jsonObj) {
        //if (r["Province/State"].trim() == r["Country/Region"].trim()) r["Province/State"] = ""
        var key = this.extractRegionKey(r)
        var ps = r["Province/State"].trim()
        var cr = r["Country/Region"].trim()
        regions[key] = {
          key: key,
          lastupdate: Number(moment(r["Last Update"]).format("x")),
          lastseries: Number(lastDay.format("x")),
          name: ((ps && ps.trim() !== cr.trim()) ? `${ps}, ${cr}` : cr),
          provincestate: ps,
          countryregion: cr,
          latitude: Number(r.Latitude),
          longitude: Number(r.Longitude),
          series:initSeries(days),
          //history:[],
        }
      }
      const parse = (obj, type) => {
        return new Promise((resolve, reject)=>{
          for (var r of obj) {
            //if (r["Province/State"].trim() == r["Country/Region"].trim()) r["Province/State"] = ""
            var rkey = this.extractRegionKey(r)
            if (!regions.hasOwnProperty(rkey)) continue
            var headers = Object.keys(r)
            for (var i = 0; i < days.length; i++) {
              var dkey = days[i]
              regions[rkey].series[dkey][type] = Number(r[dkey])
            }
          }
          resolve()
        })
      }
      var step = async()=>{
        var cjo = await C2J().fromString(confirmed.contents.toString())
        this.log("Resolving:", files[1].path)
        await parse(cjo, "confirmed")
        var djo = await C2J().fromString(deaths.contents.toString())
        this.log("Resolving:", files[2].path)
        await parse(djo, "deaths")
        var rjo = await C2J().fromString(recovered.contents.toString())
        this.log("Resolving:", files[3].path)
        await parse(rjo, "recovered")
      }
      await step()
      this.log("Scan Completed.")
      finish({
        data: Object.values(regions),
        reportTime: lastDay.format('x'),
        seriesKey: days,
      })
    })
  }
}


module.exports = Covid19
