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
 *   Affero General Public License for more message.
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

// ----- Errors
exports.UNKNOWN                 = "Unknown Error";
exports.NOT_CONNECTED           = "The store is not connected to any server";
exports.ALREADY_CONNECTED       = "The store is already connected";
exports.NO_JAVA_CLIENT          = "No java client was found to start a proxy";
exports.ERROR_STARTING_PROXY    = "Error starting proxy";
exports.CONNECTION_ATTEMPTS     = "Maximum connection attempts reached";
exports.PROXY_TIMEOUT           = "Timeout reached trying to contact the proxy";
exports.PROXY_ERROR             = "Error setting up the proxy";
exports.PROXY_CONNECTION_ERROR  = "Error connecting to the specified proxy";
exports.PROXY_VERIFY_ERROR      = "Error trying to verify the proxy connection";

exports.INVALID_DURABILITY      = "Invalid Durability, to create Durability use `new kvClient.Types.Durability`";
exports.INVALID_WRITE_OPTIONS   = "Invalid WriteOptions, to create WriteOptions use `new kvClient.Types.WriteOptions`";
exports.INVALID_READ_OPTIONS    = "Invalid ReadOptions, to create ReadOptions use `new kvClient.Types.ReadOptions`";

exports.TDurabilityException           = "TDurabilityException";
exports.TRequestTimeoutException       = "TRequestTimeoutException";
exports.TFaultException                = "TFaultException";
exports.TUnverifiedConnectionException = "TUnverifiedConnectionException";
exports.TProxyException                = "TProxyException";
exports.TIllegalArgumentException      = "TIllegalArgumentException";
exports.TConsistencyException          = "TConsistencyException";




