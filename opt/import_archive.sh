#!/bin/bash

die() {
    echo $1
    exit 1
}

BASE_DIR=$1
BASE_URL=$2
LOGDIR=/tmp/import_archive_logs
LOG_IMPORTED=$LOGDIR/files_imported
LOG_ERRORS=$LOGDIR/errors

[ -d "$BASE_DIR" ] || die "Directory not found: $BASE_DIR"
[ $# = 2 ]  || die "Wrong arg count: $0 archive-dir base_url"
mkdir -p $LOGDIR || die "Logdir not writeable: $LOGDIR"
touch $LOG_IMPORTED || die "Logfile not writeable: $LOG_IMPORTED"
touch $LOG_ERRORS || die "Logfile not writeable: $LOG_ERRORS"

echo >> $LOG_ERRORS
echo '------------------------------------------------------------------------------'\
    >> $LOG_ERRORS
echo "- Starting `date`" >> $LOG_ERRORS
echo '------------------------------------------------------------------------------'\
    >> $LOG_ERRORS

echo >> $LOG_IMPORTED
echo '------------------------------------------------------------------------------'\
    >> $LOG_IMPORTED
echo "- Starting `date`" >> $LOG_IMPORTED
echo '------------------------------------------------------------------------------'\
    >> $LOG_IMPORTED

PREFLEN=`echo -n "$BASE_DIR"|wc -m`

# TODO: einloggen, sessionid speichern

find "$BASE_DIR" -type f | while read F; do 
    # check if file already scanned
    grep -q "$F" "$LOG_IMPORTED" && continue

    # extract information
    DESCR="${F:$PREFLEN}"
    # split words, filter duplicates, remove empty lines, join lines by coma
    TAGS=`echo "$DESCR"|sed 's/[\.\/ ]\+/\n/g'\
            |sort|uniq|sed '/^$/d'|tr '\n' ','`
    # TODO: tags filtern

    echo '------------------------------------------------------------------------------'
    echo "d:$DESCR"
    echo "t:$TAGS"
    # TODO: curl requests:
    # 1. datei hochladen
    RES=`curl -s -X POST -F "file=@$F"   $BASE_URL/file`
    ERROR=`echo "$RES" | grep '"error":.*'`
    [ "$ERROR" = "" ] || echo "$F: $ERROR" >> $LOG_ERRORS && continue
    FILE_ID=`echo "$RES"|sed 's/.*"id":"\(\w\+\)".*/\1/g'`


    # 2. document erstellen
    RES=`curl -s -X POST  $BASE_URL/document \
        -d "files=$FILE_ID&tags=$TAGS&desciption=$DESCR"`
    ERROR=`echo "$RES" | grep '"error":.*'`
    [ "$ERROR" = "" ] || echo "F: $ERROR" >> $LOG_ERRORS && continue

    # add file to resume_log
    echo "$F" >> "$LOG_IMPORTED"
done

