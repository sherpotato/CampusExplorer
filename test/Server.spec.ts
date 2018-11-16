import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import {expect} from "chai";
import chaiHttp = require("chai-http");
import * as fs from "fs";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    this.timeout(10000);

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start();
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Hint on how to test PUT requests
    // /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .attach("body", "./test/data/courses.zip", "courses.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.deep.equal(200);
                    expect(res.body.result).to.deep.equal(["courses"]);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    // */
    it("Fail to Put test for correctDataSet dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/hello")
                .attach("body", "./test/data/correctDataSet.zip", "correctDataSet.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    // expect.fail();
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("POST test for datasets query", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/d3query/BB_q1_query.json", "utf8"));
            let resu = [
                {courses_dept: "cnps", courses_id: "574", courses_avg: 99.19},
                {courses_dept: "math", courses_id: "527", courses_avg: 99.78},
                {courses_dept: "math", courses_id: "527", courses_avg: 99.78}
            ];
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.deep.equal(200);
                    expect(res.body).to.deep.equal({result: resu});
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("Failed post query with error " + err);
        }
    });

    it("GET test for datasets", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets").then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("Failed to get listDatasets with err" + err);
        }
    });

    it("FAIL TO POST test for datasets query", function () {
        try {
            let query = JSON.parse(fs.readFileSync("./test/d3query/BB_q2_FALSEquery.json", "utf8"));
            return chai.request("http://localhost:4321")
                .post("/query")
                .send(query)
                .then(function (res: any) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("Failed post query with error " + err);
        }
    });

    it("DELETE test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.deep.equal(200);
                    expect(res.body).to.deep.equal({result: "courses"});
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("FAIL TO DELETE test for unexisting dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                .then(function (res: any) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(404);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("FAIL TO DELETE test for dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/")
                .then(function (res: any) {
                    // some logging here please!
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.deep.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
