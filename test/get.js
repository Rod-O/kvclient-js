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
var ttypes = require("../lib/thrift/ondb_types");
var hex2dec = require("../lib/Hex2Dec");

describe("KVClient", function () {

    var file64 = new Buffer(fs.readFileSync(__dirname + "/image.jpg")).toString("base64");
    var fbin64 = new Buffer("1234567890").toString("base64");
    var configuration = new kvClient.Configuration();
    configuration.proxyConfiguration = kvClient.Proxy.readProxyConfiguration(__dirname + "/test-conf.json");

    this.timeout(5000);

    function Row() {
        this.id = 2147483647;  // max int
        this.s = "Special characters - áéíóú äëïöü ñÑ";
        this.l = new Int64("1111222233334444");  // using Int64 for big numbers
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


    describe("Get*", function () {
        var store = kvClient.createStore(configuration);
        var primaryKey = { id: 2147483647 };


        before(function (done) {
            store.open(function (err) {

                if (err) done(err); else {
                    var durability =
                        new kvTypes.Durability(
                            kvTypes.SyncPolicy.SYNC,
                            kvTypes.ReplicaAckPolicy.ALL,
                            kvTypes.SyncPolicy.SYNC);
                    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                    store.put("t2", row, writeOptions, done);
                }
            });
        });

        describe("Get", function () {

            it("Test return values", function (done) {
                store.get("t2", primaryKey, null, function (err, result) {
                    kvErrors.assertEqual(err, null, "Error getting row");
                    kvErrors.assertEqual(result.currentRow.s, row.s, "Incorrect String value");
                    if (result.currentRow.l instanceof Int64 && row.l instanceof Int64) {
                        kvErrors.assertEqual(
                            result.currentRow.l.toOctetString(),
                            row.l.toOctetString(),
                            "Incorrect Long value");
                    } else {
                        kvErrors.assertEqual(result.currentRow.l, row.l, "Incorrect Long value");
                    }
                    kvErrors.assertEqual(result.currentRow.f, row.f, "Incorrect Float value");
                    kvErrors.assertEqual(result.currentRow.d, row.d, "Incorrect Double value");
                    kvErrors.assertEqual(result.currentRow.bool, row.bool, "Incorrect Bool value");
                    kvErrors.assertEqual(result.currentRow.fbin, row.fbin, "Incorrect Fixed Binary value");
                    assert(kvErrors.compareArrays(result.currentRow.arrStr, row.arrStr), "Incorrect Array value")
                    kvErrors.assertEqual(result.currentRow.e, row.e, "Incorrect Enum value");
                    done();
                });
            })

            it("Get with Null Consistency", function (done) {
                store.get("t2", primaryKey, null, done);
            })

            it("Get with ABSOLUTE Consistency", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.get("t2", primaryKey, readOptions, done);
            })

            it("Get with NONE_REQUIRED Consistency", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.NONE_REQUIRED;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.get("t2", primaryKey, readOptions, done);
            })

            it("Get with NONE_REQUIRED_NO_MASTER Consistency", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.NONE_REQUIRED_NO_MASTER;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.get("t2", primaryKey, readOptions, function (err) {
                    done();
                });
            })

            it("Get binary field", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                store.get("t2", primaryKey, readOptions, function (err, result) {
                    assert(err == null, "Error getting binary field");
                    fs.writeFile(
                        __dirname + "/image-out.jpg",
                        new Buffer(result.currentRow.bin, "base64"), function (err) {
                            done(err);
                        });

                });
            })

        });

        describe("MultiGet", function () {
            it("Should MultiGet", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                var fieldRange = new kvTypes.FieldRange("id", "0", true, "200", true);
                store.multiGet("t2", primaryKey, null, [], readOptions, function (err, result) {
                    done(err);
                });

            });
        });

        describe("MultiGetKeys", function () {
            it("Should MultiGetKeys", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                var fieldRange = new kvTypes.FieldRange("id", "0", true, "200", true);
                store.multiGetKeys("t2", primaryKey, null, [], readOptions, function (err, result) {
                    done(err);
                });

            });
        });

        describe("MultiDelete", function () {
            it("Should MultiDelete", function (done) {
                var consistency = new kvTypes.Consistency();
                consistency.simple = kvTypes.SimpleConsistency.ABSOLUTE;
                var readOptions = new kvTypes.ReadOptions(consistency, 1000);
                var fieldRange = new kvTypes.FieldRange("id", "0", true, "200", true);
                store.multiDelete("t2", primaryKey, null, [], readOptions, function (err, result) {
                    done(err);
                });

            });
        });

    });



});
