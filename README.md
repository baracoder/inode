inode
=====

Grundidee
---------

* Minimal
    * aufgaben wie mergen von tags ausgelagert
    * Minimale Webseite, API für Anwendungen, Mobile Apps und Tools

* Abrufen und suchen günstig/schnell wie möglich, indexieren
  teuer/langsam wie nötig
    * Elasticsearch für Indizierung und schnelle Suche
    * Suchen erfolgt oft
    * Suchen erfolgt schnell durch ein Index
    * Vollständiges Indexieren erfolgt im Hintergrund, da schnelle
      Verfügbarkeit unwichtig ist



Dateien
-------
* Als Dateien
    * 3 erste Digits für Unterordner, darin Datei mit vollständigen
      Namen: {SHA1Sum}.{typspezifische Enung}
    * momentan 4k Dateien im Archiv
    * 4095 Unterverzeichnisse können angelegt werden, was für
      die meisten Dateisysteme (auch FAT32) OK ist
    * Erlaubt Dateicheck und vermeidet Duplikate
    * DOS wäre durch Füllen eines Ordners möglich (hash collision)
      Dateisysteme sind aber meißtens schnell genug um auch große Ordner
      duchsuchen zu können
    * Dateien werden über SHA1 gefunden und runtergeladen


Tasks
-----

Tasks werden in einem eigenen Index gespeichert. Sie werden nach dem
Einstellungsdatum abgearbeitet und der Status wird vermerkt.

* Content Indizierung
    * Text Indizierung mit OCR (orcad/tesseract) und Auslesen von pdfs
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

* file integrity check
    * Alle IDs mti sha1 vergleichen, fehler melden

* file availibility check
    * alle dokumente duchsuchen und prüfen ob referenzierte dateien
      vorhanden sind


Zugang
------

* Hochladen darf jeder
    * Dokumente sind erstmal nur für Admins sichtbar
* Suchen und Runterladen nur mit Login
  von Dokumenten
* Download von Dateien nur mit valider SessionID im Request
  und wenn Datei einem Dokument zugewiesen ist. Ist man nicht Admin,
  so muss das Dokument als public markiert sein
* Login und Rechte über Redmine Account
    * Status im Projekt Lernhilfen


BenutzerUI
----------

* Suchmaske ähnlich Web-Suchmaschine
* Filtern nach Eigenschaften durch Suchgrammatik
  ZB: tag:ws08 description:"bla bla" einfacher Text text:"nur text"


Backup
------

* File Storage kann mit dem normalen Dateisystem gesichert werden
* Elasticsearch kann auf weiteren Servern repliziert werden
* Index wird in regelmäßigen Zeitabständen in eine Datei gedumpt


Indecies
--------

* Nur betroffene Teile werden neu Indexiert durch timestamp der
  letzten Indexierung
    * Document enthält lastIndexed, lastChanged
    * Wenn Tag / Document geändert werden, werden entspprechende
      Documents lastChanged neu gesetzt
    * Indexer wird per cron/manuell gestartet und indexiert
      Dokumente neu, wo lastChanged>lastIndexed ist

* Document (wird geupdated wenn ein tag oder das doc selbst sich geändert hat)
    * description, text
    * tags[] alle wörter, liste
    * files [] alle dateien in entsprechender reihenfolge
        * sha1.ext [aus mimetype]
        * missing (bool, true bei check Fehler)
        * mime (string, mime)
        * size
    * published (true/false) kann durch admin geändert werden
    * createed (date)
    * lastChecked (Check der Dateien im Dateisystem)
    * date (date) datum des ursprünglichen dokumentes
    * lastIndexed (date)
    * lastChanged (date)
    * text (automatisch extahiert oder leer)

* tasks
    * als warteshlange für tasks
    * type (string)
    * worker (string) hostname
    * issued (date) tasks werden nach dem datum abgearbeitet
    * finished (date) wird automatisch gesetzt
    * status (string) 'pending', 'complete', 'processing', 'failed'
    * error (sting) optional
    * targets (string), betroffene ids (je nach typ dokument oder file)

API
===

Suchergebnisse wrden direkt aus Elasticsearch weirtergegeben. Anfragen
erfolgen als GET/POST queries. Feher werden mit einem entsprechenden
HTTP Code gekennzeichnet


Document
--------

* ``/document/QUERY`` GET
    * kan für minuten gecacht werden
    * GET - parameter
        * QUERY (suchanfrage)
            * einfacher text: alle felder werden durchsucht
            * tag:TAG nur tags werden durchsucht
            * text:"foo bar" nur dokument text wird durchsucht
            * from:DATE nur nach DATE eingestellte dokumente
        * offset
        * limit, max 100
        * unpublished (nur admin)
    * gibt elasticsearch suchergebniss zurück


* ``/document/ID`` PATCH
    * response: ok/error
    * nur admin
    * dokument direkt ändern

* ``/document/`` POST
    * neues dokument anlegen


File
----

* ``/file`` POST
    * Parameter: Datei
    * Response: SHA1 der Datei / error

* ``/file/SHA1[.ext]`` GET
    * Response: Datei

Tasks
-----
Zugang nur für Admins

* ``/task`` GET
    * listet 100 letzte fertige tasks, alle fehler und alle gerade
      bearbeiteten
    * Response: elasticsearch ergebniss

* ``/task/ID`` DELETE
    * Parameter: ID (Aus Ergebnisliste)

*  ``/task/clean`` POST
    * Löscht alle erfolgreich abgeschlossenen Tasks älter als 2w


Authentifizierung
-----------------

Beim Login wird eine sessionid zurückgegeben, diese muss dann bei jeder
anfrage als parameter mitgesendet werden

* /login
    * request: user+passwort
    * response: sessionid/error
    * session wird wenn möglich im cookie gespeichert

