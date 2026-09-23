Solution

$ ls -la
total 4
drwxr-xr-x 1 sdmpu users  24 Aug 31 11:23 .
drwxr-xr-x 1 sdmpu users 138 Aug 31 11:36 ..
-rw-r--r-- 1 sdmpu users   3 Aug 31 11:23 file.txt
drwxr-xr-x 1 sdmpu users 128 Aug 31 11:34 .git

$ git status
fatal: not a git repository (or any of the parent directories): .git

$ cat .git/HEAD
corrupted

$ cat .git/refs/heads/main
<some-hash>


$ printf 'ref: refs/heads/main\n' > .git/HEAD

or modify it manually with vim

$ vim .git/HEAD

and type

ref: refs/heads/main
