verbose
table clear -all
#plan remove-table -name t1 -wait
#plan remove-table -name t2 -wait
#plan remove-table -name p1.c1 -wait
#plan remove-table -name p1.c2 -wait
#plan remove-table -name p1 -wait


# a very simple table
table create -name t1
add-field -name id -type INTEGER
add-field -name a -type STRING
primary-key -field id
exit
plan add-table -name t1 -wait


# a table with all the types
table create -name t2
    add-field -name id -type INTEGER
    add-field -name s -type STRING
    add-field -name f -type FLOAT
    add-field -name d -type DOUBLE
    add-field -name l -type LONG
    add-field -name bool -type BOOLEAN
    add-array-field -name arrStr
        add-field -type STRING
    exit
    add-field -name bin -type BINARY
    add-field -name fbin -type FIXED_BINARY -size 10
    add-field -name e -type ENUM -enum-values A,B,C
    primary-key -field id
    exit
plan add-table -name t2 -wait


# parent and children tables
table create -name p1
add-field -name shardKey -type INTEGER
add-field -name id -type INTEGER
add-field -name s -type STRING
primary-key -field shardKey -field id
shard-key   -field shardKey
exit
plan add-table -name p1 -wait


table create -name p1.c1
add-field -name idc1 -type INTEGER
add-field -name s -type STRING
primary-key -field idc1
exit
plan add-table -name p1.c1 -wait


table create -name p1.c2
add-field -name idc2 -type INTEGER
add-field -name s -type STRING
primary-key -field idc2
exit
plan add-table -name p1.c2 -wait

show tables



