# kvstore
[![Build Status] (http://www.oracle.com/ocom/groups/public/@otn/documents/webcontent/1876686.jpg)](http://www.oracle.com/technetwork/database/database-technologies/nosqldb/overview/index.html) ## KVClient API for node.js


INTRODUCTION
------------
The KVClient API for node.js provides a direct connection to any KVStore server. 


Package directory structure
---------------------------

The package has the following structure:

documentation - the package documentation
examples - some examples to see how the package works
lib - the package code
proxy - necessary jar files to start a local proxy
test - KVClient test cases to be used with mocha
Package files

The package contains the following files on their main directory:

Changes.md - a log file with the relevant changes to the package
jsdoc.json - configuration file to generate the documentation
kvclient.js - the package main source file
License - the License terms for this package
package.json - the package descriptor for npm
Readme.md - the Readme file with information about the package
How to run test cases


TESTING
-------

In order to run the test cases included in the package, you only need to be located at package directory and run the command:

mocha
mocha automatically will look for test directory and try to run the tests.


DOCUMENTATION
-------------

The package is shipped with documentation, but if you want to regenerate it, you only need to be located on package directory and run the following command:

jsdoc -c jsdoc.json
jsdoc automatically will create documentation directory and create/update the documentation.


FOR MORE INFORMATION
--------------------
See the issues and other information at http://github.com/oracle/kvclient-js/

