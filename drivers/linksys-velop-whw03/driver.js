'use strict';

const { Driver } = require('homey');

class Velop_WHW03 extends Driver {
  deviceConnectedFlowCard    = null;
  deviceDisconnectedFlowCard = null;
  deviceOfflineFlowCard      = null;
  networkChangedFlowCard     = null;
  nodeChangedFlowCard        = null;
  wanStatusChangedFlowCard   = null;
  externalIpChangedFlowCard  = null;
  wanConnectedConditionCard  = null;
  deviceConnectedConditionCard = null;
  deviceConnectedToNodeConditionCard = null;
  deviceConnectedToNetworkConditionCard = null;
  deviceOfflineConditionCard = null;
  deviceCoonectedToGuestConditionCard = null;
  rebootActionFlowCard = null;
  guestNetowrkActionFlowCard = null;

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    // Register Triggers Listeners
    this.deviceConnectedFlowCard = this.homey.flow.getDeviceTriggerCard('a-new-device-connected');
    this.deviceConnectedFlowCard.registerRunListener(async (args, state) => {
      //args.Network: what the user wrote on the flow card. state.Network: what actually happened
      console.log("connect handler");
      console.log(args.Network + " " + state.Network + " ");
      if (args.Network === "ANY") return true;
      if (args.Network === state.Network) return true;
      return false;
    });

    this.deviceDisconnectedFlowCard = this.homey.flow.getDeviceTriggerCard('a-device-disconnected');
    this.deviceDisconnectedFlowCard.registerRunListener(async (args, state) => {
      //args.Network: what the user wrote on the flow card. state.Network: what actually happened
      console.log("disconnect handler");
      console.log(args.Network + " " + state.Network);
      if (args.Network === "ANY") return true;
      if (args.Network === state.Network) return true;
      return false;
    });

    this.deviceOfflineFlowCard = this.homey.flow.getDeviceTriggerCard('a-device-went-offline');
    this.deviceOfflineFlowCard.registerRunListener(async (args, state) => {
      //args.Network: what the user wrote on the flow card. state.Network: what actually happened
      console.log("device offline handler");
      return true;
    });

    this.networkChangedFlowCard = this.homey.flow.getDeviceTriggerCard('network-changed');
    this.networkChangedFlowCard.registerRunListener(async (args, state) => {
      //args.xxx: what the user wrote on the flow card. state.xxx: what actually happened
      console.log("network changed handler");
      console.log("On Flow Card: " + args.Source_Network + " --> " + args.Destination_Network);
      console.log("Actually Happenedy: " + state.Source_Network + " --> " + state.Destination_Network);
      if ((args.Source_Network === state.Source_Network || args.Source_Network == "ANY") && (args.Destination_Network === state.Destination_Network || args.Destination_Network == "ANY")) return true;
      return false;
    });

    this.nodeChangedFlowCard = this.homey.flow.getDeviceTriggerCard('node-changed');
    this.nodeChangedFlowCard.registerRunListener(async (args, state) => {
      //args.xxx: what the user wrote on the flow card. state.xxx: what actually happened
      console.log("node changed handler");
      console.log("On Flow Card: " + args.Source_Node.name + " --> " + args.Destination_Node.name);
      console.log("Actually Happenedy: " + state.Source_Node + " --> " + state.Destination_Node);
      if ((args.Source_Node.name === state.Source_Node || args.Source_Node.name == "Any") && (args.Destination_Node.name === state.Destination_Node || args.Destination_Node.name == "Any")) return true;
      return false;
    });

    this.wanStatusChangedFlowCard = this.homey.flow.getDeviceTriggerCard('wan-status-changed');
    this.wanStatusChangedFlowCard.registerRunListener(async (args, state) => {
      //args.xxx: what the user wrote on the flow card. state.xxx: what actually happened
      console.log("wan status changed handler");
      console.log("On Flow Card: " + args.Connection_Status);
      console.log("Actually Happenedy: " + state.Connection_Status);
      if (args.Connection_Status == "Changed") return true;
      return args.Connection_Status === state.Connection_Status;
    });

    this.externalIpChangedFlowCard = this.homey.flow.getDeviceTriggerCard('external-ip-changed');

