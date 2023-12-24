'use strict';

const Homey = require('homey');
const LinksysVelopAPI = require("./lib/LinksysVelopAPI");
//DEBUG
//const LinksysVelopAPI = require("./lib/LinksysVelopAPIMock");

class LinksysRouter extends Homey.App {
  linksysVelopAPI = null;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    
    var ip = this.homey.settings.get('ip');
    var username = this.homey.settings.get('username');
    var password = this.homey.settings.get('password');

    //DEBUG
    //ip = username = password = "mock";

    if (ip && password && username) {
      this.linksysVelopAPI = new LinksysVelopAPI(ip,username,password);
    }

    this.homey.settings.on('set', async(elementName) => {
      if (elementName === "pwd_check") return;
      ip = this.homey.settings.get('ip');
      password = this.homey.settings.get('password');
      username = this.homey.settings.get('username');
      
      if (!ip || !password || !username) return;
      this.log("Got all credentials details");
      this.linksysVelopAPI = new LinksysVelopAPI(ip,username,password);
      try {
        this.homey.settings.set("pwd_check","PENDING");
        var response = await this.linksysVelopAPI.checkAdminPassword();
        if (response.result === "OK") {
          this.log("PWD OK!");
          this.homey.settings.set("pwd_check","OK");
        } else {
          this.log("PWD NOT OK!");
          this.homey.settings.set("pwd_check","NOT_OK");
        }
      } catch (err) {
        this.log("PWD NOT OK!");
        this.homey.settings.set("pwd_check","NOT_OK");
      }
      
    });

    this.log('LinksysRouter has been initialized');
  }
}

module.exports = LinksysRouter;
