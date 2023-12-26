'use strict';

var request = require('request');
var path = require('path');

class GetPost {

  /**
  * Log a string to the colsole with the dat/time and JS filename
  * @param {string or any object} msg the log message
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

  /**
  * Send a POST-HTTP request
  * @param {string} url the URL to send the request to
  * @param {string} body the body (date) of the rquest. Can be null if not body/data is required
  * @param {string} headers a JSON string of the headers to be used. Can be null if no headers are required (not recommended)
  * @returns {Promise<string>} returns the response of the POST request
  */
    async sendPostRequest(url, body, headers) {
        var requestBody = {
          url: url,
          method: "POST",
          json: true,
        };
        if (body) {
          requestBody.body = body;
        }
        if (headers) {
            requestBody.headers = headers;
        }

        this.log("---------------------");
        this.log("Sending POST Request:");
        this.log(requestBody);
    
        return new Promise((resolve, reject) => {
            request(requestBody, (err,response,body) => {
              if (!err && response.statusCode === 200) {
                this.log("POST Response: " + JSON.stringify(body));
                this.log("---------------------");
                resolve(body);
              } else if (err) {
                this.error("Post Error: ");
                this.error(err);
                this.error("Post Request Sent:");
                this.error(requestBody);
                this.error("---------------------");
                reject(err);
              } else {
                this.error("Post Error Status Code: " + response.statusCode);
                this.error("Post Request Sent:");
                this.error(requestBody);
                this.error("---------------------");
                reject(body);
              }
            })
        })
      }

  /**
  * Send a GET-HTTP request
  * @param {string} url the URL to send the request to
  * @param {string} headers a JSON string of the headers to be used. Can be null if no headers are required (not recommended)
  * @returns {Promise<string>} returns the response of the GET request
  */
    async sendGetRequest(url,headers) {
        var requestBody = {
            url: url,
            method: "GET",
            json: true,
            };
        if (headers) {
            requestBody.headers = headers;
        }

        this.log("--------------------");
        this.log("Sending GET Request:");
        this.log(requestBody);

        return new Promise((resolve, reject) => {
            request(requestBody, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    this.log("GET Response: " + JSON.stringify(body));
                    this.log("--------------------");
                    resolve(body);
                } else if (err) {
                  this.error("Get Error: ");
                  this.error(err);
                  this.error("Get Request Sent:");
                  this.error(requestBody);
                  this.error("---------------------");  
                  reject(err);
                } else {
                  this.error("Get Error Status Code: " + response.statusCode);
                  this.error("Get Request Sent:");
                  this.error(requestBody);
                  this.error("---------------------");  
                  reject(body);
                }
            });
        });
    }

};

module.exports = GetPost;
