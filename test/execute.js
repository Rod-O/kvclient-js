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

    this.timeout(10000);

    function Row() {
        this.id = 100;
        this.s = "String value";
        this.l = 999999999999999;  // max js long precision
        this.f = 9.123456;         //float
        this.d = 9.12345678901234; //double
        this.bool = true;
        //this.bin = file64;
        //this.fbin = fbin64;
        this.arrStr = ["X", "Y", "Z"];
        this.e = "A";
    }

    var durability =
        new kvTypes.Durability(
            kvTypes.SyncPolicy.SYNC,
            kvTypes.ReplicaAckPolicy.ALL,
            kvTypes.SyncPolicy.SYNC);

    var writeOptions = new kvTypes.WriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);

    var row = new Row();
    var store = kvClient.createStore(configuration);

    before(function (done) {
        store.open(done);
    });

    describe("Execute", function() {

        it("should Execute Statement CREATE", function(done) {
            store.execute (
                " create table if not exists test1 ( id long, age integer, name string, primary key(id) ) ",
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    done();
                }
            );
        });

        it("should fail Execute Statement: CREATE", function(done) {
            store.execute (
                " create table test1 ( id long, age integer, name string, primary key(id) ) ",
                function(err, result){
                    kvErrors.assertTError(err, kvErrors.TIllegalArgumentException, "Error expected");
                    done();
                }
            );

        });


        it("should Execute Statement ALTER", function(done) {
            store.execute (
                " alter table test1 ( add avg float default 0 ) ",
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    done();
                }
            );
        });

        var planId = null;
        it("should Execute ASYNC Statement DROP ASYNC", function(done) {
            store.executeAsync (
                " drop table test1 ",
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    planId = result.planId;
                    done();
                }
            );
        });
        it("should Stop previous statement", function(done) {
            store.executeCancel (
                planId,
                true,
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    done();
                }
            );
        });
        it("should executeAsync Statement DROP ASYNC", function(done) {
            store.executeAsync (
                " drop table test1 ",
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    planId = result.planId;
                    done();
                }
            );
        });
        it("should executeTimeout in no time", function(done) {
            store.executeTimeout (
                planId,
                1,
                function(err, result){
                    kvErrors.assertTError(err, Errors.TTimeoutException, "TTimeoutException expected");
                    assert.equal(result, null, "No result expected");
                    done();
                }
            );
        });
        it("should receive the Status", function(done) {
            store.executeStatus (
                planId,
                function(err, result){
                    kvErrors.assertEqual(err, null, "No error expected");
                    assert(result!=null, "Result expected");
                    done();
                }
            );
        });

        it("should refreshTables", function(done) {
            store.refreshTables ( done );
        });

        it("should Execute Operation", function(done) {
            var operation = new kvTypes.Operation(
                "t2",
                kvTypes.OperationType.PUT,
                row,
                kvTypes.ReturnChoice.ALL,
                true,
                null);
            store.executeOperations(operation, writeOptions, function(err, result){
                kvErrors.assertEqual(err, null, "No error expected");
                assert(result!=null, "Result expected");
                done();
            });

        });

        it("should Execute multiple Operations", function(done) {
            var operation = new kvTypes.Operation(
                "t2",
                kvTypes.OperationType.PUT,
                row,
                kvTypes.ReturnChoice.ALL,
                true,
                null);
            var operations = [];
            operations.push(operation);
            operations.push(operation);
            operations.push(operation);
            store.executeOperations(operation, writeOptions, function(err, result){
                kvErrors.assertEqual(err, null, "No error expected");
                assert(result!=null, "Result expected");
                done();
            });
        });

    })



});