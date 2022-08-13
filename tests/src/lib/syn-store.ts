import {
  Config,
  InstallAgentsHapps,
  Player,
  ConfigSeed,
} from '@holochain/tryorama';

import { get } from 'svelte/store';
import { SynGrammar, SynStore, SynClient } from '@holochain-syn/core';
import { TextEditorDeltaType } from '../grammar.js';
import Automerge from 'automerge';

import { Content, delay, sampleGrammar, synDna, TextDelta } from '../common.js';
import { spawnSyn } from './spawn.js';

const config = Config.gen();

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});

export const oFn = orchestrator => {
  orchestrator.registerScenario('syn 2 nodes', async (s, t) => {
    const aliceClient = await spawnSyn(s, config);
    const bobClient = await spawnSyn(s, config);

    const aliceSyn = new SynStore(new SynClient(aliceClient));
    const bobSyn = new SynStore(new SynClient(bobClient));

    const { initialCommitHash } = await aliceSyn.createRoot(sampleGrammar);
    const workspaceHash = await aliceSyn.createWorkspace(
      {
        name: 'main',
        meta: undefined,
      },
      initialCommitHash
    );

    const aliceWorkspaceStore = await aliceSyn.joinWorkspace(
      workspaceHash,
      sampleGrammar
    );
    
    t.ok(aliceWorkspaceStore.workspaceHash);

    await delay(2000);

    const bobWorkspaceStore = await bobSyn.joinWorkspace(workspaceHash, sampleGrammar);

    aliceWorkspaceStore.requestChanges([{ type: 'Title', value: 'A new title' }]);

    await delay(2000);

    let participants = get(aliceWorkspaceStore.participants);
    t.equal(participants.active.length, 1);

    let currentState = get(bobWorkspaceStore.state);
    t.equal(currentState.title, 'A new title');

    aliceWorkspaceStore.requestChanges([
      { type: 'Title', value: 'Another thing' },
    ]);

    await delay(1000);

    currentState = get(bobWorkspaceStore.state);
    t.equal(currentState.title, 'Another thing');

    bobWorkspaceStore.requestChanges([
      { type: 'Title', value: 'Bob is the boss' },
    ]);

    await delay(1000);

    currentState = get(bobWorkspaceStore.state);
    t.equal(currentState.title, 'Bob is the boss');

    currentState = get(aliceWorkspaceStore.state);
    t.equal(currentState.title, 'Bob is the boss');

    bobWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 0, text: 'Hi ' },
      { type: TextEditorDeltaType.Insert, position: 3, text: 'there' },
    ]);

    await delay(1000);

    currentState = get(aliceWorkspaceStore.state);
    t.equal(currentState.body.text.toString(), 'Hi there');

    currentState = get(bobWorkspaceStore.state);
    t.equal(currentState.body.text.toString(), 'Hi there');

    // Test concurrent

    aliceWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'alice ' },
    ]);
    bobWorkspaceStore.requestChanges([
      { type: TextEditorDeltaType.Insert, position: 3, text: 'bob ' },
    ]);

    await delay(1000);

    const currentStateAlice = get(aliceWorkspaceStore.state);
    const currentStateBob = get(bobWorkspaceStore.state);
    t.equal(
      currentStateAlice.body.text.toString(),
      currentStateBob.body.text.toString()
    );

    await bobWorkspaceStore.leaveWorkspace();

    await delay(1000);

    participants = get(aliceWorkspaceStore.participants);

    t.equal(participants.active.length, 0);

    await bobWorkspaceStore.leaveWorkspace();

    process.exit(0);
  });
};
