inode
=====

Grundsätzliche Ideen:

* Technisch
    * Elasticsearch für schnelle Suche
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


Indecies
--------

* Document
    * wird geupdated wenn ein tag oder das doc selbst sich geändert hat
    * description
    * Tags (alle wörter, liste)
    * published (true/false)
    * createed (date)
    * lastIndexed (date)
    * lastChanged (date)
    * date (date)

* File
    * sha1
    * document id
    * text (automatisch extahiert oder leer)
    * lastChecked (Check im Dateisystem)
    * missing (bool, true bei check Fehler)
    * mimeType (string, mime)

* Tag
    * name
    * words[]
    * wenn geändert, werden "verknüpfte" dokumente neu indiziert

* Queries
    * Erfolgreiche Suchqueries für autovervollständigung

API
===

Aus Sicherheitstechnischen und Einfachheitsgründen kann die
elasticsearch API nicht durchgereicht werden.

Die API soll sich an REST anlehnen


Document
--------

* `/document/` GET
    * parameter
        * search query
            * einfacher text: alle felder werden durchsucht
            * tag:TAG nur tags werden durchsucht
            * text:"foo bar" nur dokument text wird durchsucht
            * from:DATE nur nach DATE eingestellte dokumente
        * offset / limit
        * unpublished (nur admin)
    * gibt liste von maximal 100 passenden docs


* ``/document/ID`` PATCH
    * response: ok/error
    * nur admin
    * properties ändern

* ``/document/`` POST
    * neues dokument anlegen

* ``/document_tag`` GET
    * parameter: words
    * gibt tags, die mit diesen tags (über document) verknüpft wurden zurück
    * zum einschränken der suchergebnisse


File
----

* ``/file`` POST
    * Parameter: Datei
    * Response: SHA1 der Datei / error

* ``/file/SHA1`` GET
    * Response: Datei

Tag
---

* ``/tag/NAME/merge`` POST
    * parameter: name des anderen tags
    * response: ok/error

* ``/tag/NAME/rename`` POST
    * parameter: neuer name
    * response: ok/error

Word
----

* `/word/` GET
    * Parameter: Teilstring eines Wortes
    * response: tag

Authentifizierung
-----------------

Beim Login wird eine sessionid zurückgegeben, diese muss dann bei jeder
anfrage als parameter mitgesendet werden

* /login
    * request: user+passwort
    * response: sessionid/error
    * session wird wenn möglich im cookie gespeichert


0xCAFE
======

Der Cafe Server soll mit in die API integriert werden um die
Abhängigkeit zu django zu verlieren

Der Cafe Server selber wird weiterhin in python laufen und Zugang zu den
seriellen Ports bieten. Die
Auswertung in node geschehen. Der Server wird für eine langhaltige
Verbindung angepasst die bei Änderungen Daten sendet

