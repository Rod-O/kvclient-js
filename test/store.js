///*-
// *
// *  This file is part of Oracle NoSQL Database
// *  Copyright (C) 2011, 2014 Oracle and/or its affiliates.  All rights reserved.
// *
// * If you have received this file as part of Oracle NoSQL Database the
// * following applies to the work as a whole:
// *
// *   Oracle NoSQL Database server software is free software: you can
// *   redistribute it and/or modify it under the terms of the GNU Affero
// *   General Public License as published by the Free Software Foundation,
// *   version 3.
// *
// *   Oracle NoSQL Database is distributed in the hope that it will be useful,
// *   but WITHOUT ANY WARRANTY; without even the implied warranty of
// *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// *   Affero General Public License for more details.
// *
// * If you have received this file as part of Oracle NoSQL Database Client or
// * distributed separately the following applies:
// *
// *   Oracle NoSQL Database client software is free software: you can
// *   redistribute it and/or modify it under the terms of the Apache License
// *   as published by the Apache Software Foundation, version 2.0.
// *
// * You should have received a copy of the GNU Affero General Public License
// * and/or the Apache License in the LICENSE file along with Oracle NoSQL
// * Database client or server distribution.  If not, see
// * <http://www.gnu.org/licenses/>
// * or
// * <http://www.apache.org/licenses/LICENSE-2.0>.
// *
// * An active Oracle commercial licensing agreement for this product supersedes
// * these licenses and in such case the license notices, but not the copyright
// * notice, may be removed by you in connection with your distribution that is
// * in accordance with the commercial licensing terms.
// *
// * For more information please contact:
// *
// * berkeleydb-info_us@oracle.com
// *
// */
//"use strict"
//
//describe('KVClient', function(){
//
//    var assert = require("assert");
//    var kvClient = require("../kvclient");
//    var kvTypes = kvClient.Types;
//    this.timeout(100000);
////    describe('Connection', function(){
////        it('should return error trying to connect to nowhere', function(done) {
////            var configuration = new kvClient.Configuration();
////            configuration.helperHosts = 'no.where:999';
////            var store = kvClient.createStore(configuration);
////            store.open();
////            store.on('error', function (err){
////                store.close();
////                done();
////            }).on('connect', function () {
////                done(new Error("An instance of a proxy is running, can't run this test"));
////            })
////        })
////
////        it('should return error trying to connect to a non existing proxy', function(done) {
////            this.timeout(25000);
////            var configuration = new kvClient.Configuration();
////            configuration.startLocalProxy = false;
////            configuration.proxyHost = 'no.where:999';
////            var store = kvClient.createStore(configuration);
////            store.open();
////            store.on('error', function (err){
////                store.close();
////                done();
////            })
////        })
////
////        it('should start and connect to a local proxy', function(done) {
////            var configuration = new kvClient.Configuration();
////            var store = kvClient.createStore(configuration);
////            store.open(function (err) {
////                store.close();
////                done(err);
////            })
////        })
////
////    })
//
//    describe('Put/Get', function() {
//
//        var configuration = new kvClient.Configuration();
//        var store = kvClient.createStore(configuration);
//        before(function(done){
//            store.open(done);
//        })
//        this.timeout(100000); // debugging
//        describe('Put', function(){
//
//            it('Simple Put', function(done) {
//                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.SyncPolicy.SYNC);
//                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
//                var row =  {"uid":"123", "surname":"User123"};
//                store.put('table', row, writeOptions, done);
//            })
//
//            it('Put with default Durability', function(done) {
//                var writeOptions = new kvTypes.WriteOptions();
//                writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
//                writeOptions.timeout = 100;
//                var row =  {"uid":"123", "surname":"User123"};
//                store.put('table', row, writeOptions, done);
//
//            })
//
//            it('empty Put', function(done) {
//                var writeOptions = new kvTypes.WriteOptions();
//                writeOptions.returnChoice = kvTypes.ReturnChoice.ALL;
//                writeOptions.timeout = 100;
//                var row =  null;
//                store.put('table', row, writeOptions, function(err){
//                    done(assert.throws(err, function() {
//                            if ( (err instanceof Error) && err.message) {
//                                return true;
//                            }
//                        }
//                    ));
//                });
//            })
//            it('Put with all WriteOptions (108 combinations)', function(done) {
//                var durability, writeOptions;
//                var userid = 0, row, putCount=0;
//                var errorFlag = false;
//                for(var masterSync_KEY in kvTypes.ReplicaAckPolicy) {
//                    for(var replicaSync_KEY in kvTypes.ReplicaAckPolicy) {
//                        for (var replicaAck_KEY in kvTypes.SyncPolicy) {
//                            durability = kvTypes.newDurability(
//                                kvTypes.ReplicaAckPolicy[masterSync_KEY],
//                                kvTypes.ReplicaAckPolicy[replicaSync_KEY],
//                                kvTypes.SyncPolicy[replicaAck_KEY] );
//
//                            for (var ReturnChoice_KEY in kvTypes.ReturnChoice) {
//                                writeOptions = kvTypes.newWriteOptions(durability,
//                                    kvTypes.ReturnChoice[ReturnChoice_KEY],
//                                    1000)
//                                userid++;
//                                row =  {"uid":""+userid, "surname":"User"+userid};
//                                store.put('table', row, writeOptions, function(err, response){
//                                    if (!errorFlag) {
//                                        if (err) {
//                                            errorFlag = true;
//                                            done(err);
//                                        }
//                                        ++putCount;
//                                        if ( putCount >= 108 ) {  // 108 Elements
//                                            done();
//                                        }
//                                    }
//                                });
//                            }
//                        }
//                    }
//                }
//            })
//        })
//
//        describe('PutIfAbsent', function(){
//            it('Simple putIfAbsent', function(done){
//                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.SyncPolicy.SYNC);
//                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
//                var row =  {"uid":"123", "surname":"User123"};
//                store.putIfAbsent('table', row, writeOptions, done);
//            })
//        })
//
//        describe('PutIfPresent', function(){
//            it('Simple putIfPresent', function(done){
//                var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.ReplicaAckPolicy.ALL,
//                    kvTypes.SyncPolicy.SYNC);
//                var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
//                var row =  {"uid":"123", "surname":"User123"};
//                store.putIfPresent('table', row, writeOptions, done);
//            })
//        })
//
//        describe('PutIfVersion', function(){
//            it('Simple putIfVersion', function(done){
//                var readOptions = Types.newReadOptions(kvTypes.Consistency.ABSOLUTE);
//                var primaryKey = {"uid":"777"};
//                store.get('table', primaryKey, readOptions, function (err, response) {
//                    if (response) {
//                        var durability = kvTypes.newDurability(kvTypes.ReplicaAckPolicy.ALL,
//                            kvTypes.ReplicaAckPolicy.ALL,
//                            kvTypes.SyncPolicy.SYNC);
//                        var writeOptions = kvTypes.newWriteOptions(durability, kvTypes.ReturnChoice.ALL, 1000);
//                        var row = {"uid": "777", "surname": "User123"};
//                        store.putIfVersion('table', row, response.version, writeOptions, function(err, response){
//                            done(err);
//                        });
//                    } else {
//                        done(err);
//                    }
//                })
//            })
//
//        })
//
//        describe('Get', function(){
//            it('Get with ABSOLUTE Consistency', function(done){
//                var readOptions = Types.newReadOptions(kvTypes.Consistency.ABSOLUTE, 1000);
//                var primaryKey = {"uid":"777"};
//                store.get('table', primaryKey, readOptions, function (err, response) {
//                    done(err);
//                })
//            })
//            it('Get with NONE_REQUIRED Consistency', function(done){
//                var readOptions = Types.newReadOptions(kvTypes.Consistency.NONE_REQUIRED, 1000);
//                var primaryKey = {"uid":"777"};
//                store.get('table', primaryKey, readOptions, function (err, response) {
//                    done(err);
//                })
//            })
//            it('Get with NONE_REQUIRED_NO_MASTER Consistency', function(done){
//                var readOptions = Types.newReadOptions(kvTypes.Consistency.NONE_REQUIRED_NO_MASTER, 1000);
//                var primaryKey = {"uid":"777"};
//                store.get('table', primaryKey, readOptions, function (err, response) {
//                    if (err){
//                        done();
//                    } else {
//                        done(new Error('Error expected for kvlite'));
//                    }
//
//                })
//            })
//
//
//        })
//
//    })
//
//
//});
