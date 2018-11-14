/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        // TODO: implement!
        // reffrence piazza cid=1431
        try{
            let xhr = new XMLHttpRequest();
            xhr.open("POST", 'http://localhost:4321/query', true);

            //Send the proper header information along with the request
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onload = function () { // Call a function when the state changes.
                fulfill(xhr.response);
            };
            xhr.send(JSON.stringify(query));
            console.log("CampusExplorer.sendQuery implemented.");
        } catch (e) {
            reject(e);
        }
    });
};
