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

var fs = require("fs");
var assert = require("assert");
var Int64 = require('node-int64');
var kvClient = require("../kvclient");
var kvTypes = kvClient.Types;
var kvErrors = kvClient.Errors;
var ttypes = require("../lib/thrift/ondb_types.js");

describe("KVClient", function () {

    var file64 = new Buffer(fs.readFileSync(__dirname + "/image.jpg")).toString("base64");
    var fbin64 = new Buffer("1234567890").toString("base64");
    var configuration = new kvClient.Configuration();
    configuration.proxyConfiguration = kvClient.Proxy.readProxyConfiguration(__dirname + "/test-conf.json");

    this.timeout(5000);

    function Row() {
        this.id = 100;
        this.s = "String value";
        this.l = 999999999999999;  // max js long precision
        this.f = 9.123456;         //float
        this.d = 9.12345678901234; //double
        this.bool = true;
        this.bin = file64;
        this.fbin = fbin64;
        this.arrStr = ["X", "Y", "Z"];
        this.e = "A";
    }

    var durability =
        new kvTypes.Durability(kvTypes.SyncPolicy.SYNC,
            kvTypes.ReplicaAckPolicy.ALL,
            kvTypes.SyncPolicy.SYNC);

    var row = new Row();

    //describe("XX", function() {
    //    it("XX", function(done) {
    //        done();
    //    })
    //})



});