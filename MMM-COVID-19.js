Module.register("MMM-COVID-19",{
  defaults: {
    debug:false,
    scanInterval: 1000 * 60 * 60 * 3,
    rotateInterval: 1000 * 5, // 0 means no rotate
    pinned: [ "World", "China Total"],
    //myPosition: {latitude:50.0836, longitude:8.4694, metric:"km",}, //or null. // reserved for later.
    myPosition: null,
    reportTimeFormat: "YYYY.MM.DD hh a",
    drawGraph: true,
    logTerritory: true
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
    this.pinned = []
    this.rotate = null
    this.sendSocketNotification("INIT", this.config)
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "COVID19_SCAN") {
      this.scan()
    }
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "PIN_RESULT") {
      this.pinned = []
      for(var r of payload) {
        var rO = new Region(r, {
          className: ((r.name == "World") ? "world" : "normal"),
          drawGraph: this.config.drawGraph,
          timeFormat: this.config.reportTimeFormat
        })
        this.pinned.push(rO)
      }
      this.updateDom()
    }
    if (noti == "ROTATE_RESULT") {
      this.rotate = new Region(payload, {
        className: "rotate",
        drawGraph: this.config.drawGraph,
        timeFormat: this.config.reportTimeFormat
      })
      this.updateDom()
    }
  },

  getDom: function() {
    var pos = (this.config.myPosition) ? this.config.myPosition : null
    var dom = document.createElement("div")
    dom.classList.add("covid")
    if (Array.isArray(this.pinned) && this.pinned.length > 0) {
      for(var p of this.pinned) {
        dom.appendChild(p.draw("pinned", pos))
      }
    }
    if (this.rotate) {
      dom.appendChild(this.rotate.draw("rotate", pos))
    }
    return dom
  },
})

class Region {
  constructor(obj=null, option=null) {
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
    if (obj) this.data = Object.assign({}, this.data, obj)
    this.option = {
      className: "",
      drawGraph: true,
      timeFormat: "YYYY.MM.DD h a"
    }
    if (option) this.option = Object.assign({}, this.option, option)
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
