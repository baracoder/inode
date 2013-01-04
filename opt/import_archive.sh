#!/bin/bash

die() {
    echo $1
    exit 1
}

[ -d "$1" ] || die "Directory not found: $1"
[ $# = 2 ]  || die "Wrong arg count: $0 archive-dir logfile"
touch "$2" || die "Logfile not writeable: $2"

PREFLEN=`echo -n "$1"|wc -m`

# TODO: einloggen, sessionid speichern

find "$1" -type f | while read L; do 
    # check if file already scanned
    grep -q "$L" "$2" && continue

    # extract information
    DESCR="${L:$PREFLEN}"
    # split words, filter duplicates, remove empty lines, join lines by coma
    TAGS=`echo "$DESCR"|sed 's/[\.\/ ]\+/\n/g'\
            |sort|uniq|sed '/^$/d'|tr '\n' ','`
    # TODO: tags filtern

    echo '------------------------------------------------------------------------------'
    echo "d:$DESCR"
    echo "t:$TAGS"
    # TODO: curl requests:
    # 1. datei hochladen
    # 2. document erstellen
    # 3. tags hinzufügen


    # TODO
    # if imported, add file to resume_log
    continue
    echo "$L" >> "$2"
done

