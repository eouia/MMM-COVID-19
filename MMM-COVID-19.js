Module.register("MMM-COVID-19",{
  defaults: {
    debug:false,
    scanInterval: 1000 * 60 * 60 * 3,
    rotateInterval: 1000 * 5, // 0 means no rotate
    pinned: [ "Diamond Princess cruise ship, Others", "Mainland China"],
    myPosition: {latitude:50.0836, longitude:8.4694, metric:"km",}, //or null. // reserved for later.
    reportTimeFormat: "YYYY.MM.DD hh a"
  },

  getStyles: function() {
    return ["MMM-COVID-19.css"]
  },

  getScripts: function() {
    return ["moment.js"]
  },

  log: function(...args) {
    if (this.config.debug) {
      console.log("[COVID]", ...args)
    }
  },

  start: function() {
    this.total = null
    this.drawTimer = null
    this.regionIndex = 0
    this.rawData = null
    this.regions = []
    this.countrys = []
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "DOM_OBJECTS_CREATED") {
      this.scan()
    }
    if (noti == "COVID19_RESCAN") {
      this.scan()
    }
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "SCAN_RESULT") {
      console.log(payload)
      this.regulate(payload)
      this.draw()
      this.sendNotification("COVID_UPDATED")
    }
  },


  regulate: function(payload) {
    var sortOrder = (a, b)=>{
      return (b.data.key < a.data.key) ? 1 : -1
    }
    if (!payload.data) {
      this.log("Invalid payload:", payload)
    }
    var total = new Region({
      name: "World Total",
      key: "World:*",
      lastupdate:0,
      lastseries:0
    }, payload.seriesKey, {
      className: "total",
      timeFormat: this.config.reportTimeFormat,
    })
    var regions = []
    var countryTotal = {}
    for (var r of payload.data) {
      var ro = new Region(r, null, {
        className: "provincestate"
      })
      var country = r.countryregion
      var province = r.provincestate
      if (!countryTotal.hasOwnProperty(country)) {
        countryTotal[country] = new Region({
          name: country,
          key: country + ":*",
          latitude: r.latitude,
          longitude: r.longitude,
          lastupdate:0,
          lastseries: r.lastseries
        }, payload.seriesKey, {
          className: "countryregion",
          timeFormat: this.config.reportTimeFormat,
        })
      }
      countryTotal[country].accumulate(ro)
      countryTotal[country].updateLastUpdate(r.lastupdate)
      total.accumulate(ro)
      total.updateLastUpdate(r.lastupdate)
      total.data.lastseries = r.lastseries
      regions.push(ro)
    }
    for (var co of Object.values(countryTotal)) {
      if (co.option.accumulated > 1) {
        regions.push(co)
      }
    }
    this.total = total
    this.regions = regions.sort(sortOrder)
  },

  scan: function() {
    clearTimeout(this.scanTimer)
    this.sendSocketNotification("SCAN")
    this.scanTimer = setTimeout(()=>{
      this.scan()
    }, this.config.scanInterval)
  },

  draw: function() {
    clearTimeout(this.drawTimer)
    this.updateDom()
    this.drawTimer = setTimeout(()=>{
      this.draw()
    }, this.config.rotateInterval)
  },

  getDom: function() {
    var pos = (this.config.myPosition) ? this.config.myPosition : null
    var dom = document.createElement("div")
    dom.classList.add("covid")
    if (this.total) {
      dom.appendChild(this.total.draw("total"))
      for(var name of this.config.pinned) {
        var pin = this.regions.find((r)=>{
          if (r.data.name === name) {
            return true
          }
          return false
        })
        if (pin) dom.appendChild(pin.draw("pinned", pos))
      }
      if (this.config.rotateInterval > 0) {
        dom.appendChild(this.regions[this.regionIndex].draw("rotate", pos))
        if (this.regionIndex >= this.regions.length - 1) {
          this.regionIndex = 0
        } else {
          this.regionIndex++
        }
      }
    }
    return dom
  },



})

class Region {
  constructor(obj=null, seriesKey=null, option={}) {
    var _initSeries = (keys) => {
      var ret = {}
      for (var i of keys) {
        ret[i] = {
          confirmed:0,
          deaths:0,
          recovered:0,
        }
      }
      return ret
    }
    this.data = {
      key: "",
      lastupdate: 0,
      lastseries: 0,
      name: "",
      provincestate: "",
      countryregion: "",
      latitude: null,
      longitude: null,
      series: {}
    }
    if (Array.isArray(seriesKey)) this.data.series = _initSeries(seriesKey)
    if (obj) this.data = Object.assign({}, this.data, obj)
    this.option = {
      className: "",
      accumulated: 0,
      drawGraph: true,
      timeFormat: "YYYY.MM.DD h a"
    }

    if (option) this.option = Object.assign({}, this.option, option)
  }

  setLastReport(x) {
    this.data.lastReport = x
  }

  setLastSeries(x) {
    this.data.lastSeries = x
  }

