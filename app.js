import {
    app,
    uuid,
    query,
    sparqlEscape
} from "mu";

// Map to store the messages for a certain id
let messages = {}

// Get the messages for a certain tab, empty list if there are no messages for the tab
app.get('/messages/', async function(req, res) {
    let id = req.get("MU-TAB-ID");
    res.send({
        data: messages[id] || []
    })
})

// Add a message for a certain tab
app.post('/messages/', async function(req, res) {
    // Get the sender id
    let id = req.get("MU-TAB-ID");
    let data = req.body.data;
    // Get the receiver id
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
    // Add the message
    if (!messages[toId]) {
        messages[toId] = []
    }
    messages[toId].push(data);
    // Send the message back to the creator
    res.send({
        data: data
    })

    // Create a push update for the receiving tab that they have a new message and should refresh their messages
    let uuidValue = uuid();
    let value = sparqlEscape(JSON.stringify({}), 'string')
    let dateISOString = now.toISOString()
    let type = "http://refresh"
    let realm = "http://chat"
    let q = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX mupush: <http://mu.semte.ch/vocabularies/push/>
    PREFIX dc:  <http://purl.org/dc/terms/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    INSERT DATA {
        GRAPH<http://mu.semte.ch/application> {
            <http://semte.baert.jp.net/push-updates/v0.1/${uuidValue}>  a mupush:PushUpdate;
                                                                        mu:uuid ${sparqlEscape(uuidValue, 'string')};
                                                                        mupush:tabId ${sparqlEscape(toId, 'string')};
                                                                        mupush:realm <${realm}>;
                                                                        mupush:type <${type}>;
                                                                        rdf:value ${value};
                                                                        dc:created ${sparqlEscape(dateISOString, 'string')}^^xsd:dateTime.
        }
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
