import {
    app,
    uuid,
    query,
    sparqlEscape
} from "mu";

let messages = {}

app.get('/messages/', async function(req, res) {
    let id = req.get("MU-TAB-ID");
    res.send({
        data: messages[id] || []
    })
})

app.post('/messages/', async function(req, res) {
    let id = req.get("MU-TAB-ID");
    let data = req.body.data;
    let toId = data.attributes.to;
    let now = new Date();
    data.id = uuid()
    data.attributes.from = id
    data.attributes.time = now.toLocaleDateString(undefined, {
        timeZone: "Europe/Brussels",
        dateStyle: 'full',
        timeStyle: 'long',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    if (!messages[toId]) {
        messages[toId] = []
    }
    messages[toId].push(data);
    let test = []
    res.send({
        data: data
    })

    let uuidValue = uuid();
    let value = sparqlEscape(JSON.stringify({
        refresh: true
    }), 'string')
    let dateISOString = now.toISOString()
    let type = "http://chat"
    let q = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX mupush: <http://mu.semte.ch/vocabularies/push/>
    PREFIX dc:  <http://purl.org/dc/terms/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    INSERT INTO <http://mu.semte.ch/application> {
        <http://semte.baert.jp.net/push-updates/v0.1/${uuidValue}>  mu:uuid ${sparqlEscape(uuidValue, 'string')};
                                                                    a mupush:PushUpdate;
                                                                    mupush:tabId ${sparqlEscape(toId, 'string')};
                                                                    mupush:type <${type}>;
                                                                    rdf:value ${value};
                                                                    dc:created ${sparqlEscape(dateISOString, 'string')}^^xsd:dateTime.
    }
    `
    query(q)
        .then(() => {
            console.log(`Added push update for ${id}`)
        })
        .catch((err) => {
            console.error(err)
        })
})
