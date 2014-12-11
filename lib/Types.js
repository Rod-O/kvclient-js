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
/*global util*/
/*global exports*/

var ttypes = require('./thrift/ondb_types');

/**
 * A replicated environment makes it possible to increase an application's transaction commit guarantees by
 * committing changes to its replicas on the network. ReplicaAckPolicy defines the policy for how such network
 * commits are handled.
 * @property {number} ALL All replicas must acknowledge that they have committed the transaction.
 * @property {number} NONE No transaction commit acknowledgments are required and the master will never wait
 * for replica acknowledgments.
 * @property {number} SIMPLE_MAJORITY A simple majority of replicas must acknowledge that they have committed
 * the transaction.
 * @enum {number}
 */
exports.ReplicaAckPolicy = ttypes.TReplicaAckPolicy;

/**
 * Defines the synchronization policy to be used when committing a transaction. High levels of synchronization
 * offer a greater guarantee that the transaction is persistent to disk, but trade that off for lower performance.
 * @property {number} NO_SYNC Do not write or synchronously flush the log on transaction commit.
 * @property {number} SYNC Write and synchronously flush the log on transaction commit.
 * @property {number} WRITE_NO_SYNC Write but do not synchronously flush the log on transaction commit.
 * @enum {number}
 */
exports.SyncPolicy = ttypes.TSyncPolicy;

/**
 * Used to provide consistency guarantees for read operations.
 * In general, read operations may be serviced either at a Master or Replica node. When serviced at the Master node,
 * consistency is always absolute. If absolute consistency is required, ABSOLUTE may be specified to force the
 * operation to be serviced at the Master. For other types of consistency, when the operation is serviced at a
 * Replica node, the transaction will not begin until the consistency policy is satisfied.
 * The Consistency is specified as an argument to all read operations, for example, get.
 * @property {number} ABSOLUTE A consistency policy that requires that a transaction be serviced on the Master so that
 * consistency is absolute.
 * @property {number} NONE_REQUIRED A consistency policy that lets a transaction on a replica using this policy
 * proceed regardless of the state of the Replica relative to the Master.
 * @property {number} NONE_REQUIRED_NO_MASTER A consistency policy that requires that a read operation be serviced on
 * a replica; never the Master.
 * @enum {number}
 */
exports.SimpleConsistency = ttypes.TSimpleConsistency;

exports.TimeConsistency = ttypes.TTimeConsistency;

exports.VersionConsistency = ttypes.TVersionConsistency;

exports.Consistency = ttypes.TConsistency;

/**
 * ReadOptions is passed to read-only store operations to specify arguments that control non-default
 * behavior related to consistency and operation timeouts.
 * @property {Consistency} consistency Used to provide consistency guarantees for read operations
 * @property {Number} timeoutMs Is the upper bound on the time interval for processing the operation
 * @param {Consistency} consistency the consistency to be used
 * @param {Number} timeoutMs the timeout to be used
 * @constructor
 * @returns {ReadOptions}
 */
function ReadOptions ( /*Consistency*/ consistency,
                       /*Number*/ timeoutMs) {
    ttypes.TReadOptions.call(this);
    this.consistency = consistency;
    this.timeoutMs   = timeoutMs;
}
util.inherits(ReadOptions, ttypes.TReadOptions);
exports.ReadOptions = ReadOptions;

/**
 * Defines the durability characteristics associated with a standalone write (put or update) operation, or in the case
 * of KVStore.execute with a set of operations performed in a single transaction.
 * The overall durability is a function of the SyncPolicy and ReplicaAckPolicy in effect for
 * the Master, and the Durability.SyncPolicy in effect for each Replica.
 * @property {SyncPolicy} masterSync The transaction synchronization policy to be used on the Master when
 * committing a transaction.
 * @property {ReplicaAckPolicy} replicaAck The replica acknowledgment policy used by the master when committing
 * changes to a replicated environment.
 * @property {SyncPolicy} replicaSync The transaction synchronization policy to be used by the replica as it replays
 * a transaction that needs an acknowledgment.
 * @param {SyncPolicy} masterSync The transaction synchronization policy to be used on the Master when
 * committing a transaction.
 * @param {ReplicaAckPolicy} replicaAck The transaction synchronization policy to be used by the replica as it replays
 * a transaction that needs an acknowledgment.
 * @param {SyncPolicy} replicaSync The replica acknowledgment policy used by the master when committing
 * changes to a replicated environment.
 * @returns {Durability}
 * @constructor
 */
function Durability ( /*SyncPolicy*/ masterSync,
                      /*ReplicaAckPolicy*/ replicaAck,
                      /*SyncPolicy*/ replicaSync) {
    ttypes.TDurability.call(this);
    this.masterSync  = masterSync;
    this.replicaAck  = replicaAck;
    this.replicaSync = replicaSync;
}
util.inherits(Durability, ttypes.TDurability);
exports.Durability = Durability;

/**
 * Specifies whether to return the row value, version, both or neither.
 * For best performance, it is important to choose only the properties that are required.
 * The store is optimized to avoid I/O when the requested properties are in cache.
 * @property {number} ALL Return both the value and the version.
 * @property {number} NONE Do not return the value or the version.
 * @property {number} VALUE Return the value only.
 * @property {number} VERSION Return the version only.
 * @enum {number}
 */
exports.ReturnChoice = ttypes.TReturnChoice;


