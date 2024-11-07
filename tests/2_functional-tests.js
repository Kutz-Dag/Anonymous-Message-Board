const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    let testThreadId;
    let correctPassword = 'test_password';

    suiteSetup(function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({ text: 'Test thread for deletion', delete_password: correctPassword })
          .end((err, res) => {
            assert.equal(res.status, 200);
            testThreadId = res.body._id;
            done();
          });
    });

    let thread_id;
    let reply_id;

    test('POST /api/threads/{board} - create thread', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({ text: 'test thread', delete_password: 'pass' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            done();
          });
    });

    test('GET /api/threads/{board} - view threads', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            res.body.forEach(thread => {
              assert.isArray(thread.replies);
              assert.isAtMost(thread.replies.length, 3);
            });
            done();
          });
    });

    test('DELETE /api/threads/{board} - delete thread with incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({ thread_id: testThreadId, delete_password: 'wrong_password' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
    });

    test('DELETE /api/threads/{board} - delete thread with correct password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({ thread_id: testThreadId, delete_password: correctPassword })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
    });

    test('PUT /api/threads/{board} - report thread', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({ thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
          });
    });

    test('POST /api/replies/{board} - create reply', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({ text: 'test thread for reply', delete_password: 'pass' })
          .end((err, res) => {
            thread_id = res.body._id;
            chai.request(server)
              .post('/api/replies/test')
              .send({ text: 'test reply', delete_password: 'replypass', thread_id })
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.isObject(res.body);
                reply_id = res.body.replies[0]._id;
                done();
              });
          });
    });

    test('GET /api/replies/{board} - view single thread with replies', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({ thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.isArray(res.body.replies);
            done();
          });
    });

    test('DELETE /api/replies/{board} - delete reply with incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({ thread_id, reply_id, delete_password: 'wrongreplypass' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
    });

    test('DELETE /api/replies/{board} - delete reply with correct password', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({ thread_id, reply_id, delete_password: 'replypass' })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
    });

    test('PUT /api/replies/{board} - report reply', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({ thread_id, reply_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
          });
    });
});
