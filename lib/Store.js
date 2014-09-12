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
/*global LOG_LEVELS*/
/*global proxyConfiguration*/

"use strict"

var EventEmitter    = require('events').EventEmitter;
var Proxy           = require('./Proxy');
var ONDBClient      = require('./thrift/ONDB');
var ttypes          = require('./thrift/ondb_types');

module.exports = Store;

util.inherits(Store, EventEmitter);
/**
 * Store constructor
 * @param {Configuration} configuration configuration object
 * @constructor
 */
function Store (/*Configuration*/ configuration) {
    EventEmitter.call(this);
    kvLogger.info('New Store instance');
    this.kvClient        = null;
    this.kvConnected     = false;
    this.kvConnection    = null;
    this.kvConfiguration = configuration;
}

Store.prototype._setClient = function _setClient (callback) {
    var that=this;
    kvLogger.debug('Set kvClient to Proxy: ' + proxyConfiguration.proxyHost);
    var colon = proxyConfiguration.proxyHost.indexOf(':');
    var host = proxyConfiguration.proxyHost.substr(0, colon);
    var port = proxyConfiguration.proxyHost.substr(colon+1);
    this.kvConnection = thrift.createConnection(host, port, {
        transport: thrift.TFramedTransport,
        protocol: thrift.TBinaryProtocol
    }).on('error', function(err) {
        kvLogger.debug('Error on thrift Connection' + err);
        if (callback) callback(err);
        that.kvConnection.removeAllListeners('error');
        that.kvConnection.removeAllListeners('connect');
    }).on('connect', function(err){
        kvLogger.debug('Thrift Connection successful');
        that.kvClient = thrift.createClient(ONDBClient, that.kvConnection);
        if (callback) callback();
        that.kvConnection.removeAllListeners('error');
        that.kvConnection.removeAllListeners('connect');
    });
}


Store.prototype._verify = function _verify (callback) {
    var that = this;

    kvLogger.debug('Starting verify process');
    var verify = new Types.VerifyProperties();
    verify.kvStoreName                = this.kvConfiguration.storeName;
    verify.kvStoreHelperHosts         = typeof this.kvConfiguration.helperHosts === 'string' ?
                                        [this.kvConfiguration.helperHosts] :
                                        this.kvConfiguration.helperHosts;
    verify.kvStoreReadZones           = typeof this.kvConfiguration.readZones === 'string' ?
                                        [this.kvConfiguration.readZones] :
                                        this.kvConfiguration.readZones;
    verify.kvStoreRequestTimeoutMs    = this.kvConfiguration.requestTimeout;
//    verify.kvStoreSecurityProperties  = typeof this.kvConfiguration.securityProperties === 'object' ?
//                                        this.kvConfiguration.securityProperties : {};
    verify.kvStoreSocketOpenTimeoutMs = this.kvConfiguration.socketOpenTimeout;
    verify.kvStoreSocketReadTimeoutMs = this.kvConfiguration.socketReadTimeout;

    this.kvClient.verify(verify, function(err) {
        if (callback) {
            if (err) callback(new Error(err));
            else callback();
            callback= null;
        }
        clearTimeout(timeout);
    });
    var timeout = setTimeout( function(){ if(callback) callback(new Error(Errors.PROXY_TIMEOUT)) }, 1000);
}

/**
 * This methods opens a connection to a kvstore server, it tries to start a thrift proxy if this is not specified
 * on configuration options. This process also calls the 'open' event in the listener protocol or 'error' if an error
 * occurs during opening.
 * @param {function} callback calls this function when the process finishes, will return an error object
 * if the opening process fail.
 * @method
 */
