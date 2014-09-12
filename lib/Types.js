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

/*global ttypes*/
/*global kvLogger*/
/*global Errors*/

var ttypes = require('./thrift/ondb_types');

"use strict"

/**
 * Object to define the security properties to be used,
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
    this.SECURITY_FILE = null;
    this.TRANSPORT = null;
    this.SSL_TRANSPORT_NAME = null;
    this.SSL_CIPHER_SUITES = null;
    this.SSL_PROTOCOLS = null;
    this.SSL_HOSTNAME_VERIFIER = null;
    this.SSL_TRUSTSTORE_FILE = null;
    this.SSL_TRUSTSTORE_TYPE = null;
    this.AUTH_USERNAME = null;
    this.AUTH_WALLET = null;
    this.AUTH_PWDFILE = null;
}
exports.SecurityProperties = SecurityProperties;

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
exports.Consistency = ttypes.TConsistency;

/**
 * One step ReadOptions constructor.
 * @param {Consistency} consistency the consistency to be used
 * @param {Number} timeout the timeout to be used
 * @returns {ReadOptions}
 */
exports.newReadOptions = function newReadOptions ( /*Consistency*/ consistency,
                                                   /*Number*/ timeout) {
    var ReadOptions          = new ttypes.TReadOptions();
    ReadOptions.consistency  = consistency;
    ReadOptions.timeout      = timeout;
    return ReadOptions;
}
/**
 * ReadOptions is passed to read-only store operations to specify arguments that control non-default
 * behavior related to consistency and operation timeouts.
 * @property {Consistency} consistency Used to provide consistency guarantees for read operations
 * @property {number} timeoutMs Is the upper bound on the time interval for processing the operation
 * @returns {ReadOptions}
 * @constructor
 */
exports.ReadOptions = ttypes.TReadOptions;

/**
 * One step Durability constructor.
 * @param {ReplicaAckPolicy} masterSync The transaction synchronization policy to be used on the Master when
 * committing a transaction.
 * @param {ReplicaAckPolicy} replicaSync The replica acknowledgment policy used by the master when committing
 * changes to a replicated environment.
 * @param {SyncPolicy} replicaAck The transaction synchronization policy to be used by the replica as it replays
 * a transaction that needs an acknowledgment.
 * @returns {Durability}
 */
exports.newDurability = function newDurability (/*ReplicaAckPolicy*/ masterSync,
                                                /*ReplicaAckPolicy*/ replicaSync,
                                                /*SyncPolicy*/ replicaAck) {
    var Durability          = new ttypes.TDurability();
    Durability.masterSync   = masterSync;
    Durability.replicaSync  = replicaSync;
    Durability.replicaAck   = replicaAck;
    return Durability;
}

/**
 * Defines the durability characteristics associated with a standalone write (put or update) operation, or in the case
 * of KVStore.execute with a set of operations performed in a single transaction.
 * The overall durability is a function of the SyncPolicy and ReplicaAckPolicy in effect for
 * the Master, and the Durability.SyncPolicy in effect for each Replica.
 * @property {ReplicaAckPolicy} masterSync The transaction synchronization policy to be used on the Master when
 * committing a transaction.
 * @property {ReplicaAckPolicy} replicaAck The replica acknowledgment policy used by the master when committing
 * changes to a replicated environment.
 * @property {SyncPolicy} replicaSync The transaction synchronization policy to be used by the replica as it replays
 * a transaction that needs an acknowledgment.
 * @returns {Durability}
 * @constructor
 */
