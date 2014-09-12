/*-
 *
 *  This file is part of Oracle NoSQL Database
 *  Copyright (C) 2011, 2014 Oracle and/or its affiliates.  All rights reserved.
 *
 * If you have received this file as part of Oracle NoSQL Database the
 * following applies to the work as a whole:
 *
 *   Oracle NoSQL Database server software is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU Affero
 *   General Public License as published by the Free Software Foundation,
 *   version 3.
 *
 *   Oracle NoSQL Database is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *   Affero General Public License for more details.
 *
 * If you have received this file as part of Oracle NoSQL Database Client or
 * distributed separately the following applies:
 *
 *   Oracle NoSQL Database client software is free software: you can
 *   redistribute it and/or modify it under the terms of the Apache License
 *   as published by the Apache Software Foundation, version 2.0.
 *
 * You should have received a copy of the GNU Affero General Public License
 * and/or the Apache License in the LICENSE file along with Oracle NoSQL
 * Database client or server distribution.  If not, see
 * <http://www.gnu.org/licenses/>
 * or
 * <http://www.apache.org/licenses/LICENSE-2.0>.
 *
 * An active Oracle commercial licensing agreement for this product supersedes
 * these licenses and in such case the license notices, but not the copyright
 * notice, may be removed by you in connection with your distribution that is
 * in accordance with the commercial licensing terms.
 *
 * For more information please contact:
 *
 * berkeleydb-info_us@oracle.com
 *
 */
/*global kvLogger*/
/*global Errors*/
/*global kvmodule_dir*/
/*global proxyConfiguration*/

"use strict"

var child_process   = require('child_process');

var PROXY_TIMEOUT = 4000;
var PROXY_ERROR_TIMEOUT = 1000;
var proxyPid = null;
var PID_FILE = "/tmp/kvstore_proxy.pid";


function getPortFlag(hostPort){
    var colon = hostPort.indexOf(':');
    var port = hostPort.substr(colon+1);
    if (port)
        return ' -port ' + port;
    return '';
}

function getHostsFlag(helperHosts) {
    var hosts, flag="";
    if (helperHosts){
        if (typeof helperHosts === 'string'){
            hosts = helperHosts;
        }
        if (typeof helperHosts === 'array') {
            var firstComa = true;
            for (var _host in helperHosts) {
                hosts += (firstComa?"":",") + _host;
                firstComa = false;
            }
        }
        if (hosts) {
            flag = " -hosts " + hosts;
            kvLogger.debug("Host flag for proxy: " + flag);
        }
    }
    return flag;
}

function getStoreFlag(store) {
    if (typeof store === 'string')
        if (store.length > 0)
            return " -store " + store
    return "";
}


function getProxyClasspath() {
    var separator = (process.platform==='win32'?";":":");
    return  " -cp " +
            path.normalize(kvmodule_dir + '/proxy/proxyServer.jar')             + separator +
            path.normalize(kvmodule_dir + '/proxy/lib/libthrift-0.9.1.jar')     + separator +
            path.normalize(proxyConfiguration.KVSTORE_JAR)                      + separator +
            path.normalize(kvmodule_dir + '/proxy/lib/slf4j-log4j12-1.5.8.jar') + separator +
            path.normalize(kvmodule_dir + '/proxy/lib/log4j-1.2.14.jar')        + separator +
            path.normalize(kvmodule_dir + '/proxy/lib/slf4j-api-1.5.8.jar');
}

exports.ProxyConfiguration = function ProxyConfiguration () {
    this.startLocalProxy    = true;
    this.proxyHost          = 'localhost:5010';  // default value - use when startLocalProxy = true
    this.KVSTORE_JAR        = process.env.KVSTORE_HOME_DIR+"/dist/lib/kvstore.jar";
    this.storeName          = "kvstore";        //default for kvlite
    this.helperHosts        = 'localhost:5000';
    this.readZones          = "";
    this.securityProperties = new Types.SecurityProperties();
    this.requestTimeout     = 1000;  //todo: send this parameter to the proxy
    this.socketOpenTimeout  = 1000;  //todo: send this parameter to the proxy
    this.socketReadTimeout  = 1000;  //todo: send this parameter to the proxy
}


