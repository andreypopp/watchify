var spawn = require('child_process').spawn;
var fs = require('fs');
var tempfile = require('tempfile');
var aggregate = require('stream-aggregate');
var touch = require('touch');
var split = require('char-split');
var through = require('through');
var test = require('tap').test;
var join = require('path').join;

function filename(p) {
  return join(__dirname, p);
}

function after(ms, fn) {
  setTimeout(fn, ms);
}

function decode() {
  return through(function(c) { return c.toString(); });
}

test('simple workflow', function(t) {
  t.plan(5);

  var out = tempfile();
  var w = spawn(
    filename('../bin/cmd.js'),
    [filename('./fixtures/main.js'), '-o', out, '-v']);

  after(1000, function() {
    touch.sync(filename('./fixtures/dep.js'));
    after(1000, function() {
      w.kill();
      aggregate(w.stderr, function(err, stderr) {
        try {
          t.ok(!err, 'no error expected');
          stderr = stderr.toString().split('\n').filter(Boolean);
          t.equal(stderr.length, 2, 'stderr has two lines');
          t.equal(stderr[0], stderr[1], 'lines are identical');
          t.ok(new RegExp(out).exec(stderr[0]), 'lines contain output filename');
          var bundle = fs.readFileSync(out, 'utf8');
          t.ok(bundle.length > 0, 'bundle is not empty');
          t.end();
        } finally {
          fs.unlink(out);
        }
      });
    });
  });

});

test('workflow with transform', function(t) {
  t.plan(5);

  var out = tempfile();
  var w = spawn(
    filename('../bin/cmd.js'),
    [filename('./fixtures/with-transform.js'), '-t', 'brfs', '-o', out, '-v']);

  after(1000, function() {
    touch.sync(filename('./fixtures/robot.html'));
    after(1000, function() {
      w.kill();
      aggregate(w.stderr, function(err, stderr) {
        try {
          t.ok(!err, 'no error expected');
          stderr = stderr.toString().split('\n').filter(Boolean);
          t.equal(stderr.length, 2, 'stderr has two lines');
          t.equal(stderr[0], stderr[1], 'lines are identical');
          t.ok(new RegExp(out).exec(stderr[0]), 'lines contain output filename');
          var bundle = fs.readFileSync(out, 'utf8');
          t.ok(bundle.length > 0, 'bundle is not empty');
          t.end();
        } finally {
          fs.unlink(out);
        }
      });
    });
  });

});
