# Chat

The used prefixes are:
```
PREFIX mupush: <http://mu.semte.ch/vocabularies/push/>
```

This is a backend for generating push updates with mupush:type being `http://chat` .
The API consists of two endpoint:
- GET /messages:
    - will get the messages for a the tab (given it's MU-TAB-ID)
- POST /messages:
    - will generate a message for another tab, this follows the JSON:API spec
