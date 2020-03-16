var NodeHelper = require("node_helper")
const Covid19 = require("./COVID-19.js")
const util = require('util')

module.exports = NodeHelper.create({
  start: function () {
    this.config = null
    this.regions = null
    this.worldTotal = null
    this.scanTimer = null
    this.rotateTimer = null
    this.index = 0
  },

  socketNotificationReceived: function (noti, payload) {
    if (noti == "INIT") {
      this.config = payload
      this.scan()
    }
    if (noti == "SCAN") {
      this.scan()
    }
  },

  scan: function() {
    clearTimeout(this.scanTimer)
    let covid = new Covid19({debug:true})
    covid.scan((result)=>{
      this.parse(result)
    })
    this.scanTimer = setTimeout(()=>{
      this.scan()
    }, this.config.scanInterval)
  },

  parse: function (data) {
    const max = (a, b) => {
      if (a < b) return b
      return a
    }
    const accumulate = (ct, r, init=null) => {
      if (!ct.hasOwnProperty("key")) {
        ct = {
          key: r.countryregion + ":*",
          lastupdate: r.lastupdate,
          lastseries: r.lastseries,
          name: r.countryregion + " Total",
          provincestate: '',
          countryregion: r.countryregion,
          latitude: r.latitude,
          longitude: r.longitude,
          series: {},
          provinceCount: 1,
        }
        if (init) {
          ct = Object.assign({}, ct, init)
        }
      }
      ct.lastupdate = max(ct.lastupdate, r.lastupdate)
      ct.lastseries = max(ct.lastseries, r.lastseries)
      ct.latitude = Math.round(
        ((ct.latitude * ct.provinceCount) + r.latitude) / (ct.provinceCount + 1)
        * 10000
      ) / 10000
      ct.longitude = Math.round(
        ((ct.longitude * ct.provinceCount) + r.longitude) / (ct.provinceCount + 1)
        * 10000
      ) / 10000
      ct.provinceCount++
      for(var key of data.seriesKey) {
        for (var f of field) {
          //console.log(countryTotal[r.countryregion])
          if (!ct.series.hasOwnProperty(key)) {
            ct.series[key] = {
              confirmed: 0,
              deaths: 0,
              recovered: 0,
            }
          }
          if (Number.isInteger(r.series[key][f])) {
            ct.series[key][f] += r.series[key][f]
          } else {
            console.log("[COVID19] Invalid data format:", r.key, key, r.series[key][f])
          }
        }
      }
      return Object.assign({}, ct)
    }
    const field = ["confirmed", "deaths", "recovered"]
    var countryTotal = {}
    var worldTotal = {}
    for (var r of data.data) {
      worldTotal = accumulate(worldTotal, r, {
        key: "World:*",
        name: "World",
        countryregion: "",
        latitude:null,
        longitude:null,
      })
      if (r.provincestate) {
        if (!countryTotal.hasOwnProperty(r.countryregion)) countryTotal[r.countryregion] = {}
        countryTotal[r.countryregion] = accumulate(countryTotal[r.countryregion], r)
      } else {
        continue
      }
    }
    this.regions = [].concat(data.data, Object.values(countryTotal))
    this.regions.sort((a, b)=>{
      if (b.key > a.key) return -1
      return 1
    })
    if (this.config.logTerritory) {
      console.log("*** [COVID19] Province/Country name list ***")
      for(var i of this.regions) {
        console.log(`'${i.name}'`)
      }
      console.log("********************************************")
    }
    this.worldTotal = worldTotal
    this.index = 0
    this.updatePin()
    this.updateRotate()
  },

  updateRotate: function() {
    if (!this.config.rotateInterval) return
    clearTimeout(this.rotateTimer)
    if (this.index > this.regions.length - 1) this.index = 0
    this.sendSocketNotification("ROTATE_RESULT", this.regions[this.index])
    this.index++
    this.rotateTimer = setTimeout(()=>{
      this.updateRotate()
    }, this.config.rotateInterval)
  },

  updatePin: function() {
    if (!Array.isArray(this.config.pinned || !this.config.pinned.length)) return
    var ret = []
    for (var p of this.config.pinned) {
      var pr = p.trim()
      if (pr == "World") {
        ret.push(this.worldTotal)
        continue
      }
      var f = this.regions.find((r)=>{
        if (r.name === pr) {
          return true
        }
        return false
      })
      if (f) {
        ret.push(f)
      } else {
        console.log(`[COVID19] Can't find territory name in list:`, pr)
      }
    }
    ret.filter((el)=>{return el != null})
    this.sendSocketNotification("PIN_RESULT", ret)
  }
})
