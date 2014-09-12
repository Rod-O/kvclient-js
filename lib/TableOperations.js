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

// ======= Tableoperation =======
// A factory to create operation that can be batched for execution by kvClient.execute().
// These operation are pure JSON objects, this factory is an easy and fail safe way to create them.



var operation = {
    PUT                 : 1,
    PUT_IF_ABSENT       : 2,
    PUT_IF_PRESENT      : 3,
    PUT_IF_VERSION      : 4,
    DELETE              : 5,
    DELETE_IF_VERSION   : 6
}

exports.operation = operation;

/**
 * Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.put() method.
 */
exports.put = function (row, prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.PUT;
    this.row                 = row;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
    
}

/*
 Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.putIfAbsent() method.
 */
exports.putIfAbsent = function (row, prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.PUT_IF_ABSENT;
    this.row                 = row;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
}

/*
 Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.putIfPresent() method.
 */
exports.putIfPresent = function (row,  prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.PUT_IF_PRESENT;
    this.row                 = row;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
}

/*
 Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.putIfVersion() method.
 */
exports.putIfVersion = function (row, prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.PUT_IF_VERSION;
    this.row                 = row;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
}

/*
 Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.delete() method.
 */
exports.delete = function (primaryKey, prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.DELETE;
    this.primaryKey          = primaryKey;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
}

/*
 Create a Put operation suitable for use as an argument to the execute method. The semantics of the returned operation are identical to that of the connection.deleteIfVersion() method.
 */
exports.deleteIfVersion = function (primaryKey, versionMatch, prevReturn, abortIfUnsuccessful) {
    this.operation           = operation.DELETE_IF_VERSION;
    this.primaryKey          = primaryKey;
    this.versionMatch        = versionMatch;
    this.prevReturn          = prevReturn;
    this.abortIfUnsuccessful = abortIfUnsuccessful;
}



