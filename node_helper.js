var NodeHelper = require("node_helper")
const Covid19 = require("./COVID-19.js")

module.exports = NodeHelper.create({
  start: function () {

  },
  socketNotificationReceived: function (noti, payload) {
    if (noti == "SCAN") {
      var covid = new Covid19({debug:true})
      covid.scan((result)=>{
        if (!result.error) this.sendSocketNotification("SCAN_RESULT", result)
      })
    }
  }
})