exports.Durability = ttypes.TDurability;

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
 * One step WriteOptions constructor
 * @param {Durability} durability Defines the durability characteristics associated with a standalone write
 * (put or update) operation
 * @param {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @param {Number} timeoutMs The upper bound on the time interval for processing the operation.
 * @returns {WriteOptions}
 */
exports.newWriteOptions = function newWriteOptions(/*Durability*/ durability,
                                                   /*ReturnChoice*/ returnChoice,
                                                   /*Number*/ timeoutMs){
    var WriteOptions            = new ttypes.TWriteOptions();
    WriteOptions.durability     = durability;
    WriteOptions.returnChoice   = returnChoice;
    WriteOptions.timeoutMs      = timeoutMs;
    return WriteOptions;
}

/**
 * WriteOptions is passed to store operations that can update the store to specify non-default behavior relating
 * to operation durability and timeouts.
 * @property {Durability} durability Defines the durability characteristics associated with a standalone
 * write (put or update) operation
 * @property {ReturnChoice} returnChoice Specifies whether to return the row value, version, both or neither.
 * @property {Number} timeoutMs The upper bound on the time interval for processing the operation.
 * @returns {WriteOptions}
 * @constructor
 */
exports.WriteOptions = ttypes.TWriteOptions;

/**
 * One step FieldRange constructor
 * @property {String} fieldName The name for the field used in the range.
 * @property {Object} startValue
 * @property {bool} startIsInclusive
 * @property {Object} endValue
 * @property {bool} endIsInclusive
 * @returns {FieldRange}
 */
exports.newFieldRange = function newFieldRange (/*String*/ fieldName,
                                                /*Object*/ startValue,
                                                /*bool*/ startIsInclusive,
                                                /*Object*/ endValue,
                                                /*bool*/ endIsInclusive) {
    var FieldRange               = new ttypes.TFieldRange();
    FieldRange.fieldName         = fieldName;
    FieldRange.startValue        = startValue;
    FieldRange.startIsInclusive  = startIsInclusive;
    FieldRange.endValue          = endValue;
    FieldRange.endIsInclusive    = endIsInclusive;
    return FieldRange;
}

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
 * @returns {FieldRange}
 */
exports.FieldRange = ttypes.TFieldRange;



///**
// * By default only matching records from the target table are returned or deleted. MultiRowOptions can be used to
// * specify whether the operation should affect (return or delete) records from ancestor and/or descendant tables
// * for matching records. In addition MultiRowOptions can be used to specify sub-ranges within a table or index
// * for all operations it supports using FieldRange.
// * When results from multiple tables are returned they are always returned with results from ancestor tables
// * first even if the iteration is in reverse order or unordered. In this case results from multiple tables
// * are mixed. Because an index iteration can result in multiple index entries matching the same primary record
// * it is possible to get duplicate return values for those records as well as specified ancestor tables.
// * It is not valid to specify child tables for index operations. It is up to the caller to handle duplicates
// * and filter results from multiple tables.
// * @property {FieldRange} fieldRange The FieldRange to be used to restrict the range of the operation.
// * @property {Array} includeChildTables The list of child tables to be included in an operation that returns
// * multiple rows or keys.
// * @property {Array} includedParentTables The list of ancestor tables to be included in an operation that returns
// * multiple rows or keys.
// * @returns {MultiRowOptions}
// */
//exports.MultiRowOptions = function MultiRowOptions ( args ) {
//    this.fieldRange             = null;
//    this.includedChildTables    = null;
//    this.includedParentTables   = null;
//    if (args) {
//        if (args.fieldRange !== undefined) {
//            this.fieldRange = args.fieldRange;
//        }
//        if (args.includedChildTables !== undefined) {
//            this.includedChildTables = args.includedChildTables;
//        }
//        if (args.includedParentTables !== undefined) {
//            this.includedParentTables = args.includedParentTables;
//        }
//    }
//}
//
///**
// * One step MultiRowOptions constructor
// * @param {FieldRange} fieldRange The FieldRange to be used to restrict the range of the operation.
// * @param {Array} includeChildTables The list of child tables to be included in an operation that returns
// * multiple rows or keys.
// * @param {Array} includedParentTables The list of ancestor tables to be included in an operation that returns
// * multiple rows or keys.
// * @returns {MultiRowOptions}
// */
//exports.newMultiRowOptions = function newMultiRowOptions ( /*FieldRange*/ fieldRange,
//                                                           /*Array*/ includeChildTables,
//                                                           /*Array*/ includedParentTables) {
//    var MultiRowOptions = new MultiRowOptions();
//    this.fieldRange             = fieldRange;
//    this.includedChildTables    = includeChildTables;
//    this.includedParentTables   = includedParentTables;
//}



exports.VerifyProperties = ttypes.TVerifyProperties;