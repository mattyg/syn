use change::{ChangeNotice, ChangeRequest, ChangeRequestPayload};
use commit::CommitNotice;
use folks::{register_as_folk, FolkLore, Heartbeat};
use hdk::prelude::holo_hash::*;
use hdk::prelude::*;

mod change;
mod commit;
mod error;
mod folks;
mod session;
mod snapshot;
mod sync;
mod utils;

use session::Session;

use crate::commit::Commit;
use snapshot::Snapshot;
use sync::SyncPayload;

enum SynLinkType {
    PathToFolk = 0,
    PathToCommit = 1,
    PathToSnapshot = 2,
    PreviousCommit = 3,
    PathToSession = 4,
}

impl From<SynLinkType> for LinkType {
    fn from(hdk_link_type: SynLinkType) -> Self {
        Self(hdk_link_type as u8)
    }
}

entry_defs![
    PathEntry::entry_def(),
    Snapshot::entry_def(),
    Commit::entry_def(),
    Session::entry_def()
];

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SynInput<T> {
    pub session_hash: EntryHashB64,
    pub to: AgentPubKeyB64,
    pub payload: T,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignalPayload {
    pub from: AgentPubKeyB64,
    pub syn_message: SynMessage,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SynMessage {
    pub session_hash: EntryHashB64,
    pub session_message: SessionMessage,
}

impl SynMessage {
    fn new(session_hash: EntryHashB64, message: SessionMessage) -> Self {
        SynMessage {
            session_hash,
            session_message: message,
        }
    }
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(tag = "type", content = "payload")]
enum SessionMessage {
    SyncRequest(SyncPayload), // content is who the request is from
    SyncResponse(SyncPayload),
    ChangeReq(ChangeRequestPayload),
    ChangeNotice(ChangeNotice),
    Heartbeat(Heartbeat), // signal to scribe for maintaining participant info
    FolkLore(FolkLore),   // signal to participants to update other participants info
    CommitNotice(CommitNotice), // signal for sending commit and content hash after commit
    SessionClosed,
    LeaveSessionNotice,
}

#[hdk_extern]
fn recv_remote_signal(signal: ExternIO) -> ExternResult<()> {
    let syn_message: SynMessage = signal.decode()?;

    let from = call_info()?.provenance;

    let payload = SignalPayload {
        from: from.into(),
        syn_message,
    };

    debug!("Received remote signal {:?}", payload);
    Ok(emit_signal(&payload)?)
}

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "receive_change".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;

    register_as_folk()?;

    Ok(InitCallbackResult::Pass)
}
