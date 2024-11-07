'use strict';

const Thread = require('../models');

module.exports = function (app) {

  app.route('/api/threads/:board').post(async (req, res) => {
    const { board } = req.params;
    const { text, delete_password } = req.body;

    try {
      const thread = await Thread.create({
        board,
        text,
        delete_password,
        reported: false,
        replies: []
      });
      res.json(thread);
    } catch (error) {
      res.status(500).send('Error creating thread');
    }
  });

  app.route('/api/threads/:board').get(async (req, res) => {
    const { board } = req.params;
  
    try {
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-delete_password -reported')
        .lean();
  
      threads.forEach(thread => {
        thread.replies = thread.replies
          .slice(-3)
          .map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }));
      });
  
      res.json(threads);
    } catch (error) {
      res.status(500).send('Error fetching threads');
    }
  });

  app.route('/api/threads/:board').delete(async (req, res) => {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;
  
    try {
      const thread = await Thread.findOne({ _id: thread_id, board });

      if (!thread) {
        return res.status(404).send('Thread not found');
      }
  
      if (thread.delete_password !== delete_password) {
        return res.status(200).send('incorrect password');
      }  
      
      await Thread.deleteOne({ _id: thread_id });
      return res.status(200).send('success');
  
    } catch (error) {
      res.status(500).send('Error deleting thread');
    }
  });

  app.route('/api/threads/:board').put(async (req, res) => {
    const { board } = req.params;
    const { thread_id } = req.body;

    try {
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send('reported');
    } catch (error) {
      res.status(500).send('Error reporting thread');
    }
  });

  app.route('/api/replies/:board').post(async (req, res) => {
    const { board } = req.params;
    const { thread_id, text, delete_password } = req.body;

    try {
      const reply = {
        text,
        delete_password,
        reported: false,
        created_on: new Date()
      };

      const thread = await Thread.findOneAndUpdate(
        { _id: thread_id, board },
        { $push: { replies: reply }, $set: { bumped_on: new Date() } },
        { new: true }
      );

      res.json(thread);
    } catch (error) {
      res.status(500).send('Error posting reply');
    }
  });

  app.route('/api/replies/:board').get(async (req, res) => {
    const { board } = req.params;
    const { thread_id } = req.query;
  
    try {
      const thread = await Thread.findOne({ _id: thread_id, board })
        .select('-delete_password -reported')
        .lean();
  
      if (!thread) return res.status(404).send('Thread not found');
  
      thread.replies = thread.replies.map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      }));
  
      res.json(thread);
    } catch (error) {
      res.status(500).send('Error fetching thread');
    }
  });

  app.route('/api/replies/:board').delete(async (req, res) => {
    const { board } = req.params;
    const { thread_id, reply_id, delete_password } = req.body;

    try {
      const thread = await Thread.findOne({ _id: thread_id, board });
      const reply = thread.replies.id(reply_id);

      if (!reply) return res.send('Reply not found');
      if (reply.delete_password !== delete_password) return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    } catch (error) {
      res.status(500).send('Error deleting reply');
    }
  });

  app.route('/api/replies/:board').put(async (req, res) => {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;

    try {
      const thread = await Thread.findOne({ _id: thread_id, board });
      const reply = thread.replies.id(reply_id);

      if (!reply) return res.send('Reply not found');
      
      reply.reported = true;
      await thread.save();
      res.send('reported');
    } catch (error) {
      res.status(500).send('Error reporting reply');
    }
  });
};
