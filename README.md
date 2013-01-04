inode
=====

Grundsätzliche Ideen:

* Technisch
    * ORM zum Verwalten der Beziehungen zwischen Dokumenten und Tags
    * Elasticsearch für schnelle Suche
        * ein Index: Documents
        * Mit Eigenschaften wie tags, date
    * Dateistorage
        * momentan 4k Dateien im Archiv
        * 3 erste Digits für Unterordner, darin Datei mit vollständigen
          Namen: {SHA1Sum}.{typspezifische Enung}
        * Daduch können 4095 Unterverzeichnisse angelegt werden, was für
          die meisten Dateisysteme (auch FAT32) OK ist
        * Erlaubt Überprüfung durch sha1sum
    * Volltextsuche
        * Text Indexierung mit OCR (orcad/tesseract) und Auslesen von pdfs
          mit pdf2text
        * vorbereiten von bildern mit `unpaper` (ausrichten, lesbarkeit
          für ocr verbessern)
        * Text begrenzt auf 1000 wörter pro Dokument
        * Bilder aus PDF werden extahiert und durch OCR gescannt
          (um eingescannte PDFs durchsuchbar zu machen)
        * Text wird in ORM gespeichert
        * Mögliche Erweiterung zum einlesen von word/exel usw
          http://archive09.linux.com/articles/52385
            * odt2text
            * antiword
            * catdoc
    * Dateien werden über SHA1 Summe gefunden
    * Download von Dateien nur mit valider SessionID im Request
    * Nur betroffene Teile werden neu Indexiert durch timestamp der
      letzten Indexierung
        * Document enthält lastIndexed, lastChanged
        * Wenn Tag / Document geändert werden, werden entspprechende
          Documents lastChanged neu gesetzt
        * Indexer wird per cron/manuell gestartet und indexiert
          Dokumente neu, wo lastChanged>lastIndexed ist
* Model
    * Dokumente können aus meheren Dateien bestehen
    * Mehrere Wörter können den gleichen Tag zugehören
* BenutzerUI
    * Suchmaske ähnlich Web-Suchmaschine
    * Filtern nach eigenschaften durch Suchgramatik
      ZB: tag:ws08 description:"bla bla" einfacher text text:"nur text"


Modelle
-------

* Document
    * description
    * Tags (hasMany)
    * published (true/false)
    * createed (date)
    * lastIndexed (date)
    * lastChanged (date)
    * date (date)
    * fileType (string, mime)

* File
    * Document (hasOne, order)
    * sha1
    * text (automatisch extahiert oder leer)
    * lastChecked (Check im Dateisystem)
    * missing (bool, true bei check Fehler)

* Tag
    * Primary (Primärer Synonym)
    * Synonyms
    * lastChanged (date für index update)

* Synonym
    * Name
    * lastChanged


Index
-----

* documents: wird geupdated wenn ein tag oder das doc selbst sich geändert hat
    * ID: sha1 der datei
    * description
    * tags/synonyms
    * content (text)
    * date
    * type

* tags: wird geupdated wenn sich der tag oder ein synonym geändert hat
    * name
    * synonym als content

API
===

Benutzer
--------

* ``/document/search``
    * parameter: search query
        * einfacher text: alle felder werden durchsucht
        * tag:TAG nur tags werden durchsucht
        * text:"foo bar" nur dokument text wird durchsucht
        * from:DATE nur nach DATE eingestellte dokumente
        * 
    * gibt liste von maximal 100 passenden docs

* ``/tag/search``
    * parameter: words
    * gibt tags, die mit diesen tags verknüpft wurden zurück


* ``/word/search``
    * parameter: teilstring eines wortes
    * response: tag

* ``upload``
    * parameter: lernhilfe datei + tags + description
    * response: ok/error

* ``download``
    * anfrage: lernhilfe id
    * response: datei


Admin
-----

* ``/file/list/unpublished``
    * anfrage ohne parameter
    * response: liste mit lernhilen, die nicht gesichtet wurden

* ``/file/publish``
    * anfrage: lernhilfe id
    * response: ok/error

* ``/file/replade``
    * anfrage: lernhile id + datei
    * response: ok/error

* ``/tag/merge``
    * parameter: 2 tag ids
    * response: ok/error

* ``/tag/setprimary``
    * parameter: tag id, primary synonym id
    * response: ok/error


Authentifizierung
-----------------

Beim Login wird eine sessionid zurückgegeben, diese muss dann bei jeder
anfrage als parameter mitgesendet werden

* /login
    * request: user+passwort
    * response: sessionid/error


0xCAFE
======

Der Cafe Server soll mit in die API integriert werden um die
Abhängigkeit zu django zu verlieren

