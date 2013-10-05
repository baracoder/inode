# coding=utf-8
import os
import sys
import urllib


def fixName(s, dirname):
    try:
        s.decode('utf-8')
        return
    except UnicodeDecodeError:
        pass
    fixedName = urllib.unquote(s).decode('utf-8')
    print 'fixing %s -> %s in %s' % (
        s.decode('utf-8',errors='ignore'),
        fixedName,
        dirname.decode('utf-8', errors='ignore')
    )
    os.rename(
        os.path.join(dirname, s),
        os.path.join(dirname, fixedName)
    )


def walk(top):
    for dirname, dirnames, filenames in os.walk(top):
        # print path to all subdirectories first.
        for subdirname in dirnames:
            #print mkutf8(subdirname[0])
            fixName(subdirname, dirname)
            walk(subdirname)

        # print path to all filenames.
        for filename in filenames:
            fixName(filename, dirname)

if __name__ == '__main__':
    top = sys.argv[1]
    walk(top)
