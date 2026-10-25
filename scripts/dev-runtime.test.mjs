import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { classifyPostgresProbe, gradleWrapperForPlatform, isTcpPortOpen } from './dev-runtime.mjs';

test('uses the Gradle wrapper for the current shell platform', () => {
  assert.equal(gradleWrapperForPlatform('win32'), 'gradlew.bat');
  assert.equal(gradleWrapperForPlatform('linux'), './gradlew');
  assert.equal(gradleWrapperForPlatform('darwin'), './gradlew');
});

test('detects an occupied TCP port without platform-specific shell commands', async () => {
  class ConnectedSocket extends EventEmitter {
    setTimeout() {}
    destroy() {}
    connect() {
      queueMicrotask(() => this.emit('connect'));
    }
  }

  assert.equal(await isTcpPortOpen(5432, { createSocket: () => new ConnectedSocket() }), true);
});

test('identifies a PostgreSQL credential conflict separately from an unavailable server', () => {
  assert.equal(
    classifyPostgresProbe({
      status: 2,
      stderr: 'FATAL: password authentication failed for user "recipe"',
    }),
    'credentials-rejected',
  );
  assert.equal(
    classifyPostgresProbe({
      status: 2,
      stderr: 'could not connect to server: Connection refused',
    }),
    'unreachable',
  );
});
