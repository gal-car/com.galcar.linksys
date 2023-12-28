'use strict';

const { Device } = require('homey');

const UPDATE_DEVICES_INTERVAL  = 60*1000 //1 minute
const UPDATE_WAN_INTERVAL      = 60*1000 //1 minute
const UPDATE_GUEST_NETWORK_INTERVAL = 60*1000 //1 minute
const UPDATE_FIRNWARE_INTERVAL = 60*60*1000 //1 hour


class Velop_Device extends Device {

  #devices    = [];
  #devicesRevision = 0;
  #nodes      = [];
  #wanStatus  = null;
  #externalIp = null;
  #guestNetworkStatus = false;
  
  #updateDeviceListInterval = null;
  #updatePendingOfflineInterval = null;
  #updatePendingOnlineInterval = null;
  #updateFirmwareDetailsInterval = null;
  #updateWanStatuInterval = null;
  #updateGuestNetworkInterval = null;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {

    await this.#updateDeviceList();
    await this.#updateFirmwareDetails();
    await this.#updateWanStatus();
    await this.#updateGuestNetworkStatus();

    this.#updateDeviceListInterval      = setInterval(async() => {await this.#updateDeviceList()},UPDATE_DEVICES_INTERVAL);
    this.#updatePendingOfflineInterval  = setInterval(async() => {await this.#updatePendingOffline()},UPDATE_DEVICES_INTERVAL);
    this.#updatePendingOnlineInterval   = setInterval(async() => {await this.#updatePendingOnline()},UPDATE_DEVICES_INTERVAL);
    this.#updateWanStatuInterval        = setInterval(async() => {await this.#updateWanStatus()},UPDATE_WAN_INTERVAL);
    this.#updateFirmwareDetailsInterval = setInterval(async() => {await this.#updateFirmwareDetails()},UPDATE_FIRNWARE_INTERVAL);
    this.#updateGuestNetworkInterval    = setInterval(async() => {await this.#updateGuestNetworkStatus()},UPDATE_GUEST_NETWORK_INTERVAL);

