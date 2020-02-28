var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  socketNotificationReceived: function (noti, payload) {
    if (noti == "LOG_PRSTCORE") {
      var index = {}
      for (var r of payload) {
        if (!index.hasOwnProperty(r.countryregion)) {
          index[r.countryregion] = []
        }
        if (!index[r.countryregion].includes(r.provincestate) && r.provincestate) {
          index[r.countryregion].push(r.provincestate)
        }
      }
      console.log("=================== MMM-COVID-19 Country code ===================")
      for (var c of Object.keys(index).sort()) {
        console.log(`COUNTRY:  '${c}'`)
        if (Array.isArray(index[c]) && index[c].length > 0) {
          for (var p of index[c].sort()) {
            console.log(`  PROVINCE:  '${p}'`)
          }
        }
      }
      console.log("=================================================================")
    }
  }
})
