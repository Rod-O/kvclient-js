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


    describe("Delete*", function () {

        var store = kvClient.createStore(configuration);
        var primaryKey = { id: 1 };
        var durability, writeOptions, row;

        before(function (done) {
            store.open(function (err) {
                function Row() {
                    this.id = 100;
                    this.s = "String value";
                    this.l = 1234567890;
                    this.d = 1234567890.12345678901234567890;
                    this.bool = true;
                    this.f = 1234567890.12345678901234567890;
                    this.arrStr = ["X", "Y", "Z"];
                    this.e = "A";
                }

                if (err) done(err); else {
                    durability =
                        new kvTypes.Durability(
                            kvTypes.SyncPolicy.SYNC,
                            kvTypes.ReplicaAckPolicy.ALL,
                            kvTypes.SyncPolicy.SYNC);
                    writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    row = new Row();
                    for (var id = 1; id < 100; id++) {
                        row.id = id;
                        store.putIfAbsent("t2", row, writeOptions, null);
                    }
                    done();
                }
            });
        });

        describe("DeleteRow", function () {
            it("Should DeleteRow", function (done) {
                var primaryKey = {id: 1};
                store.deleteRow("t2", primaryKey, writeOptions, function (err, result) {
                    assert.equal(true, result.wasDeleted);
                    done(err);
                });

            });
        });

        describe("deleteRowIfVersion", function () {
            it("Should deleteRowIfVersion", function (done) {
                row.id = 200;
                var primaryKey = {id: 200};
                store.put("t2", row, writeOptions, function (err, result) {
                    store.deleteRowIfVersion("t2", primaryKey, result.currentRowVersion, writeOptions, function (err, result) {
                        assert.equal(true, result.wasDeleted);
                        done(err);
                    });
                });
            });
        });

        describe("MultiDelete", function () {
            it("Should MultiDelete", function (done) {
                var primaryKey = {id: 2};
                store.multiDelete("t2", primaryKey, null, [], writeOptions, function (err, result) {
                    assert(result > 0);
                    done(err);
                });

            });
        });

    });

});