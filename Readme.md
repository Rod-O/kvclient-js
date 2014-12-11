[![Oracle NoSQL DB](http://www.oracle.com/ocom/groups/public/@otn/documents/webcontent/1876686.jpg)](http://www.oracle.com/technetwork/database/database-technologies/nosqldb/overview/index.html)

# KVClient API for node.js

## Introduction
This module provides native node.js client access to data stored in Oracle NoSQL Database tables. 
To work, the module requires to use a proxy server which translates network activity between this module and the Oracle NoSQL Database store using thrift protocol. The proxy is written in pure Java and can run on any machine that is network accessible by your client and the Oracle NoSQL Database store.

This document assumes that you have read and understood the concepts described in the Oracle NoSQL Database Getting Started with the Table API guide.

This API is entirely described in the node.js API Reference Guide. This document can be accessed through the documentation directory.

## Requirements for proxy server
In order to start a proxy server you will need to have the Java 7 runtime installed.

The proxy server is available along with this module. The proxy server resides in the kvproxy directory and is provided as a Java jar file (kvproxy.jar). Note that to use the proxy, you must also have a Oracle NoSQL Database installation, Specifically, the kvclient.jar file from that installation must be available to the proxy.

## Using the proxy server
The proxy server is a Java application that accepts network traffic using thrift protocol from this module and translate it into requests that the Oracle NoSQL Database can understand, then forwards the translated request to the store. The proxy also does the inverse process. 

The proxy can run on any network accessible machine. It has minimal resource r  equirements and, in most cases can run in the same machine the client code is running.

Before the module can access the store, the proxy server must be running.

### Running the proxy manually.
To run the server manually you need the exact location of kvclient.jar and kvproxy.jar, then add the -cp flag with these files and their full path or use the CLASSPATH environment variable so Java can access these files.
The files are located in:
- KVHOME/lib/kvclient.jar
- LOCAL|GLOBAL/node_modules/kvclient-js/kvproxy/kvproxy.jar

The proxy server itself is started using the oracle.kv.proxy.KVProxy command. At a minimum, the following information is required when you start the proxy server:

-helper-hosts
This is a list of one or more host:port pairs representing Oracle NOSQL Database storage nodes that the proxy server can use to connect to the store.

-port
The port where your client code can connect to this instance of the proxy server.

A range of other command line options are available. In particular, if you are using the proxy server with a secure store, you must provide authentication information to the proxy server. In addition, you will probably have to identify a store name to the proxy server. For a complete description of the proxy server and its command line options, see Proxy Server Reference.

Then the command line call to start the proxy will be something like:
nohup java oracle.kv.proxy.KVProxy -port 5010 -helper-hosts localhost:5000

### Running the proxy from the module
To run the server from the module you must indicate it on a Configuration object. Configuration object is required to connect to any store, on the proxy section you must specify if a local proxy is started or just try to connect to an already started proxy. So the Configuration object looks like:
{
    "startProxy"         : true,
    "KVCLIENT_JAR"       : "/usr/local/kv/kvstore/dist/lib/kvclient.jar",
    "PROXY_HOME"         : "/usr/local/node_modules/kvclient-js/kvproxy/",
    "kvStoreName"        : "kvstore",
    "kvStoreHelperHosts" : ["localhost:5000"],
    "readZones"          : "",
    "security"           : "/home/user/security"
}

#Connecting to the store.
To perform any store operation, you must establish a network connection between your client code and the store. The following is an example code that illustrates how to connect using a Configuration object.

## EXAMPLE
```
// Include kvclient-js module
var kvClient = require('kvclient-js');
var kvTypes = kvClient.Types;


// Create a configuration object
var configuration = new kvClient.Configuration();
configuration.startProxy = true;
configuration.KVCLIENT_JAR = "/usr/local/kv/kvstore/dist/lib/kvclient.jar";
configuration.PROXY_HOME = "/usr/local/node_modules/kvclient-js/kvproxy/";

// Create a store with the specified configuration
var store = kvClient.createStore(configuration);

// Create a open handler
store.on('open', function () {

    var primaryKey = {id:777};
    var readOptions = new kvTypes.ReadOptions( kvTypes.Consistency.NONE_REQUIRED, 1000 );
    store.get('table', primaryKey, readOptions, function(error, result) {
        console.log(result);
    });
    store.close();

});

// Open the store
store.open();
```

## DIRECTORY STRUCTURE
<dl compact>
 <dt> documentation/   <dd>      API Reference
 <dt> examples/        <dd>      Sample code
 <dt> lib/             <dd>      The KVClient-js source code
 <dt> kvproxy/         <dd>      Required files to start a proxy server
 <dt> test/            <dd>      Test cases
</dl>

## TESTING
To run the test cases included in the package you  need to have mocha installed, to install mocha use:
```npm install mocha | sudo npm install -g mocha ``` 

Test cases use the database structure contained in the db-config.kvs file, this file is located in the test directory.
Once you have a kvstore instance running you can connect through the runadmin command to load the file structure.
Example:
  - log on kvlite: ```java -jar $KVROOT/kvstore.jar runadmin -port 5000 -host host```
  - load the file: ```kv->load -file test/db-config.kvs```

Tests cases also use a file that holds a Configuration object to be used to connect to a store. This file is called test-conf.json and is also located in the test directory.
Modify this file accordingly to your scenario, be sure to:
  - set KVCLIENT_JAR to your kvclient.jar file
  - set PROXY_HOME to your proxy directory

Now, in the [package] directory (below test directory) just run the command: ```mocha```

Mocha will automatically look for test directory and try to run the tests.

## DOCUMENTATION
The API reference is included in the documentation directory.

## FOR MORE INFORMATION
To report issues and get more information please go to http://github.com/oracle/kvclient-js/

