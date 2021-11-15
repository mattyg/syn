import type { EntryHashB64 } from '@holochain-open-dev/core-types';
import type { SynEngine } from '../../../engine';

import { amIScribe } from '../../../state/selectors';
import type { SynWorkspace } from '../../workspace';

// Pick and join a session
export async function joinSession<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
): Promise<void> {
  const session = await workspace.client.getSession(sessionHash);

  return new Promise((resolve, reject) => {
    const joiningResolve = () => {
      workspace.store.update(state => {
        state.activeSessionHash = sessionHash;
        return state;
      });

      resolve();
    };

    workspace.store.update(state => {
      state.sessions[sessionHash] = session;

      state.joiningSessions[sessionHash] = joiningResolve;

      if (session.scribe !== state.myPubKey) {
        workspace.client.sendSyncRequest({
          scribe: session.scribe,
          sessionHash: sessionHash,
          lastDeltaSeen: undefined,
        });
      }

      return state;
    });

    setTimeout(() => {
      workspace.store.update(state => {
        delete state.joiningSessions[sessionHash];
        return state;
      });
      reject('Could not connect to the scribe of the session');
    }, 3000);
  });
}

export async function handleSessionClosed<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
) {
  workspace.store.update(synState => {
    if (amIScribe(synState, sessionHash)) {
      console.log(
        "SessionClosed received but I'm the scribe! Not closing the session"
      );
      return synState;
    }

    delete synState.sessions[sessionHash];
    delete synState.joinedSessions[sessionHash];

    if (synState.activeSessionHash === sessionHash) {
      synState.activeSessionHash = undefined;
    }

    return synState;
  });
  for (const listener of workspace.listeners) {
    if (
      listener.event === 'session-closed' &&
      listener.sessionHash === sessionHash
    ) {
      listener.listener();
    }
  }
}

export async function folkLeaveSession<E extends SynEngine<any, any>>(
  workspace: SynWorkspace<E>,
  sessionHash: EntryHashB64
) {
  workspace.store.update(state => {
    (state.joinedSessions[sessionHash] as any) = undefined;
    delete state.joinedSessions[sessionHash];
    if (state.activeSessionHash === sessionHash)
      state.activeSessionHash = undefined;

    workspace.client.notifyLeaveSession({
      sessionHash,
      scribe: state.sessions[sessionHash].scribe,
    });
    return state;
  });
}
