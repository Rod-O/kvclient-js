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
/*global LOG_LEVELS*/
/*global Errors*/
/*global Types*/

var EventEmitter    = require('events').EventEmitter;
util.inherits(Iterator, EventEmitter);


/**
 * Creates an iterator based on  
 * @param kvClient
 * @param iteratorResult
 * @constructor
 */
function Iterator(/*kvClient*/ kvClient, /*TIteratorResult*/ iteratorResult) {
    EventEmitter.call(this);
    var self  = this;
    var iteratorId = iteratorResult.iteratorId;
    var closed = false;
    var buffer = iteratorResult.result.rowsWithMetadata;
    var hasMore = iteratorResult.hasMore;
    var index, length;
    var buffering = false;
    resetIndexes();

    function resetIndexes() {
        index = 0;
        length = buffer.length - 1;
    }
    function parseRow(row) {
        if (row)
            if (row.jsonRow) {
                row.row = JSON.parse(row.jsonRow);
                delete row.jsonRow;
            }
        return row;
    }

    //function available() {
    //    return (length>=index || hasMore) && !buffering;
    //}
    //this.available = available;

    function isClosed() {
        return closed;
    }
    this.isClosed = isClosed;

    function next(callback) {
        callback = callback || function(){};
        if (closed) {
            callback(new Error(Errors.ITERATOR_CLOSED));
        }
        if (length>=index) {  //available from buffer
            parseRow(buffer[index]);
            callback(null, buffer[index++]);
            return;
        }
        if (hasMore) {
            buffering = true;
            kvClient.iteratorNext(iteratorId, function (err, result) {
                if (result != null) {
                    buffer = result.result.rowsWithMetadata;
                    resetIndexes();
                    parseRow(buffer[index]);
                    callback(null, buffer[index]);
                    index++;
                }
            });
        }
        callback(new Error(Errors.NO_MORE_ELEMENTS));
        self.emit("finish");
    }
    this.next = next;

    function getCurrent(callback) {
        kvLogger.debug("Iterator - getCurrent");
        var _index = index-1;
        if (closed) {
            callback(new Error(Errors.ITERATOR_CLOSED));
            return;
        }
        parseRow(buffer[_index]);
        if (length>=_index)
            callback(null, buffer[_index]);
    };
    this.getCurrent = getCurrent;

    function forEach(callback) {
        kvLogger.debug("Iterator - forEach");
        if (closed) {
            callback(new Error(Errors.ITERATOR_CLOSED));
            return;
        }
        var lastEntry = false;
        while(true) { //depleting buffer
            if (length>=index) {
                parseRow(buffer[index]);
                callback(null, buffer[index++]);
            } else if (hasMore) {
                kvClient.iteratorNext(iteratorId, function (err, result) {
                    if (result != null) {
                        buffer = result.result.rowsWithMetadata;
                        hasMore = result.hasMore;
                        resetIndexes();
                        forEach(callback);
                    }
                });
                break;
            } else {
                lastEntry = true;
                break;
            }

        }
        if (lastEntry)  // means this is the last entry, no more items available
            self.emit("finish");
    }
    this.forEach = forEach;

    function close(callback) {
        kvLogger.debug("Iterator - close");
        if (closed) {
            callback(new Error(Errors.ITERATOR_CLOSED));
            return;
        }
        kvClient.iteratorClose(iteratorId, callback);
    }
    this.close = close;

}

module.exports = Iterator;