function checkJava (callback) {
    kvLogger.debug('Check on Java');
    var java  = child_process.spawn('java', ['-version']);
    java.stderr.on('data', function (data) {
        if (callback) callback();
        callback = null;
        clearTimeout(timeout);
        removeall();
    });
    java.stdin.on('data', function (data) {
        if (callback) callback();
        callback = null;
        clearTimeout(timeout);
        removeall();
    });
    java.stdout.on('data', function (data) {
        if (callback) callback();
        callback = null;
        clearTimeout(timeout);
        removeall();
    });
    java.on('error', function (error) {
        if (callback) callback(error);
        callback = null;
        clearTimeout(timeout);
        removeall();
    });
    var timeout = setTimeout(function(){ if (callback) callback(false) }, 4000);
    function removeall() {
        java.stderr.removeAllListeners('data');
        java.stdin.removeAllListeners('data');
        java.stdout.removeAllListeners('data');
        java.removeAllListeners('error');
    }
}
exports.checkJava = checkJava;

function startProxy (callback) {
    kvLogger.info('[PROXY] Start proxy');
    checkJava(function(err){
        if (err) {
            kvLogger.error('Java not found')
            if (callback) callback(false);
            return;
        }

        var launchFile = '/tmp/launch.sh';
        /// flags...
        var jarClasspath = getProxyClasspath();
        var hostsFlag = getHostsFlag(proxyConfiguration.helperHosts);
        var portFlag = getPortFlag(proxyConfiguration.proxyHost);
        var logConfiguration =
            ' -Dlog4j.configuration=' +
            path.normalize(kvmodule_dir + '/proxy/log4j.ini');
        var storeFlag = getStoreFlag(proxyConfiguration.storeName);

        var commandLine =
            'java ' +
            logConfiguration +
            jarClasspath +
            ' com.oracle.ondb.proxy.ProxyServer ' +
            hostsFlag +
            portFlag +
            storeFlag +
            ' &';

        kvLogger.debug('[PROXY] Launch proxy cmd: ' + commandLine);
        fs.writeFileSync(launchFile, commandLine);
        fs.appendFileSync(launchFile, 'echo $! > ' + PID_FILE);
        fs.chmodSync(launchFile, '777');

        var timeoutOnError, timeoutStartProxy;
        var proxy = child_process.exec(launchFile, function(error, stdout, stderr){
            kvLogger.debug('[PROXY] error:  ' + error);
            kvLogger.debug('[PROXY] stdout: ' + stdout);
            kvLogger.debug('[PROXY] stderr: ' + stderr);
            if (callback) timeoutOnError = setTimeout(function(){
                    clearTimeout(timeoutStartProxy);
                    kvLogger.debug('[PROXY] Error setting up the proxy');
                    if (callback) callback(new Error(Errors.PROXY_ERROR));
                    callback=null;
            }, PROXY_ERROR_TIMEOUT);
        });
        proxy.on('exit', function(code){
            if (fs.existsSync(launchFile)) fs.unlinkSync(launchFile);
            if (fs.existsSync(PID_FILE)) {
                proxyPid = fs.readFileSync(PID_FILE);
                fs.unlinkSync(PID_FILE);
            }
            kvLogger.debug('[PROXY] Proxy launched with pid:' + proxyPid);

            if (callback) timeoutStartProxy = setTimeout(function(){
                    clearTimeout(timeoutOnError);
                    kvLogger.debug('[PROXY] Return after ' + (PROXY_TIMEOUT / 1000) + ' secs');
                    if(callback) callback(null, proxyPid);
                    callback=null;
            }, PROXY_TIMEOUT);
            proxy.removeAllListeners('on');
        });

    })
}
exports.startProxy = startProxy;


/**
 * Shutdown the proxy. If a proxy was started, this method will shutdown it.
 */
function stopProxy (callback) {
    kvLogger.info('Shutdown proxy');
    var colon = proxyConfiguration.proxyHost.indexOf(':');
    var host = proxyConfiguration.proxyHost.substr(0, colon);
    var port = proxyConfiguration.proxyHost.substr(colon+1);
    var connection = thrift.createConnection(host, port, {
        transport: thrift.TFramedTransport,
        protocol: thrift.TBinaryProtocol
    }).on('error', function(err) {
        kvLogger.debug("Can't connect to the proxy to stop it - " + err);
        if (callback) callback(err);
        connection.removeAllListeners('error');
        connection.removeAllListeners('connect');
    }).on('connect', function(err){
        kvLogger.debug('Thrift Connection successful');
        var client = thrift.createClient(ONDBClient, that.kvConnection);
        client.shutdown();
        connection.end();
        if (callback) callback();
        connection.removeAllListeners('error');
        connection.removeAllListeners('connect');
    });
}

exports.stopProxy = stopProxy;