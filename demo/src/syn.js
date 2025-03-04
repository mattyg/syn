import { AppAgentWebsocket } from '@holochain/client';
import { extractSlice } from '@holochain-syn/core';
import { textEditorGrammar } from '@holochain-syn/text-editor';

export const DocumentGrammar = {
  initState(state) {
    state.title = '';
    state.body = {};
    textEditorGrammar.initState(state.body);
  },
  applyDelta(delta, state, eph, author) {
    if (delta.type === 'SetTitle') {
      state.title = delta.value;
    } else {
      textEditorGrammar.applyDelta(
        delta.textEditorDelta,
        state.body,
        eph,
        author
      );
    }
  },
};

export function textSlice(sessionStore) {
  return extractSlice(
    sessionStore,
    change => ({
      type: 'TextEditorDelta',
      textEditorDelta: change,
    }),
    state => state.body,
    eph => eph
  );
}

export async function createClient() {
  //const url = `ws://localhost:${process.env.HC_PORT}`;

  const client = await AppAgentWebsocket.connect(undefined, 'syn');

  return client;
}
