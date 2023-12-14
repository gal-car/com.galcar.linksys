'use strict';

const GetPost = require("./GetPost");
var path = require('path');

const BASE_ACTION_URL = "http://linksys.com/jnap/";

class LinksysVelopAPI {
  #getPost;
  #headers;
  #jnapURL;
  
  constructor(ip,username,password) {
    this.#getPost = new GetPost();
    this.#jnapURL = "http://" + ip + "/JNAP/";
    this.#headers = {
      "X-JNAP-Authorization" : "Basic " + Buffer.from(username + ":" + password).toString('base64'),
      "Content-Type" : "application/json; charset=UTF-8"
    }
  }

     /**
     * Log a string to the colsole with the dat/time and JS filename
     * @param {string} msg the log message
     */
     log(msg) {
      var d = new Date(Date.now());
      if (typeof msg != "string") { 
        console.log(d.toISOString() + " [log] [" + path.basename(__filename) + "]");
        console.log(msg);
      }
      else { console.log(d.toISOString() + " [log] [" + path.basename(__filename) + "] " + msg); } ;
    }

     /**
     * Log a string to the stderr with the dat/time and JS filename
     * @param {string} msg the error message
     */
    error(msg) {
        var d = new Date(Date.now());
        if (typeof msg != "string") { 
        console.error(d.toISOString() + " [err] [" + path.basename(__filename) + "]");
        console.error(msg);
        }
        else { console.error(d.toISOString() + " [err] [" + path.basename(__filename) + "] " + msg); } ;
    }

    async #sendJnapRequest(apiName, body = {}) {
      this.#headers["X-JNAP-Action"] = BASE_ACTION_URL + apiName
      var response = await this.#getPost.sendPostRequest(
        this.#jnapURL,
        body,
        this.#headers
      )
      return response;
    }

    async getDevices() {
      // TODO: There are many GetDevices APIs (Getevices, GetDevices4, 5....). See which one I like most
        return await this.#sendJnapRequest("devicelist/GetDevices3");
    }

    async getDeviceInfo() {
      return await this.#sendJnapRequest("core/GetDeviceInfo");
    }

    async getFirmwareUpdateStatus() {
      return await this.#sendJnapRequest("firmwareupdate/GetFirmwareUpdateStatus");
    }

    async checkAdminPassword() {
      return await this.#sendJnapRequest("core/CheckAdminPassword");
    }

    async getWanStatus() {
      return await this.#sendJnapRequest("router/GetWANStatus3");
    }

    async reboot() {
      await this.#sendJnapRequest("core/Reboot");
    }

    async toggleGuestNetwork(state) {
      var resp = await this.#sendJnapRequest("guestnetwork/GetGuestRadioSettings");
      var body = {
        isGuestNetworkEnabled : state,
        maxSimultaneousGuests : resp.output.maxSimultaneousGuests,
        radios : resp.output.radios
      };
      var resp2 = await this.#sendJnapRequest("guestnetwork/SetGuestRadioSettings", body);
      this.log(resp2);
    }

    async getGuestNetworkStatus() {
      return await this.#sendJnapRequest("guestnetwork/GetGuestRadioSettings");
    }
}

module.exports = LinksysVelopAPI;