Store.prototype.open = function open(/*function*/ callback, attempt) {
    var that = this;
    that.callback = callback;
    kvLogger.info('Store open');
    if (typeof attempt === 'undefined') attempt = 1; else attempt++;

    if (that.kvConnected) {
        kvLogger.error(Errors.ALREADY_CONNECTED)
        if (that.callback) that.callback(new Error( Errors.ALREADY_CONNECTED )); that.callback = null;
        that.emit('error', new Error( Errors.ALREADY_CONNECTED ));
        return;
    }
    if ( attempt > proxyConfiguration.connectionAttempts ) {
        kvLogger.error(Errors.CONNECTION_ATTEMPTS)
        if (that.callback) that.callback(new Error( Errors.CONNECTION_ATTEMPTS )); that.callback = null;
        that.emit('error', new Error( Errors.CONNECTION_ATTEMPTS ));
        return;
    }
    kvLogger.debug('Attempt to open: ' + attempt);

    kvLogger.info('Setting client');
    that._setClient( function(err) {
        if (err) {
            if (proxyConfiguration.startLocalProxy)
                Proxy.startProxy(function(err){
                    that.open(callback, attempt);
                    return;
                });
            else {
                kvLogger.error(Errors.PROXY_CONNECTION_ERROR);
                if (callback) callback(new Error( Errors.PROXY_CONNECTION_ERROR )); callback = null;
                that.emit('error', new Error( Errors.PROXY_CONNECTION_ERROR ));
            }
            return;
        } else {
            that._verify(function(err) { // verify failed
                if (err) {
                    if (proxyConfiguration.startLocalProxy)
                        Proxy.startProxy(function(err){
                            that.open(callback, attempt);
                            return;
                        });
                    else {
                        kvLogger.error(Errors.PROXY_VERIFY_ERROR);
                        if (callback) callback(new Error( Errors.PROXY_VERIFY_ERROR )); callback = null;
                        that.emit('error', new Error( Errors.PROXY_VERIFY_ERROR ));
                    }
                    return;
                } else {
                    kvLogger.debug('Store connected to proxy')
                    that.kvConnected = true;
                    if (callback) callback(); callback = null;
                    that.emit('open');
                }
            });
        }
    });
}

/**
 * Closes the connection. If a proxy was started, this method will shutdown it.
 */
Store.prototype.close = function () {
    kvLogger.info('Store close');
    if (this.kvConnected) {
        this.kvConnection.end();
        this.kvConnected = false;
        this.emit('close');
    }
}

/**
 * Gets the Row associated with the primary key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {ReadOptions} readOptions non-default options for the operation or null to get default behavior.
 * @param {function} callback a function that is called when the process finish.
 *
 */
Store.prototype.get = function (/*String*/ table,
                                /*Object*/ primaryKey,
                                /*ReadOptions*/ readOptions,
                                /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    this.kvClient.get(table, _primaryKey, readOptions, function(err, response) {
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                    kvLogger.debug('Return from put with err:' + err);
        if (err)      err = new Error(err);  // return an Error object
        if (response) response.currentRow = JSON.parse(response.currentRow.jsonRow);
        if (callback) callback(err, response);
    });
}

/**
 * Returns the rows associated with a partial primary key in an atomic manner. Rows are returned in primary key order.
 * The key used must ontain all of the fields defined for the table's shard key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {ReadOptions} readOptions non-default options for the operation or null to get default behavior.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.multiGet = function (/*String*/ table,
                                     /*Object*/ primaryKey,
                                     /*FieldRange*/ fieldRange,
                                     /*Array*/ includedTables,
                                     /*ReadOptions*/ readOptions,
                                     /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    this.kvClient.multiGet(table, _primaryKey, fieldRange, includedTables, readOptions, function(err, response){
        if (err)    err = new Error(err);  // return an Error object
        if (response) {
            for(var index = 0; index<=response.rowsWithMetadata.length; index++)
                response.rowsWithMetadata[index].currentRow = JSON.parse(response.rowsWithMetadata[index].currentRow.jsonRow);
        }
        if (callback)   callback(err, response);
    });

}

/**
 * Return the rows associated with a partial primary key in an atomic manner. Keys are returned in primary key order.
 * The key used must contain all of the fields defined for the table's shard key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * the primaryKey parameter is always included as a target.
 * @param {ReadOptions} readOptions non-default options for the operation or null to get default behavior.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.multiGetKeys = function (/*String*/ table,
                                         /*Object*/ primaryKey,
                                         /*FieldRange*/ fieldRange,
                                         /*Array*/ includedTables,
                                         /*ReadOptions*/ readOptions,
                                         /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    this.kvClient.multiGetKeys(table, _primaryKey, fieldRange, includedTables, readOptions, function(err, response){
        if (err)    err = new Error(err);  // return an Error object
        if (response) {
            for(var index = 0; index<=response.rowsWithMetadata.length; index++)
                response.rowsWithMetadata[index].currentRow = JSON.parse(response.rowsWithMetadata[index].currentRow.jsonRow);
        }
        if (callback)   callback(err, response);
    });
};