  accumulate(obj) {
    for (var day of Object.keys(this.data.series)) {
      if (obj.data.series[day].confirmed) this.data.series[day].confirmed += obj.data.series[day].confirmed
      if (obj.data.series[day].deaths) this.data.series[day].deaths += obj.data.series[day].deaths
      if (obj.data.series[day].recovered) this.data.series[day].recovered += obj.data.series[day].recovered
    }
    this.option.accumulated++
  }

  current(status) {
    var key = this.generateSeriesKey()
    return this.data.series[key][status]
  }

  new(status, pastDay=0) {
    var targetDay = this.generateSeriesKey(pastDay)
    var beforeDay = this.generateSeriesKey(pastDay + 1)
    var r = this.data.series[targetDay][status] - this.data.series[beforeDay][status]
    return r
  }

  generateSeriesKey(pastDay=0) {
    var m = moment.utc(this.data.lastseries).subtract(pastDay, "day")
    return m.format("M/D/YY")
  }

  updateLastUpdate(x) {
    if (x > this.data.lastupdate) this.data.lastupdate = x
  }

  getDistance(lat1, lon1, metric="km") {
    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }
    var lat2 = this.data.latitude
    var lon2 = this.data.longitude
    var R = 6371
    var dLat = deg2rad(lat2-lat1)
    var dLon = deg2rad(lon2-lon1)
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    var d = R * c
    return Math.round((metric=="km") ? d : d * 0.621371)
  }

  draw(className=null, distance = null) {
    var dom = document.createElement("div")
    dom.classList.add("item")
    dom.classList.add(this.option.className)
    dom.classList.add(className)
    var region = document.createElement("div")
    region.classList.add("title")
    var name = document.createElement("div")
    name.classList.add("name")
    name.innerHTML = this.data.name
    region.appendChild(name)
    dom.appendChild(region)
    var info = document.createElement("div")
    info.classList.add("info")
    var time = document.createElement("div")
    time.classList.add("lastreported")
    time.innerHTML = moment(this.data.lastupdate).format(this.option.timeFormat)
    info.appendChild(time)
    if (distance) {
      var dist = document.createElement("div")
      dist.classList.add("distance")
      dist.classList.add(distance.metric)
      dist.innerHTML = this.getDistance(distance.latitude, distance.longitude, distance.metric)
      info.appendChild(dist)
    }
    dom.appendChild(info)
    var numbers = document.createElement("div")
    numbers.classList.add("numbers")
    numbers.classList.add("current")
    var confirmed = document.createElement("div")
    confirmed.classList.add("confirmed", "number")
    confirmed.innerHTML = this.current("confirmed")
    numbers.appendChild(confirmed)
    var deaths = document.createElement("div")
    deaths.classList.add("deaths", "number")
    deaths.innerHTML = this.current("deaths")
    numbers.appendChild(deaths)
    var recovered = document.createElement("div")
    recovered.classList.add("recovered", "number")
    recovered.innerHTML = this.current("recovered")
    numbers.appendChild(recovered)
    dom.appendChild(numbers)
    var ext = document.createElement("div")
    ext.classList.add("numbers")
    ext.classList.add("new")
    var c = document.createElement("div")
    c.classList.add("confirmed", "number")
    c.innerHTML = this.new("confirmed")
    ext.appendChild(c)
    var d = document.createElement("div")
    d.classList.add("deaths", "number")
    d.innerHTML = this.new("deaths")
    ext.appendChild(d)
    var r = document.createElement("div")
    r.classList.add("recovered", "number")
    r.innerHTML = this.new("recovered")
    ext.appendChild(r)
    dom.appendChild(ext)
    if (this.option.drawGraph) {
      dom.appendChild(this.graph())
    }
    return dom
  }

  graph() {
    var container = document.createElement("div")
    container.classList.add("graph-container")
    var graph = document.createElement("div")
    graph.classList.add("graph")

    var keys = Object.keys(this.data.series)
    var len = keys.length
    var series = []
    var max = 0
    for (var i = len - 2; i >= 0; i--) {
      var key = this.generateSeriesKey(i)
      var nc = this.new("confirmed", i)
      if (nc > max) max = nc
      var nd = this.new("deaths", i)
      if (nd > max) max = nd
      var nr = this.new("recovered", i)
      if (nr > max) max = nr
      series.push({
        key: key,
        confirmed: nc,
        deaths: nd,
        recovered: nr
      })
    }
    for (var o of series) {
      var cont = document.createElement("div")
      cont.classList.add("daily")
      cont.dataset.day = o.key
      for (var item of ["confirmed", "deaths", "recovered"]) {
        var n = document.createElement("div")
        n.classList.add(item, "new", "bar")
        n.dataset.type = item
        n.dataset.day = o.key
        n.dataset.count = o[item]
        var rat =  (Math.round(o[item] / max * 10000) / 100)
        n.style.height = ((o[item] == 0) ? 0 : rat) + "%"
        n.innerHTML = o[item]
        if (o[item] == max) n.classList.add("max")
        cont.appendChild(n)
      }
      graph.appendChild(cont)
    }
    container.appendChild(graph)
    var m = document.createElement("div")
    m.classList.add("maxcount")
    m.innerHTML = max
    container.appendChild(m)
    return container
  }
}
