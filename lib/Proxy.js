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
"use strict";

/*global kvLogger*/
/*global Errors*/
/*global kvmodule_dir*/
/*global fs*/

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

function getHostsFlag(kvStoreHelperHosts) {
    kvLogger.debug("[PROXY] Helper hosts: " + kvStoreHelperHosts);

    var hosts, flag="";

    if (kvStoreHelperHosts){
        kvLogger.debug("[PROXY] Helper hosts: " + typeof kvStoreHelperHosts);
        var hosts;
        if (typeof kvStoreHelperHosts === 'array') {
            var firstComa = true;
            for (var _host in kvStoreHelperHosts) {
                hosts += (firstComa?"":",") + _host;
                firstComa = false;
            }
        } else {
            hosts = kvStoreHelperHosts;
        }
        flag = " -helper-hosts " + hosts;
        kvLogger.debug("Host flag for proxy: " + flag);
    }
    return flag;
}

function getStoreFlag(store) {
    if (typeof store === 'string')
        if (store.length > 0)
            return " -store " + store;
    return "";
}


function getProxyClasspath(proxyConfiguration) {
    return " -cp " +
        path.normalize(proxyConfiguration.KVCLIENT_JAR) + (process.platform==='win32'?";":":") +
        path.normalize(proxyConfiguration.PROXY_HOME + '/kvproxy.jar');
}

/**
 * Defines a set of configuration values used to connect or create a proxy instance, this is just the constructor with
 * no parameters, once this object is created feel free to change any parameter.
 * @property {boolean} startProxy indicates if the module should try to start a proxy instance from which it will
 * connect to a NoSQL Server
 * @property {String} host indicates the host:port for a proxy to connect, not used when
 * startProxy = true
 * @property {String} KVCLIENT_JAR the path where the file kvclient.jar is located, required to start a local proxy
 * @property {String} PROXY_HOME the path where the proxy files are located, by default they are located in this module
 * path, but a different value can be specified to start a local proxy with different binaries
 * @property {String} kvStoreName the store name to be used
 * @property {String|Array} kvStoreHelperHosts the helper hosts to be used by the proxy when connecting to a NoSQL Server
 * @property {String|Array} readZones the read zones to be used by the proxy when connecting to a NoSQL Server
 * @property {String|SecurityProperties} security used for the connection, this can be a string with the full path
 * of a file containing the required security properties, or can be a SecurityProperties object with all the required
 * properties, use null to avoid security properties.
 * @property {Number} requestTimeout a number in milliseconds to specify the timeout default value for a request
 * @property {Number} socketOpenTimeout a number in milliseconds to specify the timeout for the socket to connect
 * @property {Number} socketReadTimeout a number in milliseconds to specify the timeout for the socket to read
 * @constructor
 */
function ProxyConfiguration () {
    this.startProxy         = false;
    this.host               = "localhost:5010";
    this.KVCLIENT_JAR       = process.env.KVSTORE_HOME_DIR + "/dist/lib/kvclient.jar";
    this.PROXY_HOME         = path.normalize(kvmodule_dir + "/kvproxy/");
    this.kvStoreName        = "kvstore";
    this.kvStoreHelperHosts = "localhost:5000";
    this.readZones          = "";
    this.username           = "";
    this.security           = null;
    this.requestTimeout     = 1000;  //todo: send this parameter to the proxy
    this.socketOpenTimeout  = 1000;  //todo: send this parameter to the proxy
    this.socketReadTimeout  = 1000;  //todo: send this parameter to the proxy
}
exports.ProxyConfiguration = ProxyConfiguration;

function validateConfiguration (/*ProxyConfiguration*/ conf) {
    if (typeof conf.startProxy === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "startProxy");
    if (typeof conf.host === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "host");
    if (typeof conf.KVCLIENT_JAR === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "KVCLIENT_JAR");
    if (typeof conf.PROXY_HOME === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "PROXY_HOME");
    if (typeof conf.kvStoreName === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "kvStoreName");
    if (typeof conf.kvStoreHelperHosts === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "kvStoreHelperHosts");
    if (typeof conf.readZones === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "readZones");
    if (typeof conf.requestTimeout === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "requestTimeout");
    if (typeof conf.socketOpenTimeout === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "socketOpenTimeout");
    if (typeof conf.socketReadTimeout === 'undefined') throw new Error(Errors.ERROR_IN_PARAMETER + "socketReadTimeout");
}
exports.validateConfiguration = validateConfiguration;

/**
 * Object to define the security properties to be used when starting a proxy in order to connect to a secured store,
 * if a property is not intended to be used it must be set to null.
 * @property {String} SECURITY_FILE
 * @property {String} TRANSPORT
 * @property {String} SSL_TRANSPORT_NAME
 * @property {String} SSL_CIPHER_SUITES
 * @property {String} SSL_PROTOCOLS
 * @property {String} SSL_HOSTNAME_VERIFIER
 * @property {String} SSL_TRUSTSTORE_FILE
 * @property {String} SSL_TRUSTSTORE_TYPE
 * @property {String} AUTH_USERNAME
 * @property {String} AUTH_WALLET
 * @property {String} AUTH_PWDFILE
 * @constructor
 */
