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
COOKIE=$LOGDIR/cookie.txt

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

# login
read -p 'login: ' USERNAME
read -s -p 'password: ' PASSWORD
RES=`curl -XPOST -d "username=$USERNAME&password=$PASSWORD" $BASE_URL/user/login`
ERROR=`echo "$RES" | grep '"error":.*'`
if [ "$ERROR" != "" -o "$RES" = "" ]; then
    die "$F: $ERROR" >> $LOG_ERRORS
fi


# import files
find "$BASE_DIR" -type f | while read F; do 
    # check if file already scanned
    grep -q "$F" "$LOG_IMPORTED" && continue

    # extract information
    DESCR="${F:$PREFLEN}"
    # split words, filter duplicates, remove empty lines, join lines by
    # coma, replace comas with tags[]=
    TAGS=`echo "$DESCR"|sed 's/[\.\/ ]\+/\n/g'\
            |sort|uniq|sed '/^$/d'|tr '\n' ',' |sed 's/,/\&tags[]=/g'`
    # TODO: tags filtern

    echo '------------------------------------------------------------------------------'
    echo "d:$DESCR"
    echo "t:$TAGS"
    # TODO: curl requests:
    # 1. datei hochladen
    RES=`curl -c $COOKIE -b $COOKIE -s -X POST -F "file=@$F"   $BASE_URL/file`
    ERROR=`echo "$RES" | grep '"error":.*'`
    if [ "$ERROR" != "" -o "$RES" = "" ]; then
        echo "$F: $ERROR" >> $LOG_ERRORS
        continue
    fi
    FILE_ID=`echo "$RES"|sed 's/.*"id":"\([^"]\+\)".*/\1/g'`
    echo $FILE_ID
    TITLE=`basename "$DESCR"`

    # 2. document erstellen
    RES=`curl -c $COOKIE -b $COOKIE -s -X POST  $BASE_URL/document \
        -d "files[]=$FILE_ID&tags[]=$TAGS&description=$TITLE"`
    ERROR=`echo "$RES" | grep '"error":.*'`
    if [ "$ERROR" != "" -o "$RES" = "" ]; then
        echo "$F: $ERROR" >> $LOG_ERRORS
        continue
    fi

    # add file to resume_log
    echo "$F" >> "$LOG_IMPORTED"
done