/**
 * Returns an iterator over the rows associated with a partial primary key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {TableIteratorOptions} iterateOptions the non-default arguments for consistency of the operation and to
 * control the iteration or null to get default behaviour. The default Direction in TableIteratorOptions is
 * Direction.UNORDERED. If the primary key contains a complete shard key both Direction.FORWARD and
 * Direction.REVERSE are allowed.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.tableIterator = function (/*String*/ table,
                                          /*Object*/ primaryKey,
                                          /*FieldRange*/ fieldRange,
                                          /*Array*/ includedTables,
                                          /*TableIteratorOptions*/ iterateOptions,
                                          /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
};

/**
 * Returns an iterator over the keys associated with a partial primary key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {TableIteratorOptions} iterateOptions the non-default arguments for consistency of the operation and to
 * control the iteration or null to get default behaviour. The default Direction in TableIteratorOptions is
 * Direction.UNORDERED. If the primary key contains a complete shard key both Direction.FORWARD and
 * Direction.REVERSE are allowed.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.tableKeysIterator = function (/*String*/ table,
                                              /*Object*/ primaryKey,
                                              /*FieldRange*/ fieldRange,
                                              /*Array*/ includedTables,
                                              /*TableIteratorOptions*/ iterateOptions,
                                              /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
};

/**
 * Returns an iterator over the rows associated with an index key. This method requires an additional database read
 * on the server side to get row information for matching rows. Ancestor table rows for matching index rows may be
 * returned as well if specified in the getOptions paramter. Index operations may not specify the return of child
 * table rows.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {TableIteratorOptions} iterateOptions the non-default arguments for consistency of the operation and to
 * control the iteration or null to get default behaviour. The default Direction in TableIteratorOptions is
 * Direction.UNORDERED. If the primary key contains a complete shard key both Direction.FORWARD and
 * Direction.REVERSE are allowed.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.indexIterator = function (/*String*/ table,
                                          /*Object*/ primaryKey,
                                          /*FieldRange*/ fieldRange,
                                          /*Array*/ includedTables,
                                          /*TableIteratorOptions*/ iterateOptions,
                                          /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
};

/**
 * Return the keys for matching rows associated with an index key. The iterator returned only references
 * information directly available from the index. No extra fetch operations are performed. Ancestor table keys
 * for matching index keys may be returned as well if specified in the getOptions paramter. Index operations
 * may not specify the return of child table keys.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {TableIteratorOptions} iterateOptions the non-default arguments for consistency of the operation and to
 * control the iteration or null to get default behaviour. The default Direction in TableIteratorOptions is
 * Direction.UNORDERED. If the primary key contains a complete shard key both Direction.FORWARD and
 * Direction.REVERSE are allowed.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.indexKeyIterator  = function (/*String*/ table,
                                              /*Object*/ primaryKey,
                                              /*FieldRange*/ fieldRange,
                                              /*Array*/ includedTables,
                                              /*TableIteratorOptions*/ iterateOptions,
                                              /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
};