function SecurityProperties() {
    // this.SECURITY_FILE = null;
    this.TRANSPORT = "ssl";
    //this.SSL_TRANSPORT_NAME = null;
    //this.SSL_CIPHER_SUITES = null;
    this.SSL_PROTOCOLS = "TLSv1.2,TLSv1.1,TLSv1";
    this.SSL_HOSTNAME_VERIFIER = "dnmatch(CN\\=NoSQL)";
    this.SSL_TRUSTSTORE_FILE = process.env.KVROOT + "/security/client.trust";
    //this.SSL_TRUSTSTORE_TYPE = null;
    this.AUTH_USERNAME = "root";
    //this.AUTH_WALLET = null;
    this.AUTH_PWDFILE = process.env.KVROOT + "/security/login.passwd";
}
exports.SecurityProperties = SecurityProperties;

var SecurityPropertiesMap = {
    //SECURITY_FILE: null,
    TRANSPORT : "oracle.kv.transport",
    //SSL_TRANSPORT_NAME : null,
    //SSL_CIPHER_SUITES : null,
    SSL_PROTOCOLS : "oracle.kv.ssl.protocols",
    SSL_HOSTNAME_VERIFIER : "oracle.kv.ssl.hostnameVerifier",
    SSL_TRUSTSTORE_FILE : "oracle.kv.ssl.trustStore",
    //SSL_TRUSTSTORE_TYPE : null,
    AUTH_USERNAME : "oracle.kv.auth.username",
    //AUTH_WALLET : null
    AUTH_PWDFILE : "oracle.kv.auth.pwdfile.file",
};



/**
 * Tries to read a file with a ProxyConfiguration object
 * @param {string} filename the full path for the file
 * @returns {ProxyConfiguration}
 */
function readProxyConfiguration (filename) {
    var conf = {};
    if (fs.existsSync(filename)){
        conf = JSON.parse(fs.readFileSync(filename));
        validateConfiguration(conf);
        return conf;
    } else {
        throw (new Error(Errors.FILE_NOT_FOUND));
    }
}
exports.readProxyConfiguration = readProxyConfiguration;

function checkJava (callback) {
    kvLogger.debug('Check that Java environment is installed');
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

/**
 * starts a proxy with the given configuration
 * @param {ProxyConfiguration} proxyConfiguration the configuration used to start the proxy
 * @param {function} callback function called after the proxy is started
 */
function startProxy (proxyConfiguration, callback) {
    kvLogger.info('[PROXY] Start proxy');
    checkJava(function(err){
        if (err) {
            kvLogger.error('Java not found')
            if (callback) callback(new Error(Errors.NO_JAVA_CLIENT));
            return;
        }

        var launchFile = '/tmp/launch.sh';
        /// flags...
        var jarClasspath = getProxyClasspath(proxyConfiguration);
        var hostsFlag = getHostsFlag(proxyConfiguration.kvStoreHelperHosts);
        var portFlag = getPortFlag(proxyConfiguration.host);
        var logConfiguration =
            ' -Dlog4j.configuration=' +
            path.normalize(kvmodule_dir + '/proxy/log4j.ini');
        var storeFlag = getStoreFlag(proxyConfiguration.kvStoreName);

        var securityFlag = "";
        var securityFile = "/tmp/security";
        if (proxyConfiguration.security) {
            if (typeof proxyConfiguration.security !== "string") {
                fs.writeFileSync(securityFile, '');
                for (var key in proxyConfiguration.security) {
                    fs.appendFileSync(securityFile, SecurityPropertiesMap[key] + "=" + proxyConfiguration.security[key] + "\n");
                }
                fs.chmodSync(securityFile, '777');
            } else {
                securityFile = proxyConfiguration.security;
            }
            securityFlag = " -security " + securityFile;
            kvLogger.debug('[PROXY] Using security properties from: ' + securityFile);
        }

        var commandLine =
            'nohup java ' +
            logConfiguration +
            jarClasspath +
            ' oracle.kv.proxy.KVProxy ' +
            hostsFlag +
            portFlag +
            storeFlag +
            securityFlag +
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
 * @param {ProxyConfiguration} proxyConfiguration the configuration used to start the proxy
 * @param {function} callback function called after trying to shutdown the proxy
 */
function stopProxy (proxyConfiguration, callback) {
    kvLogger.info('Shutdown proxy');
    var colon = proxyConfiguration.host.indexOf(':');
    var host = proxyConfiguration.host.substr(0, colon);
    var port = proxyConfiguration.host.substr(colon+1);
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
        var client = thrift.createClient(ONDBClient, that.thriftConnection);
        client.shutdown();
        connection.end();
        if (callback) callback();
        connection.removeAllListeners('error');
        connection.removeAllListeners('connect');
    });
}

exports.stopProxy = stopProxy;