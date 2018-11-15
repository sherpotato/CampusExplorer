import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import {expect} from "chai";
import chaiHttp = require("chai-http");

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

    it("DELETE test for courses dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/courses")
                // .attach("body", "./test/data/courses.zip", "courses.zip")
                .then(function (res: any) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                    // expect(res.body).to.be.deep.equal("courses");
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