    this.driver.nodeChangedFlowCard.registerArgumentAutocompleteListener(
      "Source_Node",
      async (query, args) => {
        var results = await this.#getNodesForAutocomplete();
        results.push({name : "Any"});

        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.nodeChangedFlowCard.registerArgumentAutocompleteListener(
      "Destination_Node",
      async (query, args) => {
        var results = await this.#getNodesForAutocomplete();
        results.push({name : "Any"});
        
        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.deviceConnectedConditionCard.registerArgumentAutocompleteListener(
      "specific_device_cond",
      async (query, args) => {
        var results = (args.by_mac_or_name === "by_mac" ? await this.#getAllKnownDeviceMacs() : await this.#getAllKnownDeviceNames());
 
        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.deviceOfflineOnlineConditionCard.registerArgumentAutocompleteListener(
      "specific_device_cond",
      async (query, args) => {
        var results = (args.by_mac_or_name === "by_mac" ? await this.#getAllKnownDeviceMacs() : await this.#getAllKnownDeviceNames());
 
        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.deviceConnectedToNodeConditionCard.registerArgumentAutocompleteListener(
      "specific_node_id_cond",
      async (query, args) => {
        var results = await this.#getNodesForAutocomplete();
        
        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.deviceConnectedToNodeConditionCard.registerArgumentAutocompleteListener(
      "specific_device_cond",
      async (query, args) => {
        var results = (args.by_mac_or_name === "by_mac" ? await this.#getAllKnownDeviceMacs() : await this.#getAllKnownDeviceNames());

        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.driver.deviceConnectedToNetworkConditionCard.registerArgumentAutocompleteListener(
      "specific_device_cond",
      async (query, args) => {
        var results = (args.by_mac_or_name === "by_mac" ? await this.#getAllKnownDeviceMacs() : await this.#getAllKnownDeviceNames());

        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

     this.driver.deviceCoonectedToGuestConditionCard.registerArgumentAutocompleteListener(
      "specific_device_cond",
      async (query, args) => {
        var results = (args.by_mac_or_name === "by_mac" ? await this.#getAllKnownDeviceMacs() : await this.#getAllKnownDeviceNames());

        // filter based on the query
        return results.filter((result) => {
           return result.name.toLowerCase().includes(query.toLowerCase());
        });
      }
    );

    this.registerCapabilityListener("reboot", async (value) => {
      this.log("Rebooting Router");
      await this.homey.app.linksysVelopAPI.reboot();
      return true;
    });

    this.registerCapabilityListener("guest_network", async (value) => {
      this.log("Setting guest network to:" + value);
      await this.homey.app.linksysVelopAPI.toggleGuestNetwork(value);
      return true;
    });


    this.log('Velop_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Velop_Device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Velop_Device settings where changed');
  }


  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('Velop_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    clearInterval(this.#updateDeviceListInterval);
    clearInterval(this.#updatePendingOffline);
    clearInterval(this.#updatePendingOnline);
    clearInterval(this.#updateFirmwareDetailsInterval);
    clearInterval(this.#updateWanStatuInterval);

    this.log('Velop_Device has been deleted');
  }

  async #getNodesForAutocomplete() {
    var results = [];

    for (let node of Object.values(this.#nodes)) { 
      results.push(
        { name: node }
      )
    }
    return results;
  }

  async #updateDeviceList() {
    this.log("Update Device List");
    try {
      var response = await this.homey.app.linksysVelopAPI.getDevices();
    } catch(err) {
      this.error("Could not get devices-list from the router");
      this.error(err);
    }
    if (response.result != "OK") {
      throw new Error("Could not get devices-list from router. Result: " + response.results)
    }
    var newDevices = [];

    var devices     = response.output.devices;
    var newRevision = response.output.revision;
    
    // If revision is not newer than the one we analyzed, nothing to do
    if (this.#devicesRevision >= newRevision) {
      this.log("Update skipped. New revision: " + newRevision + " Old revision: " + this.#devicesRevision);
      return ;
    }

    for (let device of Object.values(devices)) {
      var newDevice = {
        name : "Unknown",
        isConnected : false,
        offlineAfter : 0,
        onlineAfter: 0,
        connectionType: "Unknown",
        ipv4 : "Unknown",
        ipv6 : "Unknown",
        macAddress : "Unknown",
        pastMacAddresses: [],
        parent : "Unknown",
        isNode : false,
        isGuest : false,
        revision : 0
      };
      newDevice.deviceId = device.deviceID;
      newDevice.revision = device.lastChangeRevision;
      for (let iface of Object.values(device.knownInterfaces)) { newDevice.pastMacAddresses.push(iface.macAddress); };
      if (device.connections.length == 0) {
        newDevice.isConnected = false;
      } else {
        newDevice.isConnected = true;
        var iface = device.knownInterfaces.find((element) => {return element.macAddress === device.connections[0].macAddress});
        if (iface.interfaceType == "Wired") { newDevice.connectionType = "LAN" } else
        if (iface.interfaceType == "Unknown") {newDevice.connectionType = "Unknown"} else
        newDevice.connectionType = iface.band; 

        if (device.connections[0].ipAddress     ) {newDevice.ipv4 = device.connections[0].ipAddress        };
        if (device.connections[0].ipv6Address   ) {newDevice.ipv6 = device.connections[0].ipv6Address      };
        if (device.connections[0].parentDeviceID) {newDevice.parent =  device.connections[0].parentDeviceID};
        if (device.connections[0].isGuest)        {newDevice.isGuest =  true};
        if (device.connections[0].macAddress)     {newDevice.macAddress = device.connections[0].macAddress}; 
      }
      if (device.friendlyName) {newDevice.name = device.friendlyName};
      if (device.nodeType == "Master" || device.nodeType == "Slave") {
        newDevice.isNode = true;
        this.#nodes[device.deviceID] = device.properties.find(function(element) {return element.name === "userDeviceName"}).value;
      } else {newDevice.isNode = false; };
      newDevices.push(newDevice);
    }


    var nof24GHZ =  newDevices.filter(it => it.connectionType === '2.4GHz' && it.isConnected).length;
    var nof5GHZ =  newDevices.filter(it => it.connectionType === '5GHz' && it.isConnected).length;
    var nofLan =  newDevices.filter(it => it.connectionType === 'LAN' && it.isConnected).length;
    var nofUnknown = newDevices.filter(it => it.connectionType === 'Unknown' && it.isConnected).length;
    var nofConnected = newDevices.filter(it => it.isConnected == true).length;
    var nofNodes = newDevices.filter(it => it.isNode == true).length;

    this.setCapabilityValue('nof_24ghz_devices'    , nof24GHZ).catch(this.error);
    this.setCapabilityValue('nof_5ghz_devices'     , nof5GHZ).catch(this.error);
    this.setCapabilityValue('nof_lan_devices'      , nofLan).catch(this.error);
    this.setCapabilityValue('nof_unknown_devices'  , nofUnknown).catch(this.error);
    this.setCapabilityValue('nof_connected_devices', nofConnected).catch(this.error);
    this.setCapabilityValue('nof_nodes'            , nofNodes).catch(this.error);

    //Find Differences from last check
    if (this.#devices.length != 0) {
      for (let newDevice of Object.values(newDevices)) {
        var oldDevice = this.#devices.find(({ deviceId }) => deviceId === newDevice.deviceId);
        if (!oldDevice) {continue;};
        newDevice.offlineAfter = oldDevice.offlineAfter;
        newDevice.onlineAfter = oldDevice.onlineAfter;
        if (newDevice.macAddress === "Unknown") { newDevice.macAddress = oldDevice.macAddress; };
        if (newDevice.ipv4 === "Unknown") { newDevice.ipv4 = oldDevice.ipv4; };
        if (newDevice.ipv6 === "Unknown") { newDevice.ipv6 = oldDevice.ipv4; };
        if (newDevice.name === "Unknown") { newDevice.name = oldDevice.name; };
        if (newDevice.connectionType === "Unknown") { newDevice.connectionType = oldDevice.connectionType; };
      
        //If oldDevice has a bigger/equal revision that newDevice nothign to do
        if (oldDevice.revision >= newDevice.revision) { continue; };

        if (oldDevice != null && oldDevice.isConnected && !newDevice.isConnected) {
          // We are looking at oldDevice and not at newDevice since newDevice is disconnected, so it doesn't have IP, Network, etc.
          this.log("Triggering Disconnect: " + oldDevice.name + " " + oldDevice.macAddress + " " + oldDevice.ipv4);
          if (newDevice.onlineAfter != 0) {newDevice.onlineAfter = 0}
          else {newDevice.offlineAfter = 1};
          newDevice.onlineAfter = 0;
          await this.driver.deviceDisconnectedFlowCard.trigger(
            this,
            {
              "device-name" : oldDevice.name,
              "device-mac-address" : oldDevice.macAddress,
              "device-ip" : oldDevice.ipv4,
              "disconnect_network" : oldDevice.connectionType
            },
            {
              "Network" : oldDevice.connectionType
            });
        }
        if (oldDevice == null || !oldDevice.isConnected && newDevice.isConnected) {
          this.log("Triggering Connect: " + newDevice.name + " " + newDevice.macAddress + " " + newDevice.ipv4);
          if (newDevice.offlineAfter != 0) { newDevice.offlineAfter = 0}
          else {newDevice.onlineAfter = 1};
          await this.driver.deviceConnectedFlowCard.trigger(
            this,
            {
              "device-name" : newDevice.name,
              "device-mac-address" : newDevice.macAddress,
              "device-ip" : newDevice.ipv4,
              "connect_network" : newDevice.connectionType
            },
            {
              "Network" : newDevice.connectionType
            });
        }
        if (oldDevice != null && oldDevice.isConnected && newDevice.isConnected && oldDevice.connectionType != newDevice.connectionType) {
          // Network Changed
          this.log("Triggering NW-changed: " + newDevice.name + " " + newDevice.macAddress + " " + newDevice.ipv4 + " " + oldDevice.connectionType + " --> " + newDevice.connectionType);
          await this.driver.networkChangedFlowCard.trigger(
            this,
            {
              "device-name" : newDevice.name,
              "device-mac-address" : newDevice.macAddress,
              "device-ip" : newDevice.ipv4,
              "source-network" : oldDevice.connectionType,
              "destination-network" : newDevice.connectionType
            },
            {
              "Source_Network"      : oldDevice.connectionType,
              "Destination_Network" : newDevice.connectionType
            });
        }
        if (oldDevice != null && oldDevice.isConnected && newDevice.isConnected && oldDevice.parent != newDevice.parent) {
          // Switch Node
          this.log("Triggering Node-changed: " + newDevice.name + " " + newDevice.macAddress + " " + newDevice.ipv4 + " " + this.#nodes[oldDevice.parent] + " --> " + this.#nodes[newDevice.parent]);
          await this.driver.nodeChangedFlowCard.trigger(
            this,
            {
              "device-name" : newDevice.name,
              "device-mac-address" : newDevice.macAddress,
              "device-ip" : newDevice.ipv4,
              "source-network" : oldDevice.connectionType,
              "destination-network" : newDevice.connectionType,
              "source-node" : this.#nodes[oldDevice.parent],
              "destination-node" : this.#nodes[newDevice.parent]
            },
            {
              "Source_Node"      : this.#nodes[oldDevice.parent],
              "Destination_Node" : this.#nodes[newDevice.parent]
            });
        }
      }
    }

    this.#devices         = newDevices;
    this.#devicesRevision = newRevision;
  }

  async #updatePendingOffline() {
    var pendingOfflineDevices = this.#devices.filter((device) => {
      return device.offlineAfter != 0;
    });
    this.log("pending offline:");
    this.log(pendingOfflineDevices)

    var offlineAfterConfig = this.homey.settings.get('offline_online_after');

    pendingOfflineDevices.forEach((device) => {
      if (device.isConnected) {
        device.offlineAfter = 0;
      } else if (device.offlineAfter >= offlineAfterConfig) {
        //trigger device is offline
        this.log("Triggering Device-went-offline: " + device.name);
        this.driver.deviceOfflineOnlineFlowCard.trigger(
          this,
          {
            "device-name" : device.name,
            "device-mac-address" : device.macAddress,
            "device-ip" : device.ipv4,
            "disconnect_network" : device.connectionType
          },
          {
            "offline_online" : "offline"
          }
        );
        device.offlineAfter = 0;
      } else {
        device.offlineAfter++;
      }
    })
  }

  async #updatePendingOnline() {
    var pendingOnlineDevices = this.#devices.filter((device) => {
      return device.onlineAfter != 0;
    });
    this.log("pending online:");
    this.log(pendingOnlineDevices)

    var onlineAfterConfig = this.homey.settings.get('offline_online_after');

    pendingOnlineDevices.forEach((device) => {
      if (!device.isConnected) {
        device.onlineAfter = 0;
      } else if (device.onlineAfter >= onlineAfterConfig) {
        //trigger device is offline
        this.log("Triggering Device-went-online: " + device.name);
        this.driver.deviceOfflineOnlineFlowCard.trigger(
          this,
          {
            "device-name" : device.name,
            "device-mac-address" : device.macAddress,
            "device-ip" : device.ipv4,
            "disconnect_network" : device.connectionType
          },
          {
            "offline_online" : "online"
          }
        );
        device.onlineAfter = 0;
      } else {
        device.onlineAfter++;
      }
    })
  }

  async getWanStatus() {
    return this.#wanStatus;
  }

  async getIsConnectedByMac(mac) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === mac)})
    if (devices.find(function(device) {return device.isConnected == true})) return true;
    return false;
  }

  async getIsConnectedByName(name) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === name)})
    if (devices.find(function(device) {return device.isConnected == true})) return true;
    return false;
  }

  async getIsOfflineByMac(mac) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === mac)})
    if (devices.find(function(device) {return !device.isConnected && device.offlineAfter == 0})) return true;
    return false;
  }

  async getIsOfflineByName(name) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === name)})
    if (devices.find(function(device) {return !device.isConnected && device.offlineAfter == 0})) return true;
    return false;
  }

  async getIsOnlineByMac(mac) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === mac)})
    if (devices.find(function(device) {return device.isConnected && device.onlineAfter == 0})) return true;
    return false;
  }

  async getIsOnlineByName(name) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === name)})
    if (devices.find(function(device) {return device.isConnected && device.onlineAfter == 0})) return true;
    return false;
  }

  async getNetworkByMac(mac) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === mac)})
    return (devices.find(function(device) {return device.isConnected == true})).connectionType;
  }

  async getNetworkByName(name) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === name)})
    return (devices.find(function(device) {return device.isConnected == true})).connectionType;
  }

  async isConnectedToGuestByMac(mac) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === mac)})
    var connectedDevice = devices.find(function(device) {return device.isConnected == true});
    if (connectedDevice) { return connectedDevice.isGuest ; }
    else return false;
  }

  async isConnectedToGuestByName(name) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === name)})
    var connectedDevice = devices.find(function(device) {return device.isConnected == true});
    if (connectedDevice) { return connectedDevice.isGuest ; }
    else return false;  
  }

  async getNodeByName(deviceName) {
    var devices = this.#devices.filter((result) => 
    { return (result.name === deviceName)})

    var device = devices.find(function(device) {return device.isConnected == true});
    var nodeId = device.parent;
    return this.#nodes[nodeId];
  }

  async getNodeByMac(deviceMAC) {
    var devices = this.#devices.filter((result) => 
    { return (result.macAddress === deviceMAC)})

    var device = devices.find(function(device) {return device.isConnected == true});
    var nodeId = device.parent;
    return this.#nodes[nodeId];
  }

  async #getAllKnownDeviceMacs() {
    var results = [];

    for (let device of Object.values(this.#devices)) { 
      for (let mac of Object.values(device.pastMacAddresses)) {
        if (results.find((element) => {return element.mac_address === mac})) {continue;};
        results.push({
          "name" : mac + " (" + device.name + ")",
          "mac_address" : mac,
        });
      }
    }
    return results;
  }

  async #getAllKnownDeviceNames() {
    var results = [] ;

    for (let device of Object.values(this.#devices)) { 
      if (results.find((element) => {return element.device_name === device.name}) || device.name === "Unknown") {continue;};
      results.push({
        "name" : device.name,
        "device_name" : device.name
      });
    }
    return results;
  }

  async #updateFirmwareDetails() {
    try {
      var response = await this.homey.app.linksysVelopAPI.getFirmwareUpdateStatus();
    } catch(err) {
      this.error("Could not get Firmware details from the router");
    }
    if (response.result != "OK") {
      throw new Error("Could not get Firmware details from router. Result: " + response.result)
    }
    var lastCheckTime = response.output.lastSuccessfulCheckTime;
    this.setCapabilityValue('firmware_check_date', lastCheckTime).catch(this.error);

    try {
      var response = await this.homey.app.linksysVelopAPI.getDeviceInfo();
    } catch(err) {
      this.error("Could not get Device-info from the router");
    }
    if (response.result != "OK") {
      throw new Error("Could not get Device-info from router. Result: " + response.result)
    }
    var firmwareVersion = response.output.firmwareVersion;
    this.setCapabilityValue('firmware_version', firmwareVersion).catch(this.error);
  }

  async #updateWanStatus() {
    var wanStatusChanged  = false;
    var externalIpChanged = false;

    try {
      var response = await this.homey.app.linksysVelopAPI.getWanStatus();
    } catch(err) {
      this.error("Could not get Wan-status from the router");
    }
    if (response.result != "OK") {
      throw new Error("Could not get wan-status from router. Result: " + response.result)
    }

    var newWanStatus = response.output.wanStatus;
    if (this.#wanStatus != null && this.#wanStatus != newWanStatus) {
      // WAN Status Changed
      wanStatusChanged = true;
    }
    this.#wanStatus = newWanStatus;
    this.setCapabilityValue('wan_status', this.#wanStatus).catch(this.error);

    var newExternalIP = response.output.wanConnection.ipAddress;
    if (this.#wanStatus == "Connected") {
      if (this.#externalIp != null && this.#externalIp != newExternalIP) {
        externalIpChanged = true;
      }
      this.#externalIp = newExternalIP;
    }
    else { 
      if (this.#externalIp != "N/A") { externalIpChanged = true; };
      this.#externalIp = "N/A"; 
    }
    this.setCapabilityValue('external_ip', this.#externalIp).catch(this.error);

    if (wanStatusChanged) {
      await this.driver.wanStatusChangedFlowCard.trigger(
        this,
        { "external-ip"      : this.#externalIp, "wan-connection-status" : this.#wanStatus },
        { "Connection_Status": this.#wanStatus });
    }

    if (externalIpChanged) {
      await this.driver.externalIpChangedFlowCard.trigger(
        this,
        { "external-ip" : this.#externalIp },
        {}
      );
    }
  }

  async #updateGuestNetworkStatus() {
    try {
      var response = await this.homey.app.linksysVelopAPI.getGuestNetworkStatus();
    } catch(err) {
      this.error("Could not get Guest NW status from the router");
    }
    if (response.result != "OK") {
      throw new Error("Could not get wan-status from router. Result: " + response.result)
    }
    this.#guestNetworkStatus = response.output.isGuestNetworkEnabled;
    this.setCapabilityValue('guest_network', this.#guestNetworkStatus).catch(this.error);
  }
}

module.exports = Velop_Device;