    // Register Conditions Listeners
    this.wanConnectedConditionCard = this.homey.flow.getConditionCard('wan-connected-condition');
    this.wanConnectedConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): wan-connected-condition handler");
      return (await args.device.getWanStatus() === "Connected");
    });

    this.deviceConnectedConditionCard = this.homey.flow.getConditionCard('device-is-connected-condition');
    this.deviceConnectedConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): device-is-connected-condition handler");
      console.log("By mac or name: " + args.by_mac_or_name);
      if (args.by_mac_or_name === "by_mac") {
        console.log("Calling by-mac)");
        return(await args.device.getIsConnectedByMac(args.specific_device_cond.mac_address));
      } else {
        return(await args.device.getIsConnectedByName(args.specific_device_cond.device_name));
      }
      
    });

    this.deviceConnectedToNodeConditionCard = this.homey.flow.getConditionCard('device-is-connected-to-node-condition');
    this.deviceConnectedToNodeConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): device-is-connected-to-node handler");
      console.log("By mac or name: " + args.by_mac_or_name);
      var isConnected = false;
      var node = null;
      if (args.by_mac_or_name === "by_mac") {
        console.log("Calling by-mac)");
        isConnected = (await args.device.getIsConnectedByMac(args.specific_device_cond.mac_address));
        node = await args.device.getNodeByMac(args.specific_device_cond.mac_address);
      } else {
        isConnected = (await args.device.getIsConnectedByName(args.specific_device_cond.device_name));
        node = await args.device.getNodeByName(args.specific_device_cond.device_name);
      }
      return (isConnected && node === args.specific_node_id_cond.name);
    });

    this.deviceConnectedToNetworkConditionCard = this.homey.flow.getConditionCard('device-is-connected-to-network-condition');
    this.deviceConnectedToNetworkConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): device-is-connected-to-network-condition handler");
      console.log("By mac or name: " + args.by_mac_or_name);
      var isConnected = false;
      var network = null;
      if (args.by_mac_or_name === "by_mac") {
        console.log("Calling by-mac)");
        isConnected = await args.device.getIsConnectedByMac(args.specific_device_cond.mac_address);
        network = await args.device.getNetworkByMac(args.specific_device_cond.mac_address);
      } else {
        isConnected = await args.device.getIsConnectedByName(args.specific_device_cond.device_name);
        network = await args.device.getNetworkByName(args.specific_device_cond.device_name);
      }
      return (isConnected && network === args.specific_network_cond)
    });

    this.deviceOfflineConditionCard = this.homey.flow.getConditionCard('device-is-offline-condition');
    this.deviceOfflineConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): device-is-offline-condition handler");
      console.log("By mac or name: " + args.by_mac_or_name);
      var isOffline = false;
      if (args.by_mac_or_name === "by_mac") {
        console.log("Calling by-mac)");
        return await args.device.getIsOfflineByMac(args.specific_device_cond.mac_address);
      } else {
        return await args.device.getIsOfflineByName(args.specific_device_cond.device_name);
      }
    });

    this.deviceCoonectedToGuestConditionCard = this.homey.flow.getConditionCard('device-is-connected-to-guest-condition');
    this.deviceCoonectedToGuestConditionCard.registerRunListener(async (args, state) => {
      console.log("Condition (AND): device-is-connected-to-network-condition handler");
      console.log("By mac or name: " + args.by_mac_or_name);
      var isConnected = false;
      var network = null;
      if (args.by_mac_or_name === "by_mac") {
        console.log("Calling by-mac)");
        return await args.device.isConnectedToGuestByMac(args.specific_device_cond.mac_address);
      } else {
        isConnected = await args.device.isConnectedToGuestByName(args.specific_device_cond.device_name);
      }
    });

    //Register Action Listemers
    this.rebootActionFlowCard = this.homey.flow.getActionCard("reboot-router");
    this.rebootActionFlowCard.registerRunListener(async (args, state) => {
      console.log("Action (THEN): reboot handler");
      this.log("Rebooting Router");
      await this.homey.app.linksysVelopAPI.reboot();
      return true;
    });


    this.guestNetowrkActionFlowCard = this.homey.flow.getActionCard("guest-network");
    this.guestNetowrkActionFlowCard.registerRunListener(async (args, state) => {
      console.log("Action (THEN): Guest-NW handler");
      args.on_off === "on" ? await this.homey.app.linksysVelopAPI.toggleGuestNetwork(true) : await this.homey.app.linksysVelopAPI.toggleGuestNetwork(false);
      return true;
    });

    this.log('Velop_WHW03 has been initialized');
  }


  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    var deviceInfo; 
    try {
      deviceInfo = await this.homey.app.linksysVelopAPI.getDeviceInfo();
    } catch (err) {
      throw new Error("Could not access router. Please make sure your router is properly configured on the app-settings page and try again");
    }
    if (deviceInfo == null || deviceInfo.result != "OK") {
      throw new Error("Could not access router. Please make sure your router is properly configured on the app-settings page and try again");
    }

    var deviceData = {
      "model_number" : deviceInfo.output.modelNumber,
      "model_name" : deviceInfo.output.description      
    }
    if ((deviceInfo.output.modelNumber.toLowerCase() != "whw03") || (deviceInfo.output.description.toLowerCase() != "velop")) {
      await this.#testAllAPIs();
      throw new Error("It looks like your device is not supported by this app. If you like, please send deiagnostic report through app-settings. Once I get the report I can check if its possible to add support to your device.");
    };
    return [
      {
        name: deviceInfo.output.manufacturer + "-" + deviceInfo.output.description + "-" + deviceInfo.output.modelNumber,
        data: deviceData
      }
    ];
  }

  async #testAllAPIs() {
    this.log("-->getGuestNetworkStatus");
    this.error("-->getGuestNetworkStatus")
    await this.homey.app.linksysVelopAPI.getGuestNetworkStatus();

    this.log("-->getWanStatus");
    this.error("-->getWanStatus")
    await this.homey.app.linksysVelopAPI.getWanStatus();

    this.log("-->getFirmwareUpdateStatus");
    this.error("-->getFirmwareUpdateStatus")
    await this.homey.app.linksysVelopAPI.getFirmwareUpdateStatus();

    this.log("-->checkAdminPassword");
    this.error("-->checkAdminPassword")
    await this.homey.app.linksysVelopAPI.checkAdminPassword();

    this.log("-->getDeviceInfo");
    this.error("-->getDeviceInfo")
    await this.homey.app.linksysVelopAPI.getDeviceInfo();

    this.log("-->getDevices");
    this.error("-->getDevices")
    await this.homey.app.linksysVelopAPI.getDevices();
  }

}

module.exports = Velop_WHW03;
