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

var kvClient = require('kvclient-js');
var kvTypes = kvClient.Types;

var configuration = new kvClient.Configuration();
configuration.securityProperties.TRANSPORT = "SSL";

var store = kvClient.createStore(configuration);
store.on('open', function () {
  var primaryKey = {id:777};
  var row = {id:777, user:"John Doe", quota:150};
  var durability = kvTypes.newDurability( kvTypes.ReplicaAckPolicy.ALL,
                                          kvTypes.ReplicaAckPolicy.ALL,
                                          kvTypes.SyncPolicy.NO_SYNC);
  var writeOptions = kvClient.newWriteOptions( durability,
                                               kvTypes.ReturnChoice.ALL,
                                               1000 );
  var readOptions = kvClient.newReadOptions( kvTypes.Consistency.NONE_REQUIRED,
                                             1000 );

    store.put('table', row, writeOptions, function(error, result) {
      console.log("put()   newVersion:" + result);
      
      var multirowOptions = new kvClient.MultiRowOptions(new kvTypes.FieldRange("quota", 100, 200));

        store.tableKeysIterator('table', pkey, multirowOptions, function(error, iterator) {
          iterator.whileNext(function (item) {
            console.log("key: ");
            console.log(item);
          })
      });
      
  });
    store.close();
});

store.open();