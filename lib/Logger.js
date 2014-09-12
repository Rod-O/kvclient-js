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
/*global logConfiguration*/
"use strict"

var CONFIG_FILE = 'kvc.logconf.json';

function getTime(){
    var date  = new Date();
    var hour  = date.getHours();        hour  = (hour  < 10 ? "0" : "") + hour;
    var min   = date.getMinutes();      min   = (min   < 10 ? "0" : "") + min;
    var sec   = date.getSeconds();      sec   = (sec   < 10 ? "0" : "") + sec;
    var msec  = date.getMilliseconds(); msec  = (msec  < 10 ? "00" : (msec < 100 ? "0" : "") ) + msec;
    var year  = date.getFullYear();
    var month = date.getMonth() + 1;    month = (month < 10 ? "0" : "") + month;
    var day   = date.getDate();         day   = (day   < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec + "." + msec;
}

function setFile (file, callback) {
    if (typeof file === 'string') {
        if (!fs.existsSync(file)) {
            var firstMessage = '[' + getTime() + '] [INIT] KVStore for node.js log system - file created\n';
            fs.writeFile(file, firstMessage , function (err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                } else return file;
            });
        }
        return file;
    }
}

function verifyDebugLevel (logLevel) {
    var result = 0;
    if (typeof logLevel === 'string')
        result = levels.levels.indexOf(logLevel);
    else if (typeof logLevel === 'number')
        result = logLevel;
    
    return result;
}

function log (logger, level, stringLevel, message, callback) {
    if (logger.logLevel >= level ) {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }
        var logString = '[' + getTime() + '] ' + stringLevel + message + '\n';
        if (logger.logToFile) {
            fs.appendFile(logger.logFile, logString, function (err) {
                if (err) {
                    if (callback) callback(err);
                    else throw err;
                }
            });
        }
        if (logger.logToConsole)
            console.log(logString);
    }
}

var levels = {
    OFF    : 0,
    FATAL  : 1,
    ERROR  : 2,
    WARN   : 3,
    INFO   : 4,
    DEBUG  : 5,
    TRACE  : 6,
    ALL    : 7,
    levels : ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL']
}
exports.LOG_LEVELS = levels;


function Logger (){
    var conf = {};
    if (fs.existsSync(CONFIG_FILE)){
        conf = JSON.parse(fs.readFileSync(CONFIG_FILE));
        if (conf) {
            this.logLevel     = conf.logLevel;
            this.logToFile    = conf.logToFile;
            this.logFile      = conf.logFile;
            this.logToConsole = conf.logToConsole;
            return;
        }
    } else {
        this.logLevel     = conf.logLevel     = levels.ALL;
        this.logToFile    = conf.logToFile    = true;
        this.logFile      = conf.logFile      = 'log.txt';
        this.logToConsole = conf.logToConsole = false;
        fs.writeFileSync(CONFIG_FILE, conf);
    }
    this.LOG_LEVELS=levels;
}
exports.Logger = Logger;


Logger.prototype.trace = function(message, callback) {
    log(this, levels.TRACE, '[TRACE] ', message, callback);
}

Logger.prototype.debug = function(message, callback) {
    log(this, levels.DEBUG, '[DEBUG] ', message, callback);
}

Logger.prototype.info = function(message, callback) {
    log(this, levels.INFO,  '[INFO]  ', message, callback);
}

Logger.prototype.warn = function(message, callback) {
    log(this, levels.WARN,  '[WARN]  ', message, callback);
}

Logger.prototype.error = function(message, callback) {
    log(this, levels.ERROR, '[ERROR] ', message, callback);
}

Logger.prototype.fatal = function(message, callback) {
    log(this, levels.FATAL, '[FATAL] ', message, callback);
}