/**
 * WriteOptions is passed to store operations that can update the store to specify non-default behavior relating
 * to operation durability and timeouts.
 * @property {Durability} durability Defines the durability characteristics associated with a standalone
 * write (put or update) operation
 * @property {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @property {Number} timeoutMs The upper bound on the time interval for processing the operation.
 * @param {Durability} durability Defines the durability characteristics associated with a standalone write
 * (put or update) operation
 * @param {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @param {Number} timeoutMs The upper bound on the time interval for processing the operation.
 * @returns {WriteOptions}
 * @constructor
 */

function WriteOptions( /*Durability*/ durability,
                       /*ReturnChoice*/ returnChoice,
                       /*Number*/ timeoutMs){
    ttypes.TWriteOptions.call(this);
    this.durability     = durability;
    this.returnChoice   = returnChoice;
    this.timeoutMs      = timeoutMs;
}
util.inherits(WriteOptions, ttypes.TWriteOptions);
exports.WriteOptions = WriteOptions;

/**
 * FieldRange defines a range of values to be used in a table or index iteration or multiGet operation.
 * A FieldRange is used as the least significant component in a partially specified PrimaryKey or IndexKey in order
 * to create a value range for an operation that returns multiple rows or keys. The data types supported by FieldRange
 * are limited to those which are valid for primary keys and/or index keys.
 * @param {String} fieldName The name for the field used in the range.
 * @param {Object} startValue
 * @param {bool} startIsInclusive
 * @param {Object} endValue
 * @param {bool} endIsInclusive
 * @property {String} fieldName The name for the field used in the range.
 * @property {Object} startValue
 * @property {bool} startIsInclusive
 * @property {Object} endValue
 * @property {bool} endIsInclusive
 * @returns {FieldRange}
 * @constructor
 */
function FieldRange ( /*String*/ fieldName,
                      /*Object*/ startValue,
                      /*bool*/ startIsInclusive,
                      /*Object*/ endValue,
                      /*bool*/ endIsInclusive) {
    ttypes.TFieldRange.call(this);
    this.fieldName         = fieldName;
    this.startValue        = startValue;
    this.startIsInclusive  = startIsInclusive;
    this.endValue          = endValue;
    this.endIsInclusive    = endIsInclusive;
}
util.inherits(FieldRange, ttypes.TFieldRange);
exports.FieldRange = FieldRange;


/**
 * Structure to verify a connection to a KV Server
 * @param {String} kvStoreName must match the store name of the KVProxy server
 * @param {Array} kvStoreHelperHosts list must have at least one entry and all entries
 * must be contained in the list that the server was started with.
 * @param {String} username the security username, required for secured stores
 * @property {String} kvStoreName must match the store name of the KVProxy server
 * @property {Array} kvStoreHelperHosts list must have at least one entry and all entries
 * must be contained in the list that the server was started with.
 * @property {String} username the security username, required for secured stores
 * @constructor
 */
function VerifyProperties (/*String*/ kvStoreName,
                           /*Array*/ kvStoreHelperHosts,
                           /*String*/ username) {
    ttypes.TVerifyProperties.call(this);
    this.kvStoreName = kvStoreName;
    this.kvStoreHelperHosts = typeof kvStoreHelperHosts === 'string' ?
        [kvStoreHelperHosts] :
        kvStoreHelperHosts;
    this.username = username;

    //verify.kvStoreReadZones = typeof proxyConf.readZones === 'string' ?
    //    [proxyConf.readZones] :
    //    proxyConf.readZones;
    //verify.kvStoreRequestTimeoutMs = proxyConf.requestTimeout;
    //todo: fix security properties
//    verify.kvStoreSecurityProperties  = typeof this.kvConfiguration.securityProperties === 'object' ?
//                                        this.kvConfiguration.securityProperties : {};
//        verify.kvStoreSocketOpenTimeoutMs = proxyConf.socketOpenTimeout;
//        verify.kvStoreSocketReadTimeoutMs = proxyConf.socketReadTimeout;

}
util.inherits(VerifyProperties, ttypes.TVerifyProperties);
exports.VerifyProperties = VerifyProperties;

exports.Direction = ttypes.TDirection;

exports.OperationType = ttypes.TOperationType;

/**
 * Defines an update operation to be passed to Store.executeOperations().
 * @param {String} tableName The table name on which this operation is executed on.
 * @param {OperationType} type Determines which update operation to be executed.
 * @param {Row} row For put operations: represents the row to be stored.
 * For delete operations: represents the key of the row to be deleted.
 * @param {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @param {Bool} abortIfUnsuccessful True if this operation should cause the execute transaction to abort
 * when the operation fails, where failure is the condition when the
 * delete or put method returns null.
 * @param {Version} matchVersion The version to be matched for: putIfVersion and deleteIfVersion.
 * @property {String} tableName The table name on which this operation is executed on.
 * @property {OperationType} type Determines which update operation to be executed.
 * @property {Row} row For put operations: represents the row to be stored.
 * For delete operations: represents the key of the row to be deleted.
 * @property {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @property {Bool} abortIfUnsuccessful True if this operation should cause the execute transaction to abort
 * when the operation fails, where failure is the condition when the
 * delete or put method returns null.
 * @property {Version} matchVersion The version to be matched for: putIfVersion and deleteIfVersion.
 * @constructor
 */

function Operation ( /*String*/ tableName,
                     /*OperationType*/ type,
                     /*Row*/ row,
                     /*ReturnChoice*/ returnChoice,
                     /*Bool*/ abortIfUnsuccessful,
                     /*Version*/ matchVersion ){
    ttypes.TOperation.call(this);
    this.tableName = tableName;
    this.type = type;
    this.row = new ttypes.TRow({ jsonRow: JSON.stringify(row) });
    this.returnChoice = returnChoice;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
    this.matchVersion = matchVersion;
}
util.inherits(Operation, ttypes.TOperation);
exports.Operation = Operation;