/**
 * Puts a row into a table. The row must contain a complete primary key and all required fields.
 * @param {String} table the table name
 * @param {Object} row the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.put = function (/*String*/ table,
                                /*Object*/ row,
                                /*WriteOptions*/ writeOptions,
                                /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _row = new ttypes.TRow({ jsonRow: JSON.stringify(row) });
    this.kvClient.put(table, _row, writeOptions, function(err, response) {
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                        kvLogger.debug('Return from put with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Puts a row into a table, but only if the row does not exist. The row must contain a complete primary key
 * and all required fields.
 * @param {String} table the table name
 * @param {Object} row the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.putIfAbsent = function (/*String*/ table,
                                        /*Object*/ row,
                                        /*WriteOptions*/ writeOptions,
                                        /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _row = new ttypes.TRow({ jsonRow: JSON.stringify(row) });
    this.kvClient.putIfAbsent(table, _row, writeOptions, function(err, response) {
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                        kvLogger.debug('Return from putIfAbsent with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Puts a row into a table, but only if the row already exists. The row must contain a complete primary key
 * and all required fields.
 * @param {String} table the table name
 * @param {Object} row the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.putIfPresent = function (/*String*/ table,
                                         /*Object*/ row,
                                         /*WriteOptions*/ writeOptions,
                                         /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _row = new ttypes.TRow({ jsonRow: JSON.stringify(row) });
    this.kvClient.putIfPresent(table, _row, writeOptions, function(err, response) {
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
            kvLogger.debug('Return from putIfPresent with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Puts a row, but only if the version of the existing row matches the matchVersion argument. Used when
 * updating a value to ensure that it has not changed since it was last read. The row must contain a
 * complete primary key and all required fields.
 * @param {String} table the table name
 * @param {Object} row the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {Version} matchVersion the version to match.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.putIfVersion = function (/*String*/ table,
                                         /*Object*/ row,
                                         /*Version*/ matchVersion,
                                         /*WriteOptions*/ writeOptions,
                                         /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _row = new ttypes.TRow({ jsonRow: JSON.stringify(row) });
    this.kvClient.putIfVersion(table, _row, matchVersion, writeOptions, function(err, response) {
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                        kvLogger.debug('Return from putIfVersion with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Deletes a row from a table.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.deleteRow = function (/*String*/ table,
                                      /*Object*/ primaryKey,
                                      /*WriteOptions*/ writeOptions,
                                      /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    this.kvClient.deleteRow(table, _primaryKey, writeOptions, function(err, response){
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                        kvLogger.debug('Return from deleteRow with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Deletes a row from a table but only if its version matches the one specified in matchVersion.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {Version} matchVersion the version to match.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.deleteRowIfVersion = function (/*String*/ table,
                                               /*Object*/ primaryKey,
                                               /*Version*/ matchVersion,
                                               /*WriteOptions*/ writeOptions,
                                               /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    this.kvClient.deleteRowIfVersion(table, _primaryKey, matchVersion, writeOptions, function(err, response){
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
                        kvLogger.debug('Return from deleteRowIfVersion with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * Deletes multiple rows from a table in an atomic operation. The key used may be partial but must contain
 * all of the fields that are in the shard key.
 * @param {String} table the table name
 * @param {Object} primaryKey the primary key for a table. It must be a complete primary key, with all fields set.
 * @param {FieldRange} The FieldRange to be used to restrict the range of the operation.
 * @param {Array} includedTables The list of tables to be included in an operation that returns
 * multiple rows or keys.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.multiDelete = function (/*String*/ table,
                                        /*Object*/ primaryKey,
                                        /*FieldRange*/ fieldRange,
                                        /*Array*/ includedTables,
                                        /*WriteOptions*/ writeOptions,
                                        /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
    var _primaryKey = new ttypes.TRow({ jsonRow: JSON.stringify(primaryKey) });
    var deletedRows = this.kvClient.multiDelete(table, _primaryKey, fieldRange, includedTables, writeOptions, function(err, response){
        if (kvLogger.logLevel>=LOG_LEVELS.DEBUG)   // avoid unnecessary call
            kvLogger.debug('Return from multiDelete with err:' + err);
        if (err)        err = new Error(err);  // return an Error object
        if (response)   response.previousRow = JSON.parse(response.previousRow.jsonRow);
        if (callback)   callback(err, response);
    });
};

/**
 * This method provides an efficient and transactional mechanism for executing a sequence of operations associated
 * with tables that share the same shard key portion of their primary keys. The efficiency results from the use
 * of a single network interaction to accomplish the entire sequence of operations.
 * The operations passed to this method are created using an TableOperationFactory instance,
 * which is obtained from the getTableOperationFactory() method.
 * @param {Array} operations the list of operations to be performed. Note that all operations in the list must specify primary keys with the same complete shard key.
 * @param {WriteOptions} writeOptions non-default arguments controlling the Durability of the operation,
 * or null to get default behaviour.
 * @param {function} callback a function that is called when the process finish.
 */
Store.prototype.execute = function (/*Array*/ operations,
                                    /*WriteOptions*/ writeOptions,
                                    /*function*/ callback) {
    if (!this.kvConnected) {
        if (callback) callback(new Error( Errors.NOT_CONNECTED ));
        return;
    }
};


