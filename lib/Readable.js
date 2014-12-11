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

var readable = require('stream').Readable;
util.inherits(Readable, readable);

function parseRow(row) {
    if (row)
        if (row.jsonRow) {
            row.row = JSON.parse(row.jsonRow);
            delete row.jsonRow;
        }
    return row;
}

/**
 * Creates a Stream based on
 * @param kvClient
 * @param result
 * @constructor
 */
function Readable(/*kvClient*/ kvClient, /*TIteratorResult*/ result) {
    readable.call(this);
    var self  = this;
    self.kvClient = kvClient;
    self.iteratorId = result.iteratorId;
    self.buffer = result.result.rowsWithMetadata;
    self.hasMore = result.hasMore;
    self.index = 0;
    self.length = self.buffer.length - 1;
    self.buffering = false;
}


Readable.prototype._read = function _read(n) {
    var self = this;
    if (self.length>=self.index) {  //available from buffer
        //console.log(self.buffer[self.index].jsonRow);
        return self.push(self.buffer[self.index++].jsonRow);
    }
    if (self.hasMore && !self.buffering) {
        self.buffering = true;
        self.kvClient.iteratorNext(self.iteratorId, function (err, result) {
            if (result) {
                self.hasMore = result.hasMore;
                self.buffer = result.result.rowsWithMetadata;
                self.index = 0;
                self.length = self.buffer.length - 1;
                self.push(self.buffer[self.index++].jsonRow);
            }
            if (err) {
                console.log(err);
            }
            self.buffering = false;
        });
        return self.push('');
    }
    if (self.buffering) {
        return self.push('');
    }

    return self.push(null);
}

module.exports = Readable;
