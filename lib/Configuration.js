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
/*global Types*/
"use strict"

var Logger  = require('./Logger.js');

/**
 * Defines a set of configuration values used to connect to an Oracle NoSQL Database, this is just the constructor with
 * no parameters, once this object is created feel free to change any parameter.
 * @property {string} server defines the address or host name to be connected, <br />
 *         if multiple hosts are going to be used then use a string array with the host names, <br />
 *         all hosts are in the form host:port
 * @property {String} storeName the store name to be used
 * @property {String|Array} helperHosts
 * @property {String|Array} readZones
 * @property {SecurityProperties} securityProperties used for the connection
 * @property {Number} socketOpenTimeout a number in milliseconds to specify the timeout for the socket to connect
 * @property {Number} socketReadTimeout a number in milliseconds to specify the timeout for the socket to read
 * @property {Consistency} defaultConsistency indicates the consistency used by default
 * @property {Durability} defaultDurability indicates the durability used by default
 * @property {bool} startLocalProxy indicates if the client should start a proxy
 * @property {String} the proxy address to connect to if no proxy is started by the client
 * @constructor
 */
function Configuration () {
    this.defaultConsistency = Types.Consistency.ABSOLUTE;
    this.defaultDurability  = Types.newDurability(Types.ReplicaAckPolicy.ALL, Types.ReplicaAckPolicy.ALL, Types.SyncPolicy.NO_SYNC);
    this.connectionAttempts = 3;
};


module.exports = Configuration;

