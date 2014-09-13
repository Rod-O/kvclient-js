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
"use strict"

var fs = require("fs");

describe('KVClient', function(){

    var assert = require("assert");
    var kvClient = require("../kvclient");
    var kvTypes = kvClient.Types;
    this.timeout(10000);

    describe('Put*', function() {

        var configuration = new kvClient.Configuration();
        var store  = kvClient.createStore(configuration);
        var file64 = new Buffer(fs.readFileSync(__dirname + '/image.jpg')).toString("base64");
        var fbin64 = new Buffer("1234567890").toString("base64");

        function Row() {
            this.id = 100;       this.s = "String value";
            this.l = 1234567890; this.d = 1234567890.12345678901234567890;
            this.bool = true;    this.bin = file64;
            this.fbin = fbin64;  this.f  = 1234567890.12345678901234567890;
            this.arrStr =  ["X", "Y", "Z"]; this.e = "A"; }
        var row = new Row();

        before(function(done){
            store.open(done);
        })
        this.timeout(100000); // debugging

        describe('Put', function(){
            it('Should do a simple Put', function(done) {
                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.SyncPolicy.SYNC);
                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                store.put('t2', row, writeOptions, done);
            })
            it('Should put with default Durability', function(done) {
                var writeOptions = new kvTypes.WriteOptions();
                writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
                writeOptions.timeout = 100;
                store.put('t2', row, writeOptions, done);

            })

            it('Will throw error with an empty Put', function(done) {
                var writeOptions = new kvTypes.WriteOptions();
                writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
                writeOptions.timeout = 100;
                var row =  null;
                store.put('t2', row, writeOptions, function(err){
                    done(assert.throws(err, function() {
                            if ( (err instanceof Error) && err.message) {
                                return true;
                            }
                        }
                    ));
                });
            })

            it('Will Put with all WriteOptions (108 combinations)', function(done) {
                var durability, writeOptions;
                var putCount=0;
                var errorFlag = false;
                for(var masterSync_KEY in kvTypes.ReplicaAckPolicy) {
                    for(var replicaSync_KEY in kvTypes.ReplicaAckPolicy) {
                        for (var replicaAck_KEY in kvTypes.SyncPolicy) {
                            durability = kvTypes.newDurability(
                                kvTypes.ReplicaAckPolicy[masterSync_KEY],
                                kvTypes.ReplicaAckPolicy[replicaSync_KEY],
                                kvTypes.SyncPolicy[replicaAck_KEY] );

                            for (var ReturnChoice_KEY in kvTypes.ReturnChoice) {
                                writeOptions = kvTypes.newWriteOptions(durability,
                                    kvTypes.ReturnChoice[ReturnChoice_KEY],
                                    1000)
                                row.id =  putCount;
                                store.put('t2', row, writeOptions, function(err, response){
                                    if (!errorFlag) {
                                        if (err) {
                                            errorFlag = true;
                                            done(err);
                                        }
                                        ++putCount;
                                        if ( putCount >= 108 ) {  // 108 Elements
                                            done();
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            })

        })

        describe('PutIfAbsent', function(){
            it('Simple putIfAbsent', function(done){
                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.SyncPolicy.SYNC);
                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                store.putIfAbsent('t2', row, writeOptions, done);
            })
        })

        describe('PutIfPresent', function(){
            it('Simple putIfPresent', function(done){
                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.ReplicaAckPolicy.ALL,
                    kvTypes.SyncPolicy.SYNC);
                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                store.putIfPresent('t2', row, writeOptions, done);
            })
        })

        describe('PutIfVersion', function(){
            it('Simple putIfVersion', function(done){
                var readOptions = Types.newReadOptions(kvTypes.Consistency.ABSOLUTE);
                var primaryKey = {id:100};
                store.get('t2', primaryKey, readOptions, function (err, response) {
                    if (typeof response !== "undefined") {
                        var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
                            kvTypes.ReplicaAckPolicy.ALL,
                            kvTypes.SyncPolicy.SYNC);
                        var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
                        store.putIfVersion('t2', row, response.currentRowVersion, writeOptions, done);
                    } else {
                        done(err);
                    }
                })
            })

        })

    })


})