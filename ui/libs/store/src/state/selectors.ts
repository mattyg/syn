import type { ChangeBundle, LastDeltaSeen, Session } from '@syn/zome-client';
import type {
  AgentPubKeyB64,
  EntryHashB64,
} from '@holochain-open-dev/core-types';
import type { SessionState, SynState } from './syn-state';
import type { SynWorkspace } from '../internal/workspace';
import type { SynGrammar } from '../grammar';

export function amIScribe<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): boolean {
  return selectScribe(synState, sessionHash) === synState.myPubKey;
}

export function selectScribe<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): AgentPubKeyB64 {
  const session = synState.sessions[sessionHash];
  return session.scribe;
}

export function selectLastCommitTime<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): number {
  const session = synState.joinedSessions[sessionHash];
  if (session.lastCommitHash)
    return synState.commits[session.lastCommitHash].createdAt;
  return synState.sessions[sessionHash].createdAt;
}

export function selectSession<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): Session {
  return synState.sessions[sessionHash];
}

export function selectSessionState<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): SessionState<G> {
  return synState.joinedSessions[sessionHash];
}

export function areWeJoiningSession<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): boolean {
  return !!synState.joiningSessions[sessionHash];
}

export function selectLatestSnapshotHash<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64
): EntryHashB64 | undefined {
  const session = selectSessionState(synState, sessionHash);
  if (!session || !session.lastCommitHash) return undefined;
  return synState.commits[session.lastCommitHash].newContentHash;
}

export function selectMissedUncommittedChanges<G extends SynGrammar<any, any>>(
  synState: SynState<G>,
  sessionHash: EntryHashB64,
  lastDeltaSeen: LastDeltaSeen | undefined
): ChangeBundle {
  const sessionState = synState.joinedSessions[sessionHash];

  if (
    !lastDeltaSeen ||
    lastDeltaSeen.commitHash !== sessionState.lastCommitHash
  ) {
    return sessionState.uncommittedChanges;
  } else {
    // Only return the changes that they haven't seen yet
    return {
      deltas: sessionState.uncommittedChanges.deltas.slice(
        lastDeltaSeen.deltaIndexInCommit
      ),
      authors: sessionState.uncommittedChanges.authors, // TODO: optimization of only sending the authors of the missed deltas?
    };
  }
}

export function selectLastDeltaSeen<G extends SynGrammar<any, any>>(
  sessionState: SessionState<G>
): LastDeltaSeen {
  return {
    commitHash: sessionState.lastCommitHash,
    deltaIndexInCommit: sessionState.uncommittedChanges.deltas.length,
  };
}

export function selectFolksInSession<G extends SynGrammar<any, any>>(
  workspace: SynWorkspace<G>,
  sessionState: SessionState<G>
): AgentPubKeyB64[] {
  return Object.entries(sessionState.folks)
    .filter(
      ([_, info]) =>
        Date.now() - info.lastSeen < workspace.config.outOfSessionTimeout
    )
    .map(([f, _]) => f);
}
