use hdk::prelude::*;

#[derive(Serialize, Debug, Deserialize)]
#[serde(tag = "type")]
pub enum MessagePayload {
    JoinSession,
    LeaveSession,
    ChangeNotice {
        state_changes: Vec<SerializedBytes>,
        ephemeral_changes: Vec<SerializedBytes>,
    },
    NewCommit {
        new_commit_hash: EntryHash,
    },
    SyncReq {
        sync_message: Option<SerializedBytes>,
        ephemeral_sync_message: Option<SerializedBytes>,
    },
    Heartbeat {
        known_participants: Vec<AgentPubKey>,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SessionMessage {
    pub workspace_hash: EntryHash,
    pub payload: MessagePayload,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageInput {
    pub message: SessionMessage,
    pub recipients: Vec<AgentPubKey>,
}

#[hdk_extern]
pub fn send_message(input: SendMessageInput) -> ExternResult<()> {
    remote_signal(input.message, input.recipients)?;

    Ok(())
}
