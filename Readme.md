[![Build Status] (http://www.oracle.com/ocom/groups/public/@otn/documents/webcontent/1876686.jpg)](http://www.oracle.com/technetwork/database/database-technologies/nosqldb/overview/index.html)
# KVClient API for node.js

INTRODUCTION
------------
The KVClient API for node.js provides a direct connection to any KVStore server. 


REQUIREMENTS
------------
KClient uses Thrift (https://thrift.apache.org/) protocol to connect to any KVStore server, in order to establish 
a connection to a KVStore server, you must have a running instance of a Thrift Proxy. This package is capable of 
starting an instance of this proxy by default, this Proxy requires you to have Java 7. 

EXAMPLE
-------
```
var kvClient = require('kvclient-js');
var kvTypes = kvClient.Types;

var configuration = new kvClient.Configuration();
configuration.securityProperties.TRANSPORT = "SSL";
configuration.startLocalProxy = true;

var store = kvClient.createStore(configuration);
store.on('open', function () {
    var primaryKey = {id:777};
    var readOptions = kvClient.newReadOptions( kvTypes.Consistency.NONE_REQUIRED, 1000 );
    store.get('table', primaryKey, readOptions, function(error, result) {
        console.log(result);
    });
    store.close();
});

store.open();

```

DIRECTORY STRUCTURE
-------------------
<dl compact>
 <dt> documentation/   <dd>      API Reference
 <dt> examples/        <dd>      Sample code
 <dt> lib/             <dd>      The KVClient-js source code
 <dt> proxy/           <dd>      Required files to start a Thrift Proxy instance
 <dt> test/            <dd>      Test suite for mocha
</dl>


TESTING
-------
To run the test cases included in the package, you need to have mocha installed, to install mocha use:
```npm install mocha | sudo npm install -g mocha``` 

then at package directory run the command:
```mocha ```

Mocha will automatically look for test directory and try to run the tests.


DOCUMENTATION
-------------
For a reference of the package please go to documentation directory. 

FOR MORE INFORMATION
--------------------
See the issues and other information at http://github.com/oracle/kvclient-js/